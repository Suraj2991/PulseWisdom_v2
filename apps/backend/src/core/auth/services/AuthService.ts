import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { IUser } from '../../user/models/UserModel';
import { AuthError, ValidationError, NotFoundError, AppError } from '../../../domain/errors';
import { ICache } from '../../../infrastructure/cache/ICache';
import { logger } from '../../../shared/logger';
import { UserRepository } from '../../user/database/UserRepository';
import { config } from '../../../shared/config';
import { TokenPayload, AuthTokens, LoginCredentials, RegisterData, ChangePasswordData, AuthResponse, UserRole } from '../types/auth.types';
import { RateLimiter } from '../../../shared/utils/rateLimiter';
import crypto from 'crypto';
import { validatePasswordReset } from '../validators/auth.validator';
import { Session } from '../types/auth.types';
import { validateUserRegistration } from '../../user/validators/user.validator';
import { USER_ROLES } from '../../../shared/constants/user';

// Define a type that includes MongoDB's _id
type UserWithId = IUser & { _id: ObjectId };

// Extend TokenPayload to include expiration
interface ExtendedTokenPayload extends TokenPayload {
  exp?: number;
}

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
      role: USER_ROLES.USER
    });
  }

  private handleError(message: string, error: unknown): Error {
    logger.error(message, { 
      error,
      service: 'AuthService',
      timestamp: new Date().toISOString()
    });
    if (error instanceof AppError) {
      return error;
    }
    return new AppError(message + ': ' + (error instanceof Error ? error.message : 'Unknown error'));
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
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
        role: USER_ROLES.USER,
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
      const { accessToken, refreshToken } = await this.generateTokens(user);
      return {
        user: {
          id: user._id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role as 'user' | 'admin'
        },
        accessToken,
        refreshToken
      };
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
        user: {
          id: user._id?.toString() || '',
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role || USER_ROLES.USER
        },
        accessToken,
        refreshToken
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

      const decoded = jwt.verify(token, config.jwtSecret) as ExtendedTokenPayload;
      
      // Check if token is expired
      if (decoded.exp && decoded.exp < Date.now() / 1000) {
        throw new AuthError('Token has expired');
      }

      const user = await this.userRepository.findById(decoded.userId);
      
      if (!user) {
        throw new AuthError('User not found');
      }

      return user as UserWithId;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthError('Token has expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthError('Invalid token');
      }
      throw this.handleError('Token validation failed', error);
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

  async changePassword(data: ChangePasswordData): Promise<void> {
    try {
      const user = await this.userRepository.findById(data.userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      const isValidPassword = await bcrypt.compare(data.currentPassword, user.password);
      if (!isValidPassword) {
        throw new AuthError('Current password is incorrect');
      }

      await this.validatePassword(data.newPassword);
      const hashedPassword = await bcrypt.hash(data.newPassword, 10);
      await this.userRepository.updateUser(data.userId, { password: hashedPassword });
      
      logger.info('Password changed successfully', { userId: data.userId });
    } catch (error) {
      throw this.handleError('Failed to change password', error);
    }
  }

  async generatePasswordResetToken(email: string): Promise<string> {
    try {
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await this.userRepository.updateUser(user._id!.toString(), {
        passwordResetToken: token,
        passwordResetExpires: expires
      });

      return token;
    } catch (error) {
      throw this.handleError('Failed to generate password reset token', error);
    }
  }

  async verifyEmail(token: string): Promise<void> {
    try {
      const user = await this.userRepository.findByEmailVerificationToken(token);
      if (!user) {
        throw new NotFoundError('Invalid verification token');
      }

      if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
        throw new AuthError('Verification token has expired');
      }

      await this.userRepository.updateUser(user._id!.toString(), {
        isEmailVerified: true,
        emailVerificationToken: undefined,
        emailVerificationExpires: undefined
      });

      logger.info('Email verified successfully', { userId: user._id });
    } catch (error) {
      throw this.handleError('Failed to verify email', error);
    }
  }

  async getActiveSessions(userId: string): Promise<Session[]> {
    try {
      const sessions = await this.cache.get<Session[]>(`sessions:${userId}`);
      return sessions || [];
    } catch (error) {
      throw this.handleError('Failed to get active sessions', error);
    }
  }
}