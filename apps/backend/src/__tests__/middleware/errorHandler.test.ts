import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../../shared/middleware/errorHandler';
import {
  AppError,
  ValidationError,
  AuthError,
  NotFoundError,
  DatabaseError,
  CacheError,
  ConfigurationError,
  RateLimitError,
  ServiceUnavailableError,
} from '../../types/errors';

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction = jest.fn();
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    mockRequest = {
      path: '/test',
      method: 'GET',
      ip: '127.0.0.1',
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    consoleSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should handle AppError correctly', () => {
    const error = new AppError('Test error', 'TEST_ERROR', 400);
    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Test error',
      details: undefined,
    });
  });

  it('should handle ValidationError correctly', () => {
    const error = new ValidationError('Validation failed');
    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Validation failed',
      details: undefined,
    });
  });

  it('should handle AuthError correctly', () => {
    const error = new AuthError('Authentication failed');
    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Authentication failed',
      details: undefined,
    });
  });

  it('should handle NotFoundError correctly', () => {
    const error = new NotFoundError('Resource not found');
    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Resource not found',
      details: undefined,
    });
  });

  it('should handle DatabaseError correctly', () => {
    const error = new DatabaseError('Database operation failed');
    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Database operation failed',
      details: undefined,
    });
  });

  it('should handle CacheError correctly', () => {
    const error = new CacheError('Cache operation failed');
    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Cache operation failed',
      details: undefined,
    });
  });

  it('should handle ConfigurationError correctly', () => {
    const error = new ConfigurationError('Configuration error');
    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Configuration error',
      details: undefined,
    });
  });

  it('should handle RateLimitError correctly', () => {
    const error = new RateLimitError('Rate limit exceeded');
    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(429);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Rate limit exceeded',
      details: undefined,
    });
  });

  it('should handle ServiceUnavailableError correctly', () => {
    const error = new ServiceUnavailableError('Service unavailable');
    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(503);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Service unavailable',
      details: undefined,
    });
  });

  it('should handle unknown errors correctly', () => {
    const error = new Error('Unknown error');
    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 'error',
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    });
  });

  it('should handle express-validator ValidationError correctly', () => {
    const error = {
      name: 'ValidationError',
      message: 'Validation failed',
    };
    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: 'Validation failed',
    });
  });

  it('should handle JWT errors correctly', () => {
    const error = {
      name: 'JsonWebTokenError',
      message: 'Invalid token',
    };
    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 'error',
      code: 'INVALID_TOKEN',
      message: 'Invalid authentication token',
    });
  });

  it('should handle expired JWT errors correctly', () => {
    const error = {
      name: 'TokenExpiredError',
      message: 'Token expired',
    };
    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 'error',
      code: 'TOKEN_EXPIRED',
      message: 'Authentication token has expired',
    });
  });

  it('should handle mongoose validation errors correctly', () => {
    const error = {
      name: 'ValidationError',
      message: 'Validation failed',
      errors: {
        field1: { path: 'field1', message: 'Field 1 is required' },
        field2: { path: 'field2', message: 'Field 2 is invalid' },
      },
    } as Error;
    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: [
        { field: 'field1', message: 'Field 1 is required' },
        { field: 'field2', message: 'Field 2 is invalid' },
      ],
    });
  });

  it('should handle mongoose duplicate key errors correctly', () => {
    const error = {
      name: 'MongoError',
      code: 11000,
      message: 'Duplicate key error',
    };
    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(409);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 'error',
      code: 'DUPLICATE_KEY',
      message: 'A record with this value already exists',
    });
  });
}); 