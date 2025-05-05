import { ICache } from '../../../infrastructure/cache/ICache';
import { BirthChartService } from '../../birthchart';
import { UserRepository } from '../database/UserRepository';
import { IUser, UserDocument } from '../models/UserModel';
import { UserDTO } from '../dtos/UserDTO';  
import { UserTransformer } from '../transformers/UserTransformer';
import { ValidationError, NotFoundError, DatabaseError } from '../../../domain/errors';
import { validateUserRegistration } from '../validators/user.validator';
import { USER_ROLES, USER_STATUS, USER_ACTIVITY } from '../../../shared/constants/user';
import bcrypt from 'bcryptjs';
import { logger } from '../../../shared/logger';
import { IBirthChart } from '../../birthchart/types/birthChart.types';

const DEFAULT_USER_PREFERENCES = {
  timezone: 'UTC',
  houseSystem: 'placidus' as const,
  aspectOrbs: 8,
  themePreferences: {
    colorScheme: 'light' as const,
    fontSize: 'medium' as const,
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
    categories: [] as string[],
    severity: ['high', 'medium', 'low'] as ('high' | 'medium' | 'low')[],
    types: [] as string[],
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
      types: [] as string[]
    },
    push: {
      enabled: true,
      types: [] as string[]
    }
  }
} as const;

export class UserService {
  private readonly USER_CACHE_PREFIX = 'user:';
  private readonly USER_CACHE_TTL = 3600; // 1 hour

  constructor(
    private readonly cache: ICache,
    private readonly birthChartService: BirthChartService,
    private readonly userRepository: UserRepository
  ) {}

  private async cacheUser(user: IUser): Promise<void> {
    try {
      const cacheKey = `${this.USER_CACHE_PREFIX}${user._id}`;
      await this.cache.set(cacheKey, user, this.USER_CACHE_TTL);
    } catch (error) {
      logger.error('Failed to cache user', { error, userId: user._id });
    }
  }

  private async clearUserCache(userId: string): Promise<void> {
    try {
      const cacheKey = `${this.USER_CACHE_PREFIX}${userId}`;
      await this.cache.delete(cacheKey);
    } catch (error) {
      logger.error('Failed to clear user cache', { error, userId });
    }
  }

  private handleError(message: string, error: unknown): Error {
    logger.error(message, { 
      error,
      service: 'UserService',
      timestamp: new Date().toISOString()
    });
    
    if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof DatabaseError) {
      return error;
    }
    
    return new Error(message + ': ' + String(error));
  }

  async createUser(userData: Partial<IUser>): Promise<UserDTO> {
    try {
      validateUserRegistration(userData);
      
      // Validate required fields
      if (!userData.password || !userData.email || !userData.firstName || !userData.lastName) {
        throw new ValidationError('Missing required user data');
      }
      
      // Validate role if provided
      if (userData.role && !Object.values(USER_ROLES).includes(userData.role)) {
        throw new ValidationError('Invalid user role');
      }
      
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await this.userRepository.createUser({
        ...userData,
        password: hashedPassword,
        email: userData.email.toLowerCase(),
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role || USER_ROLES.USER,
        status: USER_STATUS.ACTIVE,
        isEmailVerified: false,
        preferences: {
          timezone: DEFAULT_USER_PREFERENCES.timezone,
          houseSystem: DEFAULT_USER_PREFERENCES.houseSystem,
          aspectOrbs: DEFAULT_USER_PREFERENCES.aspectOrbs,
          themePreferences: { ...DEFAULT_USER_PREFERENCES.themePreferences },
          insightPreferences: {
            ...DEFAULT_USER_PREFERENCES.insightPreferences,
            categories: [...DEFAULT_USER_PREFERENCES.insightPreferences.categories],
            severity: [...DEFAULT_USER_PREFERENCES.insightPreferences.severity],
            types: [...DEFAULT_USER_PREFERENCES.insightPreferences.types]
          },
          notificationPreferences: {
            email: {
              ...DEFAULT_USER_PREFERENCES.notificationPreferences.email,
              types: [...DEFAULT_USER_PREFERENCES.notificationPreferences.email.types]
            },
            push: {
              ...DEFAULT_USER_PREFERENCES.notificationPreferences.push,
              types: [...DEFAULT_USER_PREFERENCES.notificationPreferences.push.types]
            }
          }
        },
        activityHistory: [{
          type: USER_ACTIVITY.PROFILE_UPDATE,
          timestamp: new Date(),
          details: { action: 'account_creation' }
        }]
      });
      
      await this.cacheUser(user);
      return UserTransformer.toDTO(user as UserDocument);
    } catch (error) {
      throw this.handleError('Failed to create user', error);
    }
  }

  async getUserById(id: string): Promise<UserDTO> {
    try {
      const cacheKey = `${this.USER_CACHE_PREFIX}${id}`;
      const cachedUser = await this.cache.get<IUser>(cacheKey);
      
      if (cachedUser) {
        return UserTransformer.toDTO(cachedUser as UserDocument);
      }

      const user = await this.userRepository.findById(id);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      await this.cacheUser(user);
      return UserTransformer.toDTO(user as UserDocument);
    } catch (error) {
      throw this.handleError('Failed to get user by ID', error);
    }
  }

  async getUserByEmail(email: string): Promise<UserDTO> {
    try {
      const user = await this.userRepository.findByEmail(email.toLowerCase());
      if (!user) {
        throw new NotFoundError('User not found');
      }
      return UserTransformer.toDTO(user as UserDocument);
    } catch (error) {
      throw this.handleError('Failed to get user by email', error);
    }
  }

  async updateUser(id: string, userData: Partial<IUser>): Promise<UserDTO> {
    try {
      const user = await this.userRepository.findById(id);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Validate role if provided
      if (userData.role && !Object.values(USER_ROLES).includes(userData.role)) {
        throw new ValidationError('Invalid user role');
      }

      const updatedUser = await this.userRepository.updateUser(id, userData);
      if (!updatedUser) {
        throw new DatabaseError('Failed to update user');
      }

      await this.clearUserCache(id);
      return UserTransformer.toDTO(updatedUser as UserDocument);
    } catch (error) {
      throw this.handleError('Failed to update user', error);
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      const user = await this.userRepository.findById(id);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      await this.userRepository.deleteUser(id);
      await this.clearUserCache(id);
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
          ...(user.preferences?.themePreferences || {}),
          ...(preferences?.themePreferences || {})
        },
        insightPreferences: {
          ...(user.preferences?.insightPreferences || {}),
          ...(preferences?.insightPreferences || {})
        },
        notificationPreferences: {
          ...(user.preferences?.notificationPreferences || {}),
          ...(preferences?.notificationPreferences || {})
        }
      };

      const updatedUser = await this.userRepository.updateUser(userId, { preferences: updatedPreferences });
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

  async getUserBirthCharts(userId: string): Promise<IBirthChart[]> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }
      return await this.birthChartService.getBirthChartsByUserId(userId);
    } catch (error) {
      throw this.handleError('Failed to get user birth charts', error);
    }
  }
}