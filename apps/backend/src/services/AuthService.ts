import { Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { AppError, ValidationError, AuthError, NotFoundError } from '../types/errors';
import { RateLimiter } from '../shared/utils/rateLimiter';
import { ICache } from '../infrastructure/cache/ICache';
import {
  TokenPayload,
  AuthTokens,
  LoginAttempt,
  Session,
  AuthConfig,
  AuthResponse,
  PasswordResetData,
  EmailVerificationData,
  LoginCredentials,
  RegisterData,
  ChangePasswordData
} from '../types/auth.types';
import crypto from 'crypto';
import { DatabaseError } from '../types/errors';
import { RedisCache } from '../infrastructure/cache/RedisCache';
import { UserService } from './UserService';
import { Error as MongooseError } from 'mongoose';
import { BirthChartService } from './BirthChartService';
import { EphemerisService } from './EphemerisService';

// Define a type that excludes Mongoose-specific properties
type UserData = {
  email: string;
  password: string;
  role: 'user' | 'admin';
  firstName?: string;
  lastName?: string;
  birthDate: Date;
  birthTime?: string;
  birthLocation: {
    latitude: number;
    longitude: number;
    placeName: string;
  };
  isEmailVerified: boolean;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  preferences: {
    timezone: string;
    houseSystem: 'placidus' | 'equal';
    aspectOrbs: number;
    themePreferences: {
      colorScheme: 'light' | 'dark';
      fontSize: 'small' | 'medium' | 'large';
      showAspects: boolean;
      showHouses: boolean;
      showPlanets: boolean;
      showRetrogrades: boolean;
      showLunarPhases: boolean;
      showEclipses: boolean;
      showStations: boolean;
      showHeliacal: boolean;
      showCosmic: boolean;
    };
    insightPreferences: {
      categories: string[];
      severity: ('high' | 'medium' | 'low')[];
      types: string[];
      showRetrogrades: boolean;
      showEclipses: boolean;
      showStations: boolean;
      showHeliacal: boolean;
      showCosmic: boolean;
      dailyInsights: boolean;
      progressionInsights: boolean;
      lifeThemeInsights: boolean;
      birthChartInsights: boolean;
    };
    notificationPreferences: {
      email: {
        dailyInsights: boolean;
        eclipseAlerts: boolean;
        retrogradeAlerts: boolean;
        stationAlerts: boolean;
        heliacalAlerts: boolean;
        cosmicAlerts: boolean;
      };
      push: {
        dailyInsights: boolean;
        eclipseAlerts: boolean;
        retrogradeAlerts: boolean;
        stationAlerts: boolean;
        heliacalAlerts: boolean;
        cosmicAlerts: boolean;
      };
      frequency: 'daily' | 'weekly' | 'monthly';
      quietHours: {
        enabled: boolean;
        start: string;
        end: string;
      };
    };
  };
};

export class AuthService {
  private rateLimiter: RateLimiter;
  private config: AuthConfig;

  constructor(
    private cache: ICache,
    private userService: UserService,
    config?: Partial<AuthConfig>
  ) {
    this.config = {
      jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
      jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
      accessTokenExpiresIn: '15m',
      refreshTokenExpiresIn: '7d',
      maxLoginAttempts: 5,
      loginTimeoutMinutes: 15,
      rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
      rateLimitMaxRequests: 100,
      ...config
    };
    this.rateLimiter = new RateLimiter(this.config.rateLimitWindowMs, this.config.rateLimitMaxRequests);
  }

  private generateAccessToken(user: IUser, deviceId?: string): string {
    const payload: TokenPayload = {
      userId: (user._id as Types.ObjectId).toString(),
      role: user.role,
      deviceId
    };
    return jwt.sign(payload, this.config.jwtSecret, {
      expiresIn: this.config.accessTokenExpiresIn
    } as jwt.SignOptions);
  }

  private generateRefreshToken(user: IUser, deviceId?: string): string {
    const payload: TokenPayload = {
      userId: (user._id as Types.ObjectId).toString(),
      deviceId
    };
    return jwt.sign(payload, this.config.jwtRefreshSecret, {
      expiresIn: this.config.refreshTokenExpiresIn
    } as jwt.SignOptions);
  }

  private async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  private validatePasswordStrength(password: string): void {
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
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*]/.test(password)) {
      errors.push('Password must contain at least one special character (!@#$%^&*)');
    }
    
    if (errors.length > 0) {
      throw new ValidationError('Invalid password: ' + errors.join(', '));
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      if (this.rateLimiter.isRateLimited('register')) {
        throw new AuthError('Too many registration attempts. Please try again later.');
      }

      this.validatePasswordStrength(data.password);

      if (!data.birthDate) {
        throw new ValidationError('Birth date is required');
      }

      if (!data.birthLocation) {
        throw new ValidationError('Birth location is required');
      }

      const existingUser = await User.findOne({ email: data.email });
      if (existingUser) {
        throw new AuthError('Email already registered');
      }

      const hashedPassword = await this.hashPassword(data.password);
      const userData: UserData = {
        email: data.email,
        password: hashedPassword,
        role: 'user',
        firstName: data.firstName,
        lastName: data.lastName,
        birthDate: data.birthDate,
        birthLocation: data.birthLocation,
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
              dailyInsights: true,
              eclipseAlerts: true,
              retrogradeAlerts: true,
              stationAlerts: true,
              heliacalAlerts: true,
              cosmicAlerts: true
            },
            push: {
              dailyInsights: true,
              eclipseAlerts: true,
              retrogradeAlerts: true,
              stationAlerts: true,
              heliacalAlerts: true,
              cosmicAlerts: true
            },
            frequency: 'daily',
            quietHours: {
              enabled: false,
              start: '22:00',
              end: '07:00'
            }
          }
        }
      };

      const user = await this.userService.createUser(userData as Omit<IUser, '_id' | 'createdAt' | 'updatedAt'>);

      const tokens = {
        accessToken: this.generateAccessToken(user),
        refreshToken: this.generateRefreshToken(user)
      };

      return { user, tokens };
    } catch (error: unknown) {
      if (error instanceof AuthError) {
        throw error;
      }
      if (error instanceof MongooseError.ValidationError) {
        const validationErrors = Object.values((error as MongooseError.ValidationError).errors)
          .map(err => err.message)
          .join(', ');
        throw new ValidationError('Invalid registration data: ' + validationErrors);
      }
      if (error instanceof Error && error.message.includes('validation')) {
        throw new ValidationError(error.message);
      }
      if (error instanceof Error && error.message.includes('password')) {
        throw new ValidationError(error.message);
      }
      throw new DatabaseError('Failed to register user', error as Error);
    }
  }

  async login(credentials: LoginCredentials, deviceId?: string): Promise<AuthResponse> {
    try {
      if (this.rateLimiter.isRateLimited('login')) {
        throw new AuthError('Too many login attempts. Please try again later.');
      }

      const user = await User.findOne({ email: credentials.email });
      if (!user) {
        throw new AuthError('User not found');
      }

      const isValidPassword = await this.validatePassword(credentials.password, user.password);
      if (!isValidPassword) {
        await this.recordLoginAttempt((user._id as Types.ObjectId).toString(), {
          ip: credentials.ip || 'unknown',
          userAgent: credentials.userAgent || 'unknown',
          timestamp: new Date(),
          success: false
        });
        throw new AuthError('Invalid credentials');
      }

      await this.recordLoginAttempt((user._id as Types.ObjectId).toString(), {
        ip: credentials.ip || 'unknown',
        userAgent: credentials.userAgent || 'unknown',
        timestamp: new Date(),
        success: true
      });

      const tokens = {
        accessToken: this.generateAccessToken(user, deviceId),
        refreshToken: this.generateRefreshToken(user, deviceId)
      };

      await this.createSession((user._id as Types.ObjectId).toString(), deviceId || 'default');

      return { user, tokens };
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new DatabaseError('Failed to login user', error);
    }
  }

  async changePassword(data: ChangePasswordData): Promise<void> {
    try {
      if (this.rateLimiter.isRateLimited('change_password')) {
        throw new AuthError('Too many password change attempts. Please try again later.');
      }

      const user = await User.findById(data.userId);
      if (!user) {
        throw new AuthError('User not found');
      }

      const isValidPassword = await this.validatePassword(data.currentPassword, user.password);
      if (!isValidPassword) {
        throw new AuthError('Current password is incorrect');
      }

      this.validatePasswordStrength(data.newPassword);
      const hashedPassword = await this.hashPassword(data.newPassword);
      await User.findByIdAndUpdate(data.userId, { password: hashedPassword });
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError('Failed to change password', error as Error);
    }
  }

  async validateToken(token: string): Promise<IUser> {
    try {
      const decoded = jwt.verify(token, this.config.jwtSecret) as TokenPayload;
      const user = await User.findById(decoded.userId);
      if (!user) {
        throw new AuthError('User not found');
      }
      return user;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthError('Token expired');
      }
      throw new AuthError('Invalid token');
    }
  }

  async logout(token: string): Promise<void> {
    try {
      // Validate token format
      if (!token.includes('.')) {
        throw new AuthError('Invalid token format');
      }

      const decoded = jwt.verify(token, this.config.jwtSecret) as TokenPayload;
      if (!decoded.exp) {
        throw new AuthError('Invalid token');
      }
      
      // Blacklist the token
      await this.cache.set(
        `blacklist:${token}`,
        { userId: decoded.userId, exp: decoded.exp },
        decoded.exp - Math.floor(Date.now() / 1000)
      );

      // Delete the session
      await this.cache.delete(`session:${decoded.userId}`);
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthError('Invalid token');
      }
      throw new DatabaseError('Failed to logout user', error);
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      if (this.rateLimiter.isRateLimited('refresh_token')) {
        throw new AuthError('Too many refresh attempts. Please try again later.');
      }

      // First check if token is blacklisted
      const isBlacklisted = await this.cache.get(`blacklist:${refreshToken}`);
      if (isBlacklisted) {
        throw new AuthError('Token has been revoked');
      }

      // Validate token format
      if (!refreshToken.includes('.')) {
        throw new AuthError('Invalid token format');
      }

      const decoded = jwt.verify(refreshToken, this.config.jwtRefreshSecret) as TokenPayload;
      const user = await User.findById(decoded.userId);
      if (!user) {
        throw new AuthError('User not found');
      }

      return {
        accessToken: this.generateAccessToken(user, decoded.deviceId),
        refreshToken: this.generateRefreshToken(user, decoded.deviceId)
      };
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthError('Refresh token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthError('Invalid refresh token');
      }
      throw new DatabaseError('Failed to refresh token', error);
    }
  }

  private async createSession(userId: string, deviceId: string): Promise<Session> {
    const accessToken = jwt.sign(
      { userId },
      this.config.jwtSecret,
      { expiresIn: this.config.accessTokenExpiresIn } as jwt.SignOptions
    );

    const refreshToken = jwt.sign(
      { userId },
      this.config.jwtRefreshSecret,
      { expiresIn: this.config.refreshTokenExpiresIn } as jwt.SignOptions
    );

    const session: Session = {
      token: accessToken,
      refreshToken,
      userId,
      deviceId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      lastActive: new Date()
    };

    await this.cache.set(
      `session:${userId}`,
      session,
      15 * 60 // 15 minutes TTL
    );

    return session;
  }

  async revokeAllSessions(userId: string): Promise<void> {
    const sessions = await this.getActiveSessions(userId);
    await Promise.all(
      sessions.map(session => this.cache.delete(`session:${session.token}`))
    );
  }

  async getActiveSessions(userId: string): Promise<Session[]> {
    try {
      const keys = await this.cache.keys(`session:*`);
      const sessions = await Promise.all(
        keys.map(async (key: string) => {
          const session = await this.cache.get<Session>(key);
          return session;
        })
      );
      return sessions.filter((session): session is Session => 
        session !== null && 
        session.userId === userId && 
        new Date(session.expiresAt) > new Date()
      );
    } catch (error) {
      throw new DatabaseError('Failed to get active sessions', error);
    }
  }

  async recordLoginAttempt(userId: string, attempt: LoginAttempt): Promise<void> {
    const key = `login_attempts:${userId}`;
    const attempts = await this.cache.get<LoginAttempt[]>(key) || [];
    
    // Keep only recent attempts
    const recentAttempts = attempts.filter(
      a => new Date(a.timestamp) > new Date(Date.now() - this.config.loginTimeoutMinutes * 60 * 1000)
    );

    recentAttempts.push(attempt);
    await this.cache.set(key, recentAttempts, this.config.loginTimeoutMinutes * 60);

    // Check if account should be locked
    const failedAttempts = recentAttempts.filter(a => !a.success);
    if (failedAttempts.length >= this.config.maxLoginAttempts) {
      await this.cache.set(`locked:${userId}`, true, this.config.loginTimeoutMinutes * 60);
    }
  }

  async isAccountLocked(userId: string): Promise<boolean> {
    const locked = await this.cache.get<boolean>(`locked:${userId}`);
    return locked || false;
  }

  async hasRole(userId: string, role: string): Promise<boolean> {
    const user = await User.findById(userId);
    return user?.role === role;
  }

  async validateSession(token: string): Promise<Session> {
    const session = await this.cache.get<Session>(`session:${token}`);
    if (!session) {
      throw new AuthError('Session not found');
    }

    if (new Date(session.expiresAt) < new Date()) {
      await this.cache.delete(`session:${token}`);
      throw new AuthError('Session expired');
    }

    // Update last active timestamp
    session.lastActive = new Date();
    await this.cache.set(`session:${token}`, session, 15 * 60); // 15 minutes TTL

    return session;
  }

  async generatePasswordResetToken(email: string): Promise<string> {
    try {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        throw new AuthError('User not found');
      }

      // Generate a secure random token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

      // Store the hashed token and expiry in the user document
      await User.findByIdAndUpdate(user._id, {
        resetPasswordToken: crypto.createHash('sha256').update(resetToken).digest('hex'),
        resetPasswordExpires: resetTokenExpiry
      });

      return resetToken;
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      console.error('Error generating password reset token:', error);
      throw new DatabaseError('Failed to generate password reset token');
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      this.validatePasswordStrength(newPassword);
      
      const resetData = await this.cache.get<PasswordResetData>(`reset:${token}`);
      if (!resetData) {
        throw new AuthError('Invalid or expired reset token');
      }
      
      if (resetData.expires < new Date()) {
        await this.cache.delete(`reset:${token}`);
        throw new AuthError('Reset token has expired');
      }
      
      const user = await User.findById(resetData.userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }
      
      user.password = await this.hashPassword(newPassword);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      
      await this.cache.delete(`reset:${token}`);
    } catch (error) {
      if (error instanceof ValidationError || error instanceof AuthError) {
        throw error;
      }
      throw new DatabaseError('Failed to reset password', error as Error);
    }
  }

  async verifyEmail(token: string): Promise<void> {
    try {
      const verificationData = await this.cache.get<EmailVerificationData>(`verify:${token}`);
      if (!verificationData) {
        throw new AuthError('Invalid or expired verification token');
      }
      
      if (verificationData.expires < new Date()) {
        await this.cache.delete(`verify:${token}`);
        throw new AuthError('Verification token has expired');
      }
      
      const user = await User.findById(verificationData.userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }
      
      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();
      
      await this.cache.delete(`verify:${token}`);
    } catch (error) {
      if (error instanceof AuthError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to verify email', error as Error);
    }
  }

  private isValidPassword(password: string): boolean {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }
}

// Initialize and export an instance
const cache = new RedisCache('redis://localhost:6379');
const ephemerisService = new EphemerisService(cache, process.env.KERYKEION_BASE_URL || 'http://localhost:3000');
const birthChartService = new BirthChartService(cache, ephemerisService);
const userService = new UserService(cache, birthChartService);
export const authService = new AuthService(cache, userService, {
  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET
});