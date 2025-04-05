import { UserService } from '../../../infrastructure/user/UserService';
import { RedisCache } from '../../../infrastructure/cache/RedisCache';
import { ServiceError } from '../../../types/errors';
import { User } from '../../../types/user.types';
import mongoose from 'mongoose';

jest.mock('../../../infrastructure/cache/RedisCache');

describe('UserService', () => {
  let userService: UserService;
  let mockCache: jest.Mocked<RedisCache>;

  const mockUser: User = {
    id: 'test-user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    password: 'hashedpassword',
    birthChartId: 'test-birth-chart',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCache = new RedisCache('redis://localhost:6379') as jest.Mocked<RedisCache>;
    userService = new UserService(mockCache);
  });

  describe('User Creation', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
        password: 'password123'
      };
      
      const user = await userService.createUser(userData);
      
      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.firstName).toBe(userData.firstName);
      expect(user.lastName).toBe(userData.lastName);
      expect(user.password).not.toBe(userData.password); // Password should be hashed
    });

    it('should handle duplicate email', async () => {
      const userData = {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'password123'
      };
      
      await expect(userService.createUser(userData))
        .rejects
        .toThrow(ServiceError);
    });
  });

  describe('User Retrieval', () => {
    it('should get user by ID', async () => {
      mockCache.get.mockResolvedValue(JSON.stringify(mockUser));
      
      const user = await userService.getUserById('test-user-id');
      
      expect(user).toEqual(mockUser);
      expect(mockCache.get).toHaveBeenCalledWith('user:test-user-id');
    });

    it('should get user by email', async () => {
      const UserModel = mongoose.model('User');
      jest.spyOn(UserModel, 'findOne').mockResolvedValue(mockUser);
      
      const user = await userService.getUserByEmail('test@example.com');
      
      expect(user).toEqual(mockUser);
      expect(UserModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    });

    it('should handle non-existent user', async () => {
      mockCache.get.mockResolvedValue(null);
      
      await expect(userService.getUserById('non-existent'))
        .rejects
        .toThrow(ServiceError);
    });
  });

  describe('User Update', () => {
    it('should update user profile', async () => {
      const updates = {
        firstName: 'Updated',
        lastName: 'Name'
      };
      
      mockCache.get.mockResolvedValue(JSON.stringify(mockUser));
      mockCache.set.mockResolvedValue(undefined);
      
      const updatedUser = await userService.updateUser('test-user-id', updates);
      
      expect(updatedUser).toBeDefined();
      expect(updatedUser.firstName).toBe(updates.firstName);
      expect(updatedUser.lastName).toBe(updates.lastName);
      expect(mockCache.set).toHaveBeenCalled();
    });

    it('should handle update errors', async () => {
      mockCache.get.mockResolvedValue(JSON.stringify(mockUser));
      mockCache.set.mockRejectedValue(new Error('Cache error'));
      
      await expect(userService.updateUser('test-user-id', { firstName: 'Updated' }))
        .rejects
        .toThrow(ServiceError);
    });
  });

  describe('User Deletion', () => {
    it('should delete user', async () => {
      mockCache.delete.mockResolvedValue(undefined);
      
      await userService.deleteUser('test-user-id');
      
      expect(mockCache.delete).toHaveBeenCalledWith('user:test-user-id');
    });

    it('should handle deletion errors', async () => {
      mockCache.delete.mockRejectedValue(new Error('Cache error'));
      
      await expect(userService.deleteUser('test-user-id'))
        .rejects
        .toThrow(ServiceError);
    });
  });

  describe('Authentication', () => {
    it('should verify user password', async () => {
      mockCache.get.mockResolvedValue(JSON.stringify(mockUser));
      
      const isValid = await userService.verifyPassword('test@example.com', 'password123');
      
      expect(isValid).toBe(true);
    });

    it('should handle invalid password', async () => {
      mockCache.get.mockResolvedValue(JSON.stringify(mockUser));
      
      const isValid = await userService.verifyPassword('test@example.com', 'wrongpassword');
      
      expect(isValid).toBe(false);
    });

    it('should handle non-existent user in password verification', async () => {
      mockCache.get.mockResolvedValue(null);
      
      await expect(userService.verifyPassword('non-existent@example.com', 'password123'))
        .rejects
        .toThrow(ServiceError);
    });
  });

  describe('Birth Chart Association', () => {
    it('should associate birth chart with user', async () => {
      mockCache.get.mockResolvedValue(JSON.stringify(mockUser));
      mockCache.set.mockResolvedValue(undefined);
      
      const updatedUser = await userService.associateBirthChart('test-user-id', 'new-birth-chart');
      
      expect(updatedUser).toBeDefined();
      expect(updatedUser.birthChartId).toBe('new-birth-chart');
      expect(mockCache.set).toHaveBeenCalled();
    });

    it('should handle association errors', async () => {
      mockCache.get.mockResolvedValue(JSON.stringify(mockUser));
      mockCache.set.mockRejectedValue(new Error('Cache error'));
      
      await expect(userService.associateBirthChart('test-user-id', 'new-birth-chart'))
        .rejects
        .toThrow(ServiceError);
    });
  });
}); 