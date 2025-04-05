import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { validateRequest } from '../../shared/middleware/validateRequest';
import { z } from 'zod';

describe('Validate Request Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      body: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    nextFunction = jest.fn();
  });

  describe('Successful Validation', () => {
    it('should pass validation for valid request body', async () => {
      const schema: ZodSchema = z.object({
        email: z.string().email(),
        password: z.string().min(6)
      });

      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123'
      };

      await validateRequest(schema)(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('Validation Errors', () => {
    it('should handle single field validation error', async () => {
      const schema: ZodSchema = z.object({
        email: z.string().email(),
        password: z.string().min(6)
      });

      mockRequest.body = {
        email: 'invalid-email',
        password: 'password123'
      };

      await validateRequest(schema)(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('email'),
          statusCode: 400
        })
      );
    });

    it('should handle multiple field validation errors', async () => {
      const schema: ZodSchema = z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(2)
      });

      mockRequest.body = {
        email: 'invalid-email',
        password: '123', // too short
        name: 'a' // too short
      };

      await validateRequest(schema)(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      const error = nextFunction.mock.calls[0][0];
      expect(error.message).toContain('email');
      expect(error.message).toContain('password');
      expect(error.message).toContain('name');
      expect(error.statusCode).toBe(400);
    });

    it('should handle missing required fields', async () => {
      const schema: ZodSchema = z.object({
        email: z.string().email(),
        password: z.string().min(6)
      });

      mockRequest.body = {
        email: 'test@example.com'
        // password missing
      };

      await validateRequest(schema)(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('password'),
          statusCode: 400
        })
      );
    });

    it('should handle invalid data types', async () => {
      const schema: ZodSchema = z.object({
        age: z.number().int().positive(),
        isActive: z.boolean()
      });

      mockRequest.body = {
        age: 'not-a-number',
        isActive: 'not-a-boolean'
      };

      await validateRequest(schema)(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      const error = nextFunction.mock.calls[0][0];
      expect(error.message).toContain('age');
      expect(error.message).toContain('isActive');
      expect(error.statusCode).toBe(400);
    });

    it('should handle nested object validation', async () => {
      const schema: ZodSchema = z.object({
        user: z.object({
          profile: z.object({
            name: z.string().min(2),
            age: z.number().int().positive()
          })
        })
      });

      mockRequest.body = {
        user: {
          profile: {
            name: 'a', // too short
            age: -1 // negative
          }
        }
      };

      await validateRequest(schema)(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      const error = nextFunction.mock.calls[0][0];
      expect(error.message).toContain('name');
      expect(error.message).toContain('age');
      expect(error.statusCode).toBe(400);
    });

    it('should handle array validation', async () => {
      const schema: ZodSchema = z.object({
        tags: z.array(z.string().min(2))
      });

      mockRequest.body = {
        tags: ['a', 'valid-tag'] // first item too short
      };

      await validateRequest(schema)(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('tags'),
          statusCode: 400
        })
      );
    });
  });

  describe('Error Formatting', () => {
    it('should format validation errors with field names', async () => {
      const schema: ZodSchema = z.object({
        email: z.string().email(),
        password: z.string().min(6)
      });

      mockRequest.body = {
        email: 'invalid-email',
        password: '123'
      };

      await validateRequest(schema)(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      const error = nextFunction.mock.calls[0][0];
      expect(error.message).toMatch(/email: .*password:/);
    });

    it('should include all validation errors in the message', async () => {
      const schema: ZodSchema = z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(2)
      });

      mockRequest.body = {
        email: 'invalid-email',
        password: '123',
        name: 'a'
      };

      await validateRequest(schema)(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      const error = nextFunction.mock.calls[0][0];
      expect(error.message.split(',')).toHaveLength(3);
    });
  });
}); 