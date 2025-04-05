import { Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, IUser } from '../../domain/models/User';
import { BirthChartService } from './BirthChartService';
import { ValidationError, NotFoundError, DatabaseError } from '../../domain/errors';
import { ICache } from '../../infrastructure/cache/ICache';
import { RedisCache } from '../../infrastructure/cache/RedisCache';
import { EphemerisService } from './EphemerisService';

// Define a type that includes the _id field
interface UserWithId extends IUser {
  _id: Types.ObjectId;
}

type UserDocument = UserWithId;

export class UserService {
  private readonly USER_CACHE_PREFIX = 'user:';
  private readonly USER_CACHE_TTL = 3600; // 1 hour
  private readonly cache: ICache;
  private readonly birthChartService: BirthChartService;

  constructor(cache: ICache, birthChartService: BirthChartService) {
    this.cache = cache;
    this.birthChartService = birthChartService;
  }

  private validateUserData(userData: Partial<IUser>): void {
    if (userData.email && !this.isValidEmail(userData.email)) {
      throw new ValidationError('Invalid email format');
    }

    if (userData.password && !this.isValidPassword(userData.password)) {
      throw new ValidationError('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character');
    }

    if (userData.birthDate && !this.isValidDate(userData.birthDate)) {
      throw new ValidationError('Invalid birth date');
    }

    if (userData.birthTime && !this.isValidTime(userData.birthTime)) {
      throw new ValidationError('Invalid birth time format (HH:mm)');
    }

    if (userData.birthLocation) {
      this.validateLocation(userData.birthLocation);
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPassword(password: string): boolean {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  private isValidDate(date: Date): boolean {
    return date instanceof Date && !isNaN(date.getTime());
  }

  private isValidTime(time: string): boolean {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  private validateLocation(location: { latitude: number; longitude: number; placeName: string }): void {
    if (location.latitude < -90 || location.latitude > 90) {
      throw new ValidationError('Invalid latitude');
    }
    if (location.longitude < -180 || location.longitude > 180) {
      throw new ValidationError('Invalid longitude');
    }
    if (!location.placeName || location.placeName.trim().length === 0) {
      throw new ValidationError('Place name is required');
    }
  }

  async createUser(userData: Omit<IUser, '_id' | 'createdAt' | 'updatedAt'>): Promise<UserDocument> {
    try {
      this.validateUserData(userData);
      const existingUser = await this.getUserByEmail(userData.email);
      if (existingUser) {
        throw new ValidationError('Email already exists');
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await User.create({
        ...userData,
        password: hashedPassword,
      });

      const savedUser = await user.save();
      await this.cacheUser(savedUser as UserDocument);
      return savedUser as UserDocument;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error('Error creating user:', error);
      throw new DatabaseError('Failed to create user');
    }
  }

  async getUserById(id: string): Promise<UserDocument> {
    try {
      const cacheKey = this.getUserCacheKey(id);
      const cachedUser = await this.cache.get<UserDocument>(cacheKey);
      if (cachedUser) {
        return cachedUser;
      }

      const user = await User.findById(id);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      await this.cacheUser(user as UserDocument);
      return user as UserDocument;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error getting user by id:', error);
      throw new DatabaseError('Failed to get user');
    }
  }

  async getUserByEmail(email: string): Promise<UserDocument | null> {
    try {
      const normalizedEmail = email.toLowerCase();
      const user = await User.findOne({ email: normalizedEmail });
      if (user) {
        await this.cacheUser(user as UserDocument);
      }
      return user as UserDocument | null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw new DatabaseError('Failed to get user');
    }
  }

  async updateUser(id: string, updateData: Partial<IUser>): Promise<IUser> {
    try {
      this.validateUserData(updateData);

      // Remove sensitive and system fields
      const { 
        password, 
        role, 
        isEmailVerified, 
        _id, 
        createdAt, 
        updatedAt,
        ...safeUpdates 
      } = updateData;

      if (safeUpdates.email) {
        const existingUser = await this.getUserByEmail(safeUpdates.email);
        if (existingUser && existingUser._id.toString() !== id) {
          throw new ValidationError('Email already in use');
        }
        safeUpdates.email = safeUpdates.email.toLowerCase();
      }

      const updatedUser = await User.findByIdAndUpdate(
        id, 
        { $set: safeUpdates }, 
        { 
          new: true, 
          runValidators: true,
          context: 'query'
        }
      );

      if (!updatedUser) {
        throw new NotFoundError('User not found');
      }

      await this.cacheUser(updatedUser as UserDocument);
      return updatedUser;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error updating user:', error);
      throw new DatabaseError('Failed to update user');
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      const result = await User.findByIdAndDelete(id);
      if (result) {
        await this.clearUserCache(id);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new DatabaseError('Failed to delete user');
    }
  }

  async updateUserPreferences(
    id: string,
    preferences: IUser['preferences']
  ): Promise<IUser> {
    try {
      // Validate preferences structure
      if (!preferences || typeof preferences !== 'object') {
        throw new ValidationError('Invalid preferences data');
      }

      // Validate specific preference fields
      this.validatePreferences(preferences);

      const updatedUser = await User.findByIdAndUpdate(
        id,
        { $set: { preferences } },
        { 
          new: true, 
          runValidators: true,
          context: 'query'
        }
      );

      if (!updatedUser) {
        throw new NotFoundError('User not found');
      }

      await this.cacheUser(updatedUser as UserDocument);
      return updatedUser;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error updating user preferences:', error);
      throw new DatabaseError('Failed to update user preferences');
    }
  }

  private validatePreferences(preferences: IUser['preferences']): void {
    const { themePreferences, notificationPreferences } = preferences;

    if (themePreferences?.colorScheme && !['light', 'dark'].includes(themePreferences.colorScheme)) {
      throw new ValidationError('Invalid color scheme preference');
    }

    if (notificationPreferences) {
      if (typeof notificationPreferences !== 'object') {
        throw new ValidationError('Invalid notification preferences format');
      }

      // Add any specific notification preference validations here if needed
    }
  }

  async validatePassword(user: IUser, password: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, user.password);
    } catch (error) {
      console.error('Error validating password:', error);
      throw new DatabaseError('Failed to validate password');
    }
  }

  async getUserBirthCharts(userId: string) {
    try {
      return await this.birthChartService.getBirthChartsByUserId(userId);
    } catch (error) {
      console.error('Error getting user birth charts:', error);
      throw new DatabaseError('Failed to get user birth charts');
    }
  }

  async searchUsers(query: string, limit: number = 10): Promise<IUser[]> {
    try {
      return await User.find({
        $or: [
          { email: { $regex: query, $options: 'i' } },
          { name: { $regex: query, $options: 'i' } }
        ]
      }).limit(limit);
    } catch (error) {
      console.error('Error searching users:', error);
      throw new DatabaseError('Failed to search users');
    }
  }

  private async cacheUser(user: UserDocument): Promise<void> {
    try {
      if (!user || !user._id) {
        console.warn('Cannot cache user: Invalid user object');
        return;
      }
      const cacheKey = this.getUserCacheKey(user._id.toString());
      await this.cache.set(cacheKey, user, this.USER_CACHE_TTL);
    } catch (error) {
      console.warn('Failed to cache user:', error);
    }
  }

  private async getCachedUser(userId: string): Promise<IUser | null> {
    try {
      const cacheKey = this.getUserCacheKey(userId);
      return await this.cache.get(cacheKey);
    } catch (error) {
      console.warn('Failed to get cached user:', error);
      return null;
    }
  }

  private async clearUserCache(userId: string): Promise<void> {
    try {
      const cacheKey = this.getUserCacheKey(userId);
      await this.cache.delete(cacheKey);
    } catch (error) {
      console.warn('Failed to clear user cache:', error);
    }
  }

  private getUserCacheKey(userId: string): string {
    return `${this.USER_CACHE_PREFIX}${userId}`;
  }
}

// Initialize services
const cache = new RedisCache('redis://localhost:6379');
const ephemerisService = new EphemerisService(cache, 'http://localhost:3000');
const birthChartService = new BirthChartService(cache, ephemerisService);
export const userService = new UserService(cache, birthChartService);