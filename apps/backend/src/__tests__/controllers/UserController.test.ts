import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { UserController } from '../../controllers/UserController';
import { UserService } from '../../services/UserService';
import { ValidationError, NotFoundError } from '../../types/errors';

jest.mock('../../services/UserService');

describe('UserController', () => {
  let userController: UserController;
  let mockUserService: jest.Mocked<UserService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Response;
  let nextFunction: jest.Mock;

  const mockUserId = new Types.ObjectId('507f1f77bcf86cd799439011');
  const mockUser = {
    _id: mockUserId,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User'
  };

  beforeEach(() => {
    mockRequest = {
      params: {},
      body: {}
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as unknown as Response;

    nextFunction = jest.fn();

    mockUserService = {
      getUserById: jest.fn(),
      updateUser: jest.fn(),
      updateUserPreferences: jest.fn(),
      deleteUser: jest.fn(),
      getUserBirthCharts: jest.fn()
    } as unknown as jest.Mocked<UserService>;

    userController = new UserController(mockUserService);
  });

  describe('getUserById', () => {
    it('should get user by ID successfully', async () => {
      mockRequest.params = { userId: mockUserId.toString() };
      mockUserService.getUserById.mockResolvedValue(mockUser as any);

      await userController.getUserById(mockRequest as Request, mockResponse, nextFunction);

      expect(mockUserService.getUserById).toHaveBeenCalledWith(mockUserId.toString());
      expect(mockResponse.json).toHaveBeenCalledWith(mockUser);
    });

    it('should handle user not found', async () => {
      mockRequest.params = { userId: mockUserId.toString() };
      mockUserService.getUserById.mockRejectedValue(new NotFoundError('User not found'));

      await userController.getUserById(mockRequest as Request, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const updateData = { firstName: 'Updated' };
      mockRequest.params = { userId: mockUserId.toString() };
      mockRequest.body = updateData;
      mockUserService.updateUser.mockResolvedValue({ ...mockUser, ...updateData } as any);

      await userController.updateUser(mockRequest as Request, mockResponse, nextFunction);

      expect(mockUserService.updateUser).toHaveBeenCalledWith(mockUserId.toString(), updateData);
      expect(mockResponse.json).toHaveBeenCalledWith({ ...mockUser, ...updateData });
    });

    it('should handle missing userId', async () => {
      mockRequest.params = {};

      await userController.updateUser(mockRequest as Request, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(expect.any(ValidationError));
    });
  });

  describe('updatePreferences', () => {
    it('should update preferences successfully', async () => {
      const preferences = { theme: 'dark' };
      mockRequest.params = { userId: mockUserId.toString() };
      mockRequest.body = preferences;
      mockUserService.updateUserPreferences.mockResolvedValue({ ...mockUser, preferences } as any);

      await userController.updatePreferences(mockRequest as Request, mockResponse, nextFunction);

      expect(mockUserService.updateUserPreferences).toHaveBeenCalledWith(mockUserId.toString(), preferences);
      expect(mockResponse.json).toHaveBeenCalledWith({ ...mockUser, preferences });
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      mockRequest.params = { userId: mockUserId.toString() };
      mockUserService.deleteUser.mockResolvedValue(true);

      await userController.deleteUser(mockRequest as Request, mockResponse, nextFunction);

      expect(mockUserService.deleteUser).toHaveBeenCalledWith(mockUserId.toString());
      expect(mockResponse.json).toHaveBeenCalledWith({ success: true });
    });
  });

  describe('getUserBirthCharts', () => {
    it('should get user birth charts successfully', async () => {
      const mockCharts = [{ id: 'chart1' }];
      mockRequest.params = { userId: mockUserId.toString() };
      mockUserService.getUserBirthCharts.mockResolvedValue(mockCharts as any);

      await userController.getUserBirthCharts(mockRequest as Request, mockResponse, nextFunction);

      expect(mockUserService.getUserBirthCharts).toHaveBeenCalledWith(mockUserId.toString());
      expect(mockResponse.json).toHaveBeenCalledWith(mockCharts);
    });
  });
}); 