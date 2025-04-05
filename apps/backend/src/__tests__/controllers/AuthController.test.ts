import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { AuthController } from '../../controllers/AuthController';
import { AuthService } from '../../services/AuthService';
import { ValidationError, AuthError } from '../../types/errors';
import { IUser } from '../../models/User';
import { LoginCredentials, RegisterData, ChangePasswordData, Session, AuthResponse, AuthTokens } from '../../types/auth.types';

jest.mock('../../services/AuthService');

// Extend the Request type to include the user property as expected by the controller
type AuthRequest = Request & {
  user?: {
    id: string;
  };
};

describe('AuthController', () => {
  let authController: AuthController;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Response;
  let nextFunction: jest.Mock;

  const mockUserId = new Types.ObjectId('507f1f77bcf86cd799439011');
  const mockUser = {
    _id: mockUserId,
    email: 'test@example.com',
    password: 'hashedPassword',
    role: 'user',
    firstName: 'Test',
    lastName: 'User',
    birthDate: new Date('1990-01-01'),
    birthLocation: {
      latitude: 40.7128,
      longitude: -74.0060,
      placeName: 'New York'
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
    },
    createdAt: new Date(),
    updatedAt: new Date()
  } as unknown as IUser;

  const mockTokens: AuthTokens = {
    accessToken: 'mockAccessToken',
    refreshToken: 'mockRefreshToken'
  };

  const mockSession: Session = {
    token: mockTokens.accessToken,
    refreshToken: mockTokens.refreshToken,
    userId: mockUserId.toString(),
    deviceId: 'default',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    lastActive: new Date()
  };

  beforeEach(() => {
    mockRequest = {
      body: {},
      params: {},
      headers: {} as Record<string, string>,
      ip: '127.0.0.1'
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as unknown as Response;

    nextFunction = jest.fn();

    mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      changePassword: jest.fn(),
      logout: jest.fn(),
      generatePasswordResetToken: jest.fn(),
      resetPassword: jest.fn(),
      verifyEmail: jest.fn(),
      refreshToken: jest.fn(),
      getActiveSessions: jest.fn(),
      validateToken: jest.fn(),
      revokeAllSessions: jest.fn(),
      recordLoginAttempt: jest.fn(),
      isAccountLocked: jest.fn(),
      hasRole: jest.fn(),
      validateSession: jest.fn()
    } as unknown as jest.Mocked<AuthService>;

    authController = new AuthController(mockAuthService);
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const mockUser = { id: mockUserId.toString() };
      const mockTokens = { accessToken: 'token', refreshToken: 'refresh' };
      mockAuthService.register.mockResolvedValue({ user: mockUser, tokens: mockTokens });

      await authController.register(mockRequest as Request, mockResponse, nextFunction);

      expect(mockAuthService.register).toHaveBeenCalledWith(mockRequest.body);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({ user: mockUser, tokens: mockTokens });
    });

    it('should handle validation errors', async () => {
      mockAuthService.register.mockRejectedValue(new ValidationError('Invalid data'));

      await authController.register(mockRequest as Request, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(expect.any(ValidationError));
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const mockUser = { id: mockUserId.toString() };
      const mockTokens = { accessToken: 'token', refreshToken: 'refresh' };
      mockAuthService.login.mockResolvedValue({ user: mockUser, tokens: mockTokens });

      await authController.login(mockRequest as Request, mockResponse, nextFunction);

      expect(mockAuthService.login).toHaveBeenCalledWith(mockRequest.body.email, mockRequest.body.password);
      expect(mockResponse.json).toHaveBeenCalledWith({ user: mockUser, tokens: mockTokens });
    });

    it('should handle invalid credentials', async () => {
      mockAuthService.login.mockRejectedValue(new AuthError('Invalid credentials'));

      await authController.login(mockRequest as Request, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(expect.any(AuthError));
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      mockRequest.user = { id: mockUserId.toString() } as IUser & { id: string };
      mockRequest.body = { currentPassword: 'old', newPassword: 'new' };

      await authController.changePassword(mockRequest as AuthRequest, mockResponse, nextFunction);

      expect(mockAuthService.changePassword).toHaveBeenCalledWith({
        userId: mockUserId.toString(),
        currentPassword: 'old',
        newPassword: 'new'
      });
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Password changed successfully' });
    });

    it('should handle missing user ID', async () => {
      mockRequest.user = undefined;

      await authController.changePassword(mockRequest as AuthRequest, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(expect.any(ValidationError));
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      mockRequest.user = { id: mockUserId.toString() } as IUser & { id: string };

      await authController.logout(mockRequest as AuthRequest, mockResponse, nextFunction);

      expect(mockAuthService.logout).toHaveBeenCalledWith(mockUserId.toString());
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Logged out successfully' });
    });

    it('should handle missing user ID', async () => {
      mockRequest.user = undefined;

      await authController.logout(mockRequest as AuthRequest, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(expect.any(ValidationError));
    });
  });

  describe('generatePasswordResetToken', () => {
    it('should generate password reset token successfully', async () => {
      mockAuthService.generatePasswordResetToken.mockResolvedValue('reset-token');
      await authController.generatePasswordResetToken(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockAuthService.generatePasswordResetToken).toHaveBeenCalledWith(mockRequest.body.email);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Reset token generated successfully' });
    });

    it('should handle non-existent email', async () => {
      mockAuthService.generatePasswordResetToken.mockRejectedValue(new AuthError('User not found'));
      await authController.generatePasswordResetToken(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(expect.any(AuthError));
    });

    it('should handle rate limiting for token generation', async () => {
      mockRequest.body = { email: 'test@example.com' };
      mockAuthService.generatePasswordResetToken.mockRejectedValue(new AuthError('Too many reset attempts'));

      await authController.generatePasswordResetToken(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(expect.any(AuthError));
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      mockRequest.params = { token: 'reset-token' };
      mockRequest.body = { newPassword: 'newPassword123!' };
      await authController.resetPassword(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockAuthService.resetPassword).toHaveBeenCalledWith('reset-token', 'newPassword123!');
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Password reset successfully' });
    });

    it('should handle invalid token', async () => {
      mockRequest.params = { token: 'reset-token' };
      mockRequest.body = { newPassword: 'newPassword123!' };
      mockAuthService.resetPassword.mockRejectedValue(new AuthError('Invalid token'));
      await authController.resetPassword(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(expect.any(AuthError));
    });

    it('should handle weak new password', async () => {
      mockRequest.params = { token: 'reset-token' };
      mockRequest.body = { newPassword: 'weak' };
      mockAuthService.resetPassword.mockRejectedValue(new ValidationError('Password is too weak'));

      await authController.resetPassword(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(expect.any(ValidationError));
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      mockRequest.params = { token: 'verify-token' };
      await authController.verifyEmail(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith('verify-token');
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Email verified successfully' });
    });

    it('should handle invalid token', async () => {
      mockRequest.params = { token: 'verify-token' };
      mockAuthService.verifyEmail.mockRejectedValue(new AuthError('Invalid token'));
      await authController.verifyEmail(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(expect.any(AuthError));
    });

    it('should handle missing verification token', async () => {
      mockRequest.params = {};
      mockAuthService.verifyEmail.mockRejectedValue(new ValidationError('Token is required'));

      await authController.verifyEmail(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(expect.any(ValidationError));
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors consistently', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'Test123!'
      };
      const error = new Error('Service error');
      mockAuthService.login.mockRejectedValue(error);

      await authController.login(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(error);
    });

    it('should handle validation errors consistently', async () => {
      mockRequest.body = { email: 'invalid-email' };
      mockAuthService.login.mockRejectedValue(new ValidationError('Invalid email format'));

      await authController.login(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    it('should handle rate limit errors consistently', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'Test123!'
      };
      mockAuthService.login.mockRejectedValue(new AuthError('Too many attempts'));

      await authController.login(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(expect.any(AuthError));
    });
  });
}); 