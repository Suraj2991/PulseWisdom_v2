import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { IUser, UserDocument } from '../../domain/models/User';
import { BirthChartService } from './BirthChartService';
import { ValidationError, NotFoundError, DatabaseError, CacheError, AppError } from '../../domain/errors';
import { ICache } from '../../infrastructure/cache/ICache';
import { logger } from '../../shared/logger';
import { Validator } from '../../shared/validation';
import { UserRepository } from '../../infrastructure/database/UserRepository';
import { config } from '../../shared/config';
import { UserDTO } from '../../domain/dtos/UserDTO';
import { UserTransformer } from '../../domain/transformers/UserTransformer';

export class UserService {
  private readonly USER_CACHE_PREFIX = 'user:';
  private readonly USER_CACHE_TTL = 3600; // 1 hour

  constructor(
    private readonly cache: ICache,
    private readonly birthChartService: BirthChartService,
    private readonly userRepository: UserRepository
  ) {}

  private validateUserData(userData: Partial<IUser>): void {
    if (userData.email) {
      Validator.validateEmail(userData.email);
    }

    if (userData.password) {
      Validator.validatePassword(userData.password);
    }

    if (userData.birthDate) {
      Validator.validateDate(userData.birthDate);
    }

    if (userData.birthTime) {
      Validator.validateTime(userData.birthTime);
    }

    if (userData.birthLocation) {
      Validator.validateLocation(userData.birthLocation);
    }
  }

  private async cacheUser(user: UserDocument): Promise<void> {
    try {
      const userDTO = UserTransformer.toDTO(user);
      await this.cache.set(
        `${this.USER_CACHE_PREFIX}${user._id.toString()}`,
        userDTO,
        this.USER_CACHE_TTL
      );
    } catch (error) {
      logger.error('Failed to cache user', { error });
      throw new CacheError('Failed to cache user data');
    }
  }

  private async clearUserCache(userId: string): Promise<void> {
    try {
      await this.cache.delete(`${this.USER_CACHE_PREFIX}${userId}`);
    } catch (error) {
      logger.error('Failed to clear user cache', { error });
      throw new CacheError('Failed to clear user cache');
    }
  }

  private handleError(message: string, error: unknown): never {
    logger.error(message, { error });
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(message, 'USER_SERVICE_ERROR', 500, { originalError: error });
  }

  async createUser(userData: Partial<IUser>): Promise<UserDTO> {
    try {
      this.validateUserData(userData);
      
      if (!userData.birthDate) {
        throw new ValidationError('Birth date is required');
      }

      if (!userData.birthLocation) {
        throw new ValidationError('Birth location is required');
      }

      const hashedPassword = await bcrypt.hash(userData.password!, 10);
      const user = await this.userRepository.createUser({
        email: userData.email!.toLowerCase(),
        password: hashedPassword,
        role: userData.role || 'user',
        firstName: userData.firstName,
        lastName: userData.lastName,
        birthDate: userData.birthDate,
        birthTime: userData.birthTime,
        birthLocation: userData.birthLocation,
        isEmailVerified: false,
        preferences: {
          timezone: 'UTC',
          houseSystem: 'placidus',
          aspectOrbs: 8,
          themePreferences: {
            colorScheme: 'light',
            fontSize: 'medium',
            showAspects: true,
            showHouses: true,
            showPlanets: true,
            showRetrogrades: true,
            showLunarPhases: true,
            showEclipses: true,
            showStations: true,
            showHeliacal: true,
            showCosmic: true
          },
          insightPreferences: {
            categories: [],
            severity: ['high', 'medium', 'low'],
            types: [],
            showRetrogrades: true,
            showEclipses: true,
            showStations: true,
            showHeliacal: true,
            showCosmic: true,
            dailyInsights: true,
            progressionInsights: true,
            lifeThemeInsights: true,
            birthChartInsights: true
          },
          notificationPreferences: {
            email: {
              enabled: true,
              types: []
            },
            push: {
              enabled: true,
              types: []
            }
          }
        },
        activityHistory: []
      });
      await this.cacheUser(user as UserDocument);
      return UserTransformer.toDTO(user as UserDocument);
    } catch (error) {
      throw this.handleError('Failed to create user', error);
    }
  }

  async getUserById(userId: string): Promise<UserDTO> {
    try {
      const cachedUser = await this.cache.get<UserDTO>(`${this.USER_CACHE_PREFIX}${userId}`);
      if (cachedUser) {
        return cachedUser;
      }

      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      await this.cacheUser(user as UserDocument);
      return UserTransformer.toDTO(user as UserDocument);
    } catch (error) {
      throw this.handleError('Failed to get user by ID', error);
    }
  }

  async getUserByEmail(email: string): Promise<UserDTO> {
    try {
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        throw new NotFoundError('User not found');
      }
      return UserTransformer.toDTO(user as UserDocument);
    } catch (error) {
      throw this.handleError('Failed to get user by email', error);
    }
  }

  async updateUser(userId: string, userData: Partial<IUser>): Promise<UserDTO> {
    try {
      this.validateUserData(userData);
      const user = await this.userRepository.updateUser(userId, userData);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      await this.clearUserCache(userId);
      return UserTransformer.toDTO(user as UserDocument);
    } catch (error) {
      throw this.handleError('Failed to update user', error);
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      const deleted = await this.userRepository.deleteUser(userId);
      if (!deleted) {
        throw new NotFoundError('User not found');
      }

      await this.clearUserCache(userId);
    } catch (error) {
      throw this.handleError('Failed to delete user', error);
    }
  }

  async updateUserPreferences(userId: string, preferences: Partial<IUser['preferences']>): Promise<UserDTO> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      const updatedPreferences = {
        ...user.preferences,
        ...preferences,
        themePreferences: {
          ...user.preferences.themePreferences,
          ...preferences.themePreferences
        },
        insightPreferences: {
          ...user.preferences.insightPreferences,
          ...preferences.insightPreferences
        },
        notificationPreferences: {
          ...user.preferences.notificationPreferences,
          ...preferences.notificationPreferences
        }
      };

      const updatedUser = await this.userRepository.updateUser(userId, { preferences: updatedPreferences });
      if (!updatedUser) {
        throw new NotFoundError('User not found');
      }

      await this.clearUserCache(userId);
      return UserTransformer.toDTO(updatedUser as UserDocument);
    } catch (error) {
      throw this.handleError('Failed to update user preferences', error);
    }
  }

  async searchUsers(query: string): Promise<UserDTO[]> {
    try {
      const users = await this.userRepository.searchUsers(query);
      return users.map(user => UserTransformer.toDTO(user as UserDocument));
    } catch (error) {
      throw this.handleError('Failed to search users', error);
    }
  }
}