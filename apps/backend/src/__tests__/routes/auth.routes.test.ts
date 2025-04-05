import express from 'express';
import request from 'supertest';
import { AuthService } from '../../services/AuthService';
import { UserService } from '../../services/UserService';
import { BirthChartService } from '../../services/BirthChartService';
import { AuthController } from '../../controllers/AuthController';
import { errorHandler } from '../../shared/middleware/errorHandler';
import { validateRequest } from '../../shared/middleware/validateRequest';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { IUser } from '../../models/User';
import { AuthError } from '../../types/errors';
import { LoginCredentials } from '../../types/auth.types';

// Mock services
jest.mock('../../services/AuthService');
jest.mock('../../services/UserService');
jest.mock('../../services/BirthChartService');
jest.mock('../../shared/middleware/auth', () => {
  const { AuthError } = require('../../types/errors');

  return {
    authenticate: jest.fn((req: express.Request, res: express.Response, next: express.NextFunction) => {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return next(new AuthError('Authentication required'));
      }
      req.user = { 
        id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'user'
      } as IUser;
      next();
    }),
    requireRole: (role: string) => {
      return (req: express.Request, res: express.Response, next: express.NextFunction) => {
        if (!req.user) {
          return next(new AuthError('Authentication required'));
        }
        if (req.user.role !== role) {
          return next(new AuthError('Insufficient permissions'));
        }
        next();
      };
    }
  };
});

describe('Auth Routes', () => {
  let app: express.Application;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockUserService: jest.Mocked<UserService>;
  let mockBirthChartService: jest.Mocked<BirthChartService>;

  const mockUser = {
    id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User'
  };

  const mockTokens = {
    accessToken: 'mockAccessToken',
    refreshToken: 'mockRefreshToken'
  };

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Setup mock services
    mockBirthChartService = new BirthChartService({} as any, {} as any) as jest.Mocked<BirthChartService>;
    mockUserService = new UserService({} as any, mockBirthChartService) as jest.Mocked<UserService>;
    mockAuthService = new AuthService({} as any, mockUserService) as jest.Mocked<AuthService>;

    // Setup default mock implementations
    mockAuthService.register.mockResolvedValue({ user: mockUser, tokens: mockTokens });
    mockAuthService.login.mockImplementation(async (credentials: LoginCredentials) => {
      if (credentials.email === 'test@example.com' && credentials.password === 'Test123!@#') {
        return { user: mockUser, tokens: mockTokens };
      }
      throw new AuthError('Invalid credentials');
    });
    mockAuthService.logout.mockResolvedValue(undefined);
    mockAuthService.getActiveSessions.mockResolvedValue([]);
    mockAuthService.changePassword.mockResolvedValue(undefined);
    mockAuthService.refreshToken.mockResolvedValue(mockTokens);
    mockAuthService.generatePasswordResetToken.mockResolvedValue('reset-token');
    mockAuthService.resetPassword.mockResolvedValue(undefined);
    mockAuthService.verifyEmail.mockResolvedValue(undefined);

    // Setup Express app
    app = express();
    app.use(express.json());

    const router = express.Router();
    const authController = new AuthController(mockAuthService);

    // Setup validation schemas
    const registerSchema = z.object({
      body: z.object({
        email: z.string().email('Invalid email format'),
        password: z.string().min(8, 'Password must be at least 8 characters'),
        firstName: z.string().min(2, 'First name must be at least 2 characters'),
        lastName: z.string().min(2, 'Last name must be at least 2 characters')
      }),
      params: z.object({}).optional(),
      query: z.object({}).optional()
    });

    const loginSchema = z.object({
      body: z.object({
        email: z.string().email('Invalid email format'),
        password: z.string().min(1, 'Password is required')
      }),
      params: z.object({}).optional(),
      query: z.object({}).optional()
    });

    const changePasswordSchema = z.object({
      body: z.object({
        currentPassword: z.string().min(1, 'Current password is required'),
        newPassword: z.string().min(8, 'Password must be at least 8 characters')
      }),
      params: z.object({}).optional(),
      query: z.object({}).optional()
    });

    const refreshTokenSchema = z.object({
      body: z.object({
        refreshToken: z.string().min(1, 'Refresh token is required')
      }),
      params: z.object({}).optional(),
      query: z.object({}).optional()
    });

    const passwordResetSchema = z.object({
      body: z.object({
        email: z.string().email('Invalid email format')
      }),
      params: z.object({}).optional(),
      query: z.object({}).optional()
    });

    const resetPasswordSchema = z.object({
      body: z.object({
        newPassword: z.string().min(8, 'Password must be at least 8 characters')
      }),
      params: z.object({
        token: z.string().min(1, 'Token is required')
      }),
      query: z.object({}).optional()
    });

    const emailVerificationSchema = z.object({
      body: z.object({}),
      params: z.object({
        token: z.string().min(1, 'Token is required')
      }),
      query: z.object({}).optional()
    });

    // Setup rate limiter
    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5,
      message: { message: 'Too many attempts, please try again after 15 minutes' },
      standardHeaders: true,
      legacyHeaders: false
    });

    // Setup routes
    router.get('/health', (req, res) => res.json({ status: 'ok', service: 'auth' }));
    router.post('/register', authLimiter, validateRequest(registerSchema), authController.register);
    router.post('/login', authLimiter, validateRequest(loginSchema), authController.login);
    router.post('/logout', require('../../shared/middleware/auth').authenticate, authController.logout);
    router.post('/refresh-token', validateRequest(refreshTokenSchema), authController.refreshToken);
    router.post('/password-reset', authLimiter, validateRequest(passwordResetSchema), authController.generatePasswordResetToken);
    router.post('/password-reset/:token', validateRequest(resetPasswordSchema), authController.resetPassword);
    router.post('/verify-email/:token', validateRequest(emailVerificationSchema), authController.verifyEmail);
    router.post('/change-password', require('../../shared/middleware/auth').authenticate, validateRequest(changePasswordSchema), authController.changePassword);
    router.get('/sessions', require('../../shared/middleware/auth').authenticate, authController.getActiveSessions);

    app.use('/api/v1/auth', router);
    app.use(errorHandler);
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/v1/auth/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'ok',
        service: 'auth'
      });
    });
  });

  describe('Registration', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test123!@#',
        firstName: 'Test',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        message: 'User registered successfully',
        user: mockUser,
        tokens: mockTokens
      });
    });

    it('should return 400 for invalid registration data', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('status', 'error');
    });
  });

  describe('Login', () => {
    it('should login user successfully', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'Test123!@#'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Login successful',
        user: mockUser,
        tokens: mockTokens
      });
    });

    it('should return 401 for invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('status', 'error');
    });
  });

  describe('Logout', () => {
    it('should logout user successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', 'Bearer mockAccessToken');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Logged out successfully' });
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('status', 'error');
    });
  });

  describe('Password Reset', () => {
    it('should generate password reset token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/password-reset')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Password reset email sent',
        token: 'reset-token'
      });
    });

    it('should reset password with valid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/password-reset/reset-token')
        .send({ newPassword: 'NewTest123!@#' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Password reset successful' });
    });
  });

  describe('Email Verification', () => {
    it('should verify email with valid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/verify-email/verification-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Email verified successfully' });
    });
  });

  describe('Change Password', () => {
    it('should change password successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', 'Bearer mockAccessToken')
        .send({
          currentPassword: 'Test123!@#',
          newPassword: 'NewTest123!@#'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Password changed successfully' });
    });
  });

  describe('Active Sessions', () => {
    it('should get active sessions', async () => {
      const response = await request(app)
        .get('/api/v1/auth/sessions')
        .set('Authorization', 'Bearer mockAccessToken');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    it('should limit login attempts', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'Test123!@#'
      };

      for (let i = 0; i < 6; i++) {
        const response = await request(app)
          .post('/api/v1/auth/login')
          .send(loginData);

        if (i < 5) {
          expect(response.status).toBe(200);
        } else {
          expect(response.status).toBe(429);
          expect(response.body).toHaveProperty('message', 'Too many attempts, please try again after 15 minutes');
        }
      }
    });
  });
});