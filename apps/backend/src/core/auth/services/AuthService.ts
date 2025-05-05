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
  private readonly SALT_ROUNDS = 12;
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOGIN_LOCKOUT_TIME = 3600; // 1 hour in seconds

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
    logger.error(message, { error });
    if (error instanceof Error) {
      return new AppError(`${message}: ${error.message}`);
    }
    return new AppError(`${message}: Unknown error`);
  }

  private async hashPassword(password: string): Promise<string> {
    try {
      const salt = await bcrypt.genSalt(this.SALT_ROUNDS);
      return bcrypt.hash(password, salt);
    } catch (error) {
      logger.error('Password hashing failed', { error });
      throw new AuthError('Failed to secure password');
    }
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
      const hashedPassword = await this.hashPassword(userData.password);
      
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
      const { accessToken, refreshToken } = this.generateTokens(user._id.toString(), user.role as UserRole);
      
      // Generate email verification token
      const emailVerificationToken = this.generateEmailVerificationToken(user._id.toString());
      
      await this.cache.del(`refresh-token:${user._id.toString()}`);
      
      return {
        user: {
          id: user._id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role as 'user' | 'admin'
        },
        accessToken,
        refreshToken,
        emailVerificationToken
      };
    } catch (error) {
      throw this.handleError('Failed to register user', error);
    }
  }

  private validatePassword(password: string, message = 'Password validation failed'): boolean {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const isValid = password.length >= minLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumbers &&
      hasSpecialChar;

    if (!isValid) {
      logger.debug('Password validation failed', { message });
    }

    return isValid;
  }

  private generateTokens(userId: string, role: UserRole): AuthTokens {
    if (!role) {
      role = USER_ROLES.USER;
    }

    const accessTokenOptions: SignOptions = {
      expiresIn: Number(config.jwtExpiresIn)
    };

    const refreshTokenOptions: SignOptions = {
      expiresIn: Number(config.jwtRefreshExpiresIn)
    };

    const accessToken = jwt.sign(
      { userId, role, type: 'access' },
      config.jwtSecret,
      accessTokenOptions
    );

    const refreshToken = jwt.sign(
      { userId, role, type: 'refresh' },
      config.jwtRefreshSecret,
      refreshTokenOptions
    );

    return { accessToken, refreshToken };
  }

  private generateEmailVerificationToken(userId: string): string {
    const options: SignOptions = {
      expiresIn: '24h' as const
    };

    return jwt.sign(
      { userId, type: 'emailVerification' },
      config.emailVerificationSecret,
      options
    );
  }

  private async checkLoginAttempts(email: string): Promise<void> {
    const attempts = await this.cache.get<number>(`login-attempts:${email}`);
    if (attempts && attempts >= this.MAX_LOGIN_ATTEMPTS) {
      throw new AuthError('Too many failed attempts. Please try again later.');
    }
  }

  private async incrementLoginAttempts(email: string): Promise<void> {
    const attempts = await this.cache.get<number>(`login-attempts:${email}`) || 0;
    await this.cache.set(`login-attempts:${email}`, attempts + 1, this.LOGIN_LOCKOUT_TIME);
  }

  private async resetLoginAttempts(email: string): Promise<void> {
    await this.cache.del(`login-attempts:${email}`);
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // Check for too many failed attempts
      await this.checkLoginAttempts(credentials.email);

      const user = await this.userRepository.findByEmail(credentials.email);
      if (!user || !user._id) {
        logger.error('Login failed: User not found', { email: credentials.email });
        throw new AuthError('Invalid credentials');
      }

      const isValidPassword = await bcrypt.compare(credentials.password, user.password);
      if (!isValidPassword) {
        await this.incrementLoginAttempts(credentials.email);
        logger.error('Login failed: Invalid password', { email: credentials.email });
        throw new AuthError('Invalid credentials');
      }

      // Reset login attempts on successful login
      await this.resetLoginAttempts(credentials.email);

      const { accessToken, refreshToken } = this.generateTokens(user._id.toString(), user.role || USER_ROLES.USER);
      logger.info('User logged in successfully', { userId: user._id });

      await this.cache.del(`refresh-token:${user._id.toString()}`);

      return {
        user: {
          id: user._id.toString(),
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
      
      if (!user || !user._id) {
        throw new AuthError('User not found');
      }

      return this.generateTokens(user._id.toString(), user.role || USER_ROLES.USER);
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

  public async resetPassword(token: string, newPassword: string): Promise<void> {
    if (!this.validatePassword(newPassword)) {
      throw new ValidationError('Invalid password format', ['Password does not meet security requirements']);
    }

    const resetData = await this.cache.get(`reset:${token}`);
    if (!resetData) {
      throw new AuthError('Invalid or expired reset token');
    }

    const { userId } = JSON.parse(resetData as string) as { userId: string };
    await this.userRepository.updateUser(userId, { password: newPassword });
    await this.cache.delete(`reset:${token}`);
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
      const user = await this.userRepository.findByEmail(data.email);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      const isValidPassword = await bcrypt.compare(data.currentPassword, user.password);
      if (!isValidPassword) {
        throw new AuthError('Current password is incorrect');
      }

      const hashedPassword = await this.hashPassword(data.newPassword);
      
      if (!user._id) {
        throw new AuthError('User ID is required for password change');
      }

      await this.userRepository.updateUser(user._id.toString(), {
        password: hashedPassword
      });

      // Invalidate all existing sessions
      await this.cache.del(`refresh-token:${user._id.toString()}`);
      
      logger.info('Password changed successfully', { userId: user._id });
    } catch (error) {
      throw this.handleError('Failed to change password', error);
    }
  }

  async generatePasswordResetToken(email: string): Promise<string> {
    try {
      const user = await this.userRepository.findByEmail(email);
      if (!user || !user._id) {
        throw new NotFoundError('User not found');
      }

      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await this.userRepository.updateUser(user._id.toString(), {
        passwordResetToken: token,
        passwordResetExpires: expires
      });

      return token;
    } catch (error) {
      throw this.handleError('Failed to generate password reset token', error);
    }
  }

  async verifyEmail(token: string): Promise<void> {
    if (!config.emailVerificationSecret) {
      throw new AuthError('Email verification secret not configured');
    }
    try {
      const decoded = jwt.verify(token, config.emailVerificationSecret) as TokenPayload;
      if (!decoded.userId) {
        throw new AuthError('Invalid verification token');
      }
      const user = await this.userRepository.findById(decoded.userId);
      if (!user || !user._id) {
        throw new NotFoundError('User not found');
      }
      await this.userRepository.updateUser(user._id.toString(), { isEmailVerified: true });
    } catch (error) {
      throw new AuthError('Invalid or expired verification token');
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

  private getTokenKey(userId: string): string {
    return `user:${userId}:tokens`;
  }
}