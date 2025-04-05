import { Types } from 'mongoose';
import { AuthService } from '../../services/AuthService';
import { User, IUser } from '../../models/User';
import { ValidationError, AuthError, NotFoundError } from '../../types/errors';
import { ICache } from '../../infrastructure/cache/ICache';
import { LoginCredentials, RegisterData, AuthResponse, LoginAttempt } from '../../types/auth.types';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Extend IUser to include _id
interface IUserWithId extends IUser {
  _id: Types.ObjectId;
  save: jest.Mock;
}

jest.mock('../../models/User');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
  let authService: AuthService;
  let mockCache: jest.Mocked<ICache>;
  let mockUserService: any;

  const mockUser: IUserWithId = {
    _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
    email: 'test@example.com',
    password: 'hashedPassword123',
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
      aspectOrbs: 8
    },
    save: jest.fn().mockResolvedValue(true)
  } as IUserWithId & { save: jest.Mock };

  const registerData = {
    email: 'test@example.com',
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
    birthDate: new Date('1990-01-01'),
    birthLocation: {
      latitude: 40.7128,
      longitude: -74.0060,
      placeName: 'New York'
    }
  };

  const loginData = {
    email: 'test@example.com',
    password: 'TestPassword123!'
  };

  const changePasswordData = {
    userId: 'testUserId',
    currentPassword: 'TestPassword123!',
    newPassword: 'NewTestPassword123!'
  };

  const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJpYXQiOjE1MTYyMzkwMjIsImV4cCI6MTUxNjIzOTAyMn0.4Adcj3UFYzPUVaVF43FmMze0QxYzTz3jqg0h3qXqXqX';
  const mockRefreshToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJpYXQiOjE1MTYyMzkwMjIsImV4cCI6MTUxNjIzOTAyMn0.4Adcj3UFYzPUVaVF43FmMze0QxYzTz3jqg0h3qXqXqX';
  const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJpYXQiOjE1MTYyMzkwMjIsImV4cCI6MTUxNjIzOTAyMn0.4Adcj3UFYzPUVaVF43FmMze0QxYzTz3jqg0h3qXqXqX';
  const invalidRefreshToken = 'not.a.jwt.token';

  beforeEach(() => {
    mockCache = {
      get: jest.fn(),
      set: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      keys: jest.fn(),
      clear: jest.fn(),
      exists: jest.fn(),
      getPlanetaryPositions: jest.fn(),
      setPlanetaryPositions: jest.fn(),
      getTransitData: jest.fn(),
      setTransitData: jest.fn(),
      getBirthChart: jest.fn(),
      setBirthChart: jest.fn(),
      deleteBirthChart: jest.fn(),
      getAspectData: jest.fn(),
      setAspectData: jest.fn(),
      getInsight: jest.fn(),
      setInsight: jest.fn(),
      deleteInsight: jest.fn(),
      clearCache: jest.fn(),
      disconnect: jest.fn()
    } as jest.Mocked<ICache>;

    mockUserService = {
      createUser: jest.fn().mockResolvedValue(mockUser),
      findUserById: jest.fn().mockResolvedValue(mockUser),
      findUserByEmail: jest.fn().mockResolvedValue(mockUser),
      updateUser: jest.fn().mockResolvedValue(mockUser),
      deleteUser: jest.fn().mockResolvedValue(mockUser)
    };

    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
    (jwt.sign as jest.Mock).mockReturnValue('mockToken');
    (jwt.verify as jest.Mock).mockReturnValue({ userId: mockUser._id });

    authService = new AuthService(mockCache, mockUserService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      mockCache.set.mockResolvedValue(undefined);
      mockCache.get.mockResolvedValue(null);
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.create as jest.Mock).mockResolvedValue({
        ...mockUser,
        _id: new Types.ObjectId('507f1f77bcf86cd799439011')
      });
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const result = await authService.register(registerData);

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.tokens).toBeDefined();
    });

    it('should throw error if user already exists', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      await expect(authService.register(registerData))
        .rejects
        .toThrow('Email already registered');
    });

    it('should throw validation error for invalid data', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: '123',
        firstName: 'T',
        birthDate: 'invalid-date',
        birthLocation: {
          latitude: 91,
          longitude: 181,
          placeName: ''
        }
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.create as jest.Mock).mockRejectedValue(new ValidationError('Invalid data'));

      await expect(authService.register(invalidData as any))
        .rejects
        .toThrow(ValidationError);
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('mockToken');

      const result = await authService.login(loginData);

      expect(result).toEqual({
        user: mockUser,
        tokens: {
          accessToken: 'mockToken',
          refreshToken: 'mockToken'
        }
      });
    });

    it('should throw error if user not found', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await expect(authService.login(loginData))
        .rejects
        .toThrow('User not found');
    });

    it('should throw error if password is incorrect', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login(loginData))
        .rejects
        .toThrow('Invalid credentials');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUser);

      await authService.changePassword(changePasswordData);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        changePasswordData.userId,
        { password: 'newHashedPassword' }
      );
    });

    it('should throw error if user not found', async () => {
      (User.findById as jest.Mock).mockResolvedValue(null);

      await expect(authService.changePassword(changePasswordData))
        .rejects
        .toThrow('User not found');
    });

    it('should throw error if current password is incorrect', async () => {
      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.changePassword(changePasswordData))
        .rejects
        .toThrow('Current password is incorrect');
    });

    it('should throw validation error for invalid new password', async () => {
      const changePasswordData = {
        userId: mockUser._id!.toString(),
        currentPassword: 'currentPassword',
        newPassword: '123' // Invalid password
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockRejectedValue(new ValidationError('Invalid password format'));

      await expect(authService.changePassword(changePasswordData))
        .rejects
        .toThrow(ValidationError);
    });
  });

  describe('Session Management', () => {
    it('should create new session on login', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('newSessionToken');

      const result = await authService.login(loginData, 'test-device');

      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toBe('newSessionToken');
      expect(mockCache.set).toHaveBeenCalledWith(
        expect.stringContaining('session:'),
        expect.any(Object),
        expect.any(Number)
      );
    });

    it('should revoke all user sessions', async () => {
      const userId = mockUser._id!.toString();
      mockCache.keys.mockResolvedValue(['session:token1', 'session:token2']);
      mockCache.get.mockResolvedValue({
        userId,
        token: 'token',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 1000),
        lastActive: new Date()
      });

      await authService.revokeAllSessions(userId);

      expect(mockCache.delete).toHaveBeenCalled();
    });

    it('should get active sessions', async () => {
      const userId = mockUser._id!.toString();
      mockCache.keys.mockResolvedValue(['session:token1', 'session:token2']);
      mockCache.get.mockResolvedValue({
        userId,
        token: 'token',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 1000),
        lastActive: new Date()
      });

      const sessions = await authService.getActiveSessions(userId);

      expect(sessions).toBeDefined();
      expect(sessions.length).toBeGreaterThan(0);
    });
  });

  describe('Rate Limiting', () => {
    it('should track login attempts', async () => {
      const userId = mockUser._id!.toString();
      const attempt: LoginAttempt = {
        ip: '192.168.1.1',
        userAgent: 'test-agent',
        timestamp: new Date(),
        success: false
      };

      await authService.recordLoginAttempt(userId, attempt);

      expect(mockCache.set).toHaveBeenCalled();
    });

    it('should handle rate limiting for login', async () => {
      const loginData: LoginCredentials = {
        email: 'test@example.com',
        password: 'wrongPassword'
      };

      // Mock rate limiter to indicate limit reached
      (authService as any).rateLimiter.isRateLimited = jest.fn().mockReturnValue(true);

      await expect(authService.login(loginData))
        .rejects
        .toThrow('Too many login attempts');
    });
  });

  describe('Token Refresh', () => {
    it('should refresh token', async () => {
      const refreshToken = mockRefreshToken;
      (jwt.verify as jest.Mock).mockReturnValue({ userId: mockUser._id });
      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock)
        .mockReturnValueOnce('newAccessToken')
        .mockReturnValueOnce('newRefreshToken');

      const result = await authService.refreshToken(refreshToken);

      expect(result).toEqual({
        accessToken: 'newAccessToken',
        refreshToken: 'newRefreshToken'
      });
    });

    it('should handle token expiration', async () => {
      const expiredToken = mockRefreshToken;
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.TokenExpiredError('Refresh token expired', new Date());
      });

      await expect(authService.refreshToken(expiredToken))
        .rejects
        .toThrow('Refresh token expired');
    });

    it('should implement refresh token rotation', async () => {
      const refreshToken = mockRefreshToken;
      (jwt.verify as jest.Mock).mockReturnValue({ userId: mockUser._id });
      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock)
        .mockReturnValueOnce('newAccessToken')
        .mockReturnValueOnce('newRefreshToken');

      const result = await authService.refreshToken(refreshToken);

      expect(result).toEqual({
        accessToken: 'newAccessToken',
        refreshToken: 'newRefreshToken'
      });
    });

    it('should handle concurrent refresh attempts', async () => {
      const refreshToken = mockRefreshToken;
      (jwt.verify as jest.Mock).mockReturnValue({ userId: mockUser._id });
      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock)
        .mockReturnValueOnce('token1')
        .mockReturnValueOnce('token2')
        .mockReturnValueOnce('token3')
        .mockReturnValueOnce('token4');

      const refreshPromises = Array(2).fill(null).map(() => 
        authService.refreshToken(refreshToken)
      );

      const results = await Promise.all(refreshPromises);
      expect(results).toHaveLength(2);
      expect(results[0].accessToken).not.toBe(results[1].accessToken);
    });

    it('should implement rate limiting for refresh attempts', async () => {
      const refreshToken = mockRefreshToken;
      (jwt.verify as jest.Mock).mockReturnValue({ userId: mockUser._id });
      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock).mockReturnValue('newToken');

      // Mock rate limiter
      (authService as any).rateLimiter.isRateLimited = jest.fn()
        .mockReturnValueOnce(false)  // First attempt
        .mockReturnValueOnce(true);  // Second attempt

      await authService.refreshToken(refreshToken); // First attempt
      await expect(authService.refreshToken(refreshToken)) // Second attempt
        .rejects
        .toThrow('Too many refresh attempts');
    });

    it('should handle multiple rapid registration attempts', async () => {
      // Mock rate limiter
      (authService as any).rateLimiter.isRateLimited = jest.fn()
        .mockReturnValueOnce(false)  // First attempt
        .mockReturnValueOnce(true);  // Second attempt

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.create as jest.Mock).mockResolvedValue(mockUser);

      await authService.register(registerData); // First attempt

      await expect(authService.register(registerData)) // Second attempt
        .rejects
        .toThrow('Too many registration attempts');
    });
  });

  describe('Security', () => {
    it('should enforce password strength requirements', async () => {
      const weakPasswordData = {
        ...registerData,
        password: 'weak' // Too short and no special characters
      };

      await expect(authService.register(weakPasswordData))
        .rejects
        .toThrow(ValidationError);
    });

    it('should blacklist tokens after logout', async () => {
      const token = mockToken;
      (jwt.verify as jest.Mock).mockReturnValue({ 
        userId: mockUser._id,
        exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      });
      
      await authService.logout(token);
      
      expect(mockCache.set).toHaveBeenCalledWith(
        expect.stringContaining('blacklist:'),
        expect.any(Object),
        expect.any(Number)
      );
    });

    it('should handle session timeout', async () => {
      const expiredSession = {
        userId: mockUser._id,
        token: 'expiredToken',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
        expiresAt: new Date(Date.now() - 1), // Expired
        lastActive: new Date(Date.now() - 1)
      };

      mockCache.get.mockResolvedValue(expiredSession);

      await expect(authService.validateSession('expiredToken'))
        .rejects
        .toThrow('Session expired');
    });

    it('should handle malformed tokens', async () => {
      const malformedToken = 'invalid-token';
      
      await expect(authService.refreshToken(malformedToken))
        .rejects
        .toThrow('Invalid token format');
    });

    it('should handle invalid refresh token format', async () => {
      const invalidToken = 'not-a-jwt-token';
      
      await expect(authService.refreshToken(invalidToken))
        .rejects
        .toThrow('Invalid token format');
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent session operations', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock)
        .mockReturnValueOnce('token1')
        .mockReturnValueOnce('token2');

      // Simulate concurrent logins
      const loginPromises = [
        authService.login(loginData, 'device1'),
        authService.login(loginData, 'device2')
      ];

      const results = await Promise.all(loginPromises);
      
      expect(results).toHaveLength(2);
      expect(results[0].tokens.accessToken).not.toBe(results[1].tokens.accessToken);
      expect(results[0].user._id).toBe(mockUser._id);
      expect(results[1].user._id).toBe(mockUser._id);
    });
  });

  describe('Password Reset', () => {
    it('should generate password reset token', async () => {
      const email = 'test@example.com';
      const mockToken = 'generated-reset-token';
      const hashedToken = 'hashed-token';

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUser);
      crypto.randomBytes = jest.fn().mockReturnValue({
        toString: () => mockToken
      });
      crypto.createHash = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          digest: jest.fn().mockReturnValue(hashedToken)
        })
      });

      const token = await authService.generatePasswordResetToken(email);

      expect(token).toBe(mockToken);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUser._id,
        {
          resetPasswordToken: hashedToken,
          resetPasswordExpires: expect.any(Date)
        }
      );
    });

    it('should handle non-existent user for password reset', async () => {
      const email = 'nonexistent@example.com';
      (User.findOne as jest.Mock).mockResolvedValue(null);
      await expect(authService.generatePasswordResetToken(email))
        .rejects
        .toThrow('User not found');
    });

    it('should reset password with valid token', async () => {
      const token = 'validResetToken';
      const newPassword = 'NewPassword123!';
      const resetData = {
        userId: mockUser._id.toString(),
        expires: new Date(Date.now() + 3600000)
      };

      mockCache.get.mockResolvedValue(resetData);
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      await authService.resetPassword(token, newPassword);

      expect(mockCache.get).toHaveBeenCalledWith(`reset:${token}`);
      expect(User.findById).toHaveBeenCalledWith(mockUser._id.toString());
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockCache.delete).toHaveBeenCalledWith(`reset:${token}`);
    });

    it('should handle invalid reset token', async () => {
      const token = 'invalidToken';
      const newPassword = 'NewPassword123!';

      (User.findOne as jest.Mock).mockResolvedValue(null);

      await expect(authService.resetPassword(token, newPassword))
        .rejects
        .toThrow('Invalid or expired reset token');
    });

    it('should handle expired reset token', async () => {
      const token = 'expiredToken';
      const newPassword = 'NewPassword123!';
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      (User.findOne as jest.Mock).mockResolvedValue({
        ...mockUser,
        resetPasswordToken: hashedToken,
        resetPasswordExpires: new Date(Date.now() - 1000) // Expired
      });

      await expect(authService.resetPassword(token, newPassword))
        .rejects
        .toThrow('Invalid or expired reset token');
    });

    it('should validate new password format', async () => {
      const token = 'validResetToken';
      const weakPassword = 'weak';

      await expect(authService.resetPassword(token, weakPassword))
        .rejects
        .toThrow(ValidationError);
    });
  });

  describe('Email Verification', () => {
    it('should verify email with valid token', async () => {
      const token = 'validVerificationToken';
      const verificationData = {
        userId: mockUser._id.toString(),
        expires: new Date(Date.now() + 3600000)
      };

      mockCache.get.mockResolvedValue(verificationData);
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      await authService.verifyEmail(token);

      expect(mockCache.get).toHaveBeenCalledWith(`verify:${token}`);
      expect(User.findById).toHaveBeenCalledWith(mockUser._id.toString());
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockCache.delete).toHaveBeenCalledWith(`verify:${token}`);
    });

    it('should handle invalid verification token', async () => {
      const token = 'invalidToken';

      (User.findOne as jest.Mock).mockResolvedValue(null);

      await expect(authService.verifyEmail(token))
        .rejects
        .toThrow('Invalid or expired verification token');
    });

    it('should handle expired verification token', async () => {
      const token = 'expiredToken';
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      (User.findOne as jest.Mock).mockResolvedValue({
        ...mockUser,
        emailVerificationToken: hashedToken,
        emailVerificationExpires: new Date(Date.now() - 1000) // Expired
      });

      await expect(authService.verifyEmail(token))
        .rejects
        .toThrow('Invalid or expired verification token');
    });
  });
}); 