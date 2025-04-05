import { AuthService } from '../../../infrastructure/auth/AuthService';
import { UserService } from '../../../infrastructure/user/UserService';
import { RedisCache } from '../../../infrastructure/cache/RedisCache';
import { ServiceError } from '../../../types/errors';
import jwt from 'jsonwebtoken';

jest.mock('../../../infrastructure/user/UserService');
jest.mock('../../../infrastructure/cache/RedisCache');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserService: jest.Mocked<UserService>;
  let mockCache: jest.Mocked<RedisCache>;

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    password: 'hashedpassword',
    birthChartId: 'test-birth-chart'
  };

  const mockToken = 'mock.jwt.token';
  const mockRefreshToken = 'mock.refresh.token';

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserService = new UserService({} as any) as jest.Mocked<UserService>;
    mockCache = new RedisCache('redis://localhost:6379') as jest.Mocked<RedisCache>;
    authService = new AuthService(mockUserService, mockCache);
  });

  describe('User Registration', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'new@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User'
      };

      mockUserService.createUser.mockResolvedValue(mockUser);
      
      const result = await authService.register(userData);
      
      expect(result).toBeDefined();
      expect(result.user).toEqual(mockUser);
      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(mockUserService.createUser).toHaveBeenCalledWith(userData);
    });

    it('should handle registration errors', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      };

      mockUserService.createUser.mockRejectedValue(new ServiceError('User already exists'));
      
      await expect(authService.register(userData))
        .rejects
        .toThrow(ServiceError);
    });
  });

  describe('User Login', () => {
    it('should login user with valid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      mockUserService.verifyPassword.mockResolvedValue(true);
      mockUserService.getUserByEmail.mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);
      
      const result = await authService.login(credentials);
      
      expect(result).toBeDefined();
      expect(result.user).toEqual(mockUser);
      expect(result.token).toBe(mockToken);
      expect(result.refreshToken).toBeDefined();
      expect(mockUserService.verifyPassword).toHaveBeenCalledWith(credentials.email, credentials.password);
    });

    it('should handle invalid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      mockUserService.verifyPassword.mockResolvedValue(false);
      
      await expect(authService.login(credentials))
        .rejects
        .toThrow(ServiceError);
    });
  });

  describe('Token Management', () => {
    it('should verify valid token', async () => {
      const decodedToken = { userId: mockUser.id };
      (jwt.verify as jest.Mock).mockReturnValue(decodedToken);
      mockUserService.getUserById.mockResolvedValue(mockUser);
      
      const user = await authService.verifyToken(mockToken);
      
      expect(user).toEqual(mockUser);
      expect(jwt.verify).toHaveBeenCalledWith(mockToken, expect.any(String));
      expect(mockUserService.getUserById).toHaveBeenCalledWith(mockUser.id);
    });

    it('should handle invalid token', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      await expect(authService.verifyToken('invalid.token'))
        .rejects
        .toThrow(ServiceError);
    });

    it('should refresh token', async () => {
      const decodedToken = { userId: mockUser.id };
      (jwt.verify as jest.Mock).mockReturnValue(decodedToken);
      mockUserService.getUserById.mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock).mockReturnValue('new.token');
      
      const result = await authService.refreshToken(mockRefreshToken);
      
      expect(result).toBeDefined();
      expect(result.token).toBe('new.token');
      expect(result.refreshToken).toBeDefined();
    });

    it('should handle invalid refresh token', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      await expect(authService.refreshToken('invalid.token'))
        .rejects
        .toThrow(ServiceError);
    });
  });

  describe('Logout', () => {
    it('should logout user', async () => {
      await authService.logout(mockUser.id);
      
      expect(mockCache.delete).toHaveBeenCalledWith(`refresh-token:${mockUser.id}`);
    });

    it('should handle logout errors', async () => {
      mockCache.delete.mockRejectedValue(new Error('Cache error'));
      
      await expect(authService.logout(mockUser.id))
        .rejects
        .toThrow(ServiceError);
    });
  });

  describe('Password Reset', () => {
    it('should initiate password reset', async () => {
      const email = 'test@example.com';
      mockUserService.getUserByEmail.mockResolvedValue(mockUser);
      
      await authService.initiatePasswordReset(email);
      
      expect(mockCache.set).toHaveBeenCalled();
      // Add more expectations for email sending if implemented
    });

    it('should reset password with valid token', async () => {
      const resetData = {
        token: 'valid.reset.token',
        newPassword: 'newpassword123'
      };

      const decodedToken = { userId: mockUser.id };
      (jwt.verify as jest.Mock).mockReturnValue(decodedToken);
      mockUserService.getUserById.mockResolvedValue(mockUser);
      
      await authService.resetPassword(resetData);
      
      expect(mockUserService.updateUser).toHaveBeenCalled();
      expect(mockCache.delete).toHaveBeenCalled();
    });

    it('should handle invalid reset token', async () => {
      const resetData = {
        token: 'invalid.token',
        newPassword: 'newpassword123'
      };

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      await expect(authService.resetPassword(resetData))
        .rejects
        .toThrow(ServiceError);
    });
  });
}); 