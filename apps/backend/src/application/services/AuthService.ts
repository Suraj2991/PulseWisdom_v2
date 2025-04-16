import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { IUser } from '../../domain/models/User';
import { AuthError, ValidationError, NotFoundError, DatabaseError, AppError } from '../../domain/errors';
import { ICache } from '../../infrastructure/cache/ICache';
import { logger } from '../../shared/logger';
import { UserRepository } from '../../infrastructure/database/UserRepository';
import { config } from '../../shared/config';
import { TokenPayload, AuthTokens, LoginCredentials, RegisterData } from '../../shared/types/auth.types';
import { RateLimiter } from '../../shared/utils/rateLimiter';
import crypto from 'crypto';
import { validatePasswordReset } from '../../domain/validators/auth.validator';
import {
  LoginAttempt,
  Session,
  AuthConfig,
  AuthResponse,
  PasswordResetData,
  EmailVerificationData,
  ChangePasswordData
} from '../../shared/types/auth.types';
import { validateUserRegistration } from '../../domain/validators/user.validator';

// Define a type that includes MongoDB's _id
type UserWithId = IUser & { _id: ObjectId };

export class AuthService {
  constructor(
    private readonly cache: ICache,
    private readonly userRepository: UserRepository,
    private readonly rateLimiter: RateLimiter
  ) {}

  private validateRegistrationData(userData: RegisterData): void {
    validateUserRegistration({
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName,
      birthDate: userData.birthDate,
      birthLocation: userData.birthLocation,
      role: 'user'
    });
  }

  private handleError(message: string, error: unknown): Error {
    logger.error(message, { error });
    if (error instanceof AppError) {
      return error;
    }
    return new AppError(message + ': ' + (error instanceof Error ? error.message : 'Unknown error'));
  }

  async register(userData: RegisterData): Promise<AuthTokens> {
    try {
      this.validateRegistrationData(userData);
      
      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(userData.email);
      if (existingUser) {
        throw new ValidationError('Email already registered');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Create user using repository
      const user = await this.userRepository.createUser({
        email: userData.email.toLowerCase(),
        password: hashedPassword,
        role: 'user',
        firstName: userData.firstName,
        lastName: userData.lastName,
        birthDate: userData.birthDate || new Date(),
        birthLocation: userData.birthLocation || {
          latitude: 0,
          longitude: 0,
          placeName: 'Unknown'
        },
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
      }) as UserWithId;

      logger.info('User registered successfully', { userId: user._id });
      
      // Generate tokens
      return this.generateTokens(user);
    } catch (error) {
      throw this.handleError('Failed to register user', error);
    }
  }

  private async validatePassword(password: string): Promise<ValidationError | void> {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    if (errors.length > 0) {
      throw new ValidationError('Invalid password', errors);
    }
  }

  private async generateTokens(user: UserWithId): Promise<AuthTokens> {
    if (!config.jwtSecret || !config.jwtRefreshSecret) {
      throw new AuthError('JWT secrets not configured');
    }

    const payload: TokenPayload = {
      userId: user._id.toString(),
      role: user.role
    };

    const accessTokenOptions: SignOptions = {
      expiresIn: '1h',
      algorithm: 'HS256'
    };

    const refreshTokenOptions: SignOptions = {
      expiresIn: '7d',
      algorithm: 'HS256'
    };

    const accessToken = jwt.sign(
      { userId: user._id.toString(), role: user.role },
      config.jwtSecret,
      accessTokenOptions
    );

    const refreshToken = jwt.sign(
      { userId: user._id.toString(), role: user.role },
      config.jwtRefreshSecret,
      refreshTokenOptions
    );

    return { accessToken, refreshToken };
  }

  private async generateEmailVerificationToken(user: IUser): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    user.emailVerificationToken = token;
    user.emailVerificationExpires = expires;
    await this.userRepository.updateUser(user._id!.toString(), user);

    return token;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const user = await this.userRepository.findByEmail(credentials.email);
      if (!user) {
        logger.error('Login failed: User not found', { email: credentials.email });
        throw new AuthError('Invalid credentials');
      }

      const isValidPassword = await bcrypt.compare(credentials.password, user.password);
      if (!isValidPassword) {
        logger.error('Login failed: Invalid password', { email: credentials.email });
        throw new AuthError('Invalid credentials');
      }

      const { accessToken, refreshToken } = await this.generateTokens(user as UserWithId);
      logger.info('User logged in successfully', { userId: user._id });

      return {
        user,
        tokens: {
          accessToken,
          refreshToken
        }
      };
    } catch (error) {
      logger.error('Login failed', { error, email: credentials.email });
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Login failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async validateToken(token: string): Promise<UserWithId> {
    try {
      if (!config.jwtSecret) {
        throw new AuthError('JWT secret not configured');
      }

      const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload;
      const user = await this.userRepository.findById(decoded.userId);
      
      if (!user) {
        throw new AuthError('User not found');
      }

      return user as UserWithId;
    } catch (error) {
      throw this.handleError('Failed to validate token', error);
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      if (!config.jwtRefreshSecret) {
        throw new AuthError('Refresh token secret not configured');
      }

      const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret) as TokenPayload;
      const user = await this.userRepository.findById(decoded.userId);
      
      if (!user) {
        throw new AuthError('User not found');
      }

      return this.generateTokens(user as UserWithId);
    } catch (error) {
      throw this.handleError('Failed to refresh token', error);
    }
  }

  async logout(token: string): Promise<void> {
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload;
      await this.cache.set(`blacklist:${token}`, true, 3600);
      logger.info('User logged out successfully', { userId: decoded.userId });
    } catch (error) {
      logger.error('Logout failed', { error });
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Logout failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async resetPassword(email: string, newPassword: string): Promise<void> {
    // Validate input
    validatePasswordReset({ email, newPassword });

    // ... rest of existing resetPassword code ...
  }

  async updateRefreshToken(userId: string, refreshToken: string | null): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AuthError('User not found');
    }
    
    await this.userRepository.updateUser(userId, {
      refreshToken: refreshToken ? await bcrypt.hash(refreshToken, 10) : undefined
    });
  }

  async validateRefreshToken(userId: string, refreshToken: string): Promise<boolean> {
    const user = await this.userRepository.findById(userId);
    if (!user?.refreshToken) {
      return false;
    }

    return bcrypt.compare(refreshToken, user.refreshToken);
  }
}