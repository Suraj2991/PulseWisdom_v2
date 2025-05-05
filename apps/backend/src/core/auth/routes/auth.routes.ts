import { Request, Response, NextFunction, RequestHandler, Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { AuthController } from '../controllers/AuthController';
import { AuthService } from '../services/AuthService';
import { RedisCache } from '../../../infrastructure/cache/RedisCache';
import { validateRequest } from '../../../shared/middleware/validateRequest';
import { UserRepository } from '../../user/database/UserRepository';
import { createAuthMiddleware } from '../middleware/auth';
import { config } from '../../../shared/config';
import { RateLimiter } from '../../../shared/utils/rateLimiter';
import { Sanitizer } from '../../../shared/sanitization';
import { DatabaseService } from '../../../infrastructure/database/database';
import { ITokenVerifier } from '../ports/ITokenVerifier';
import { logger } from '../../../shared/logger';
import { TokenPayload } from '../types/auth.types';

const router = Router();

// Initialize services
const redisUrl = config.redisUrl;
const cache = new RedisCache(redisUrl);
const databaseService = DatabaseService.getInstance();
const rateLimiter = new RateLimiter();
const userRepository = new UserRepository(databaseService);
const authService = new AuthService(cache, userRepository, rateLimiter);
const authController = new AuthController(authService);

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  message: 'Too many attempts, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false
});

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters')
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters')
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

const passwordResetSchema = z.object({
  email: z.string().email('Invalid email format')
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters')
});

const emailVerificationSchema = z.object({
  token: z.string().min(1, 'Token is required')
});

// Normalize and sanitize auth input
const normalizeAuthInput = (req: Request, res: Response, next: NextFunction): void => {
  if (req.body.email) {
    req.body.email = Sanitizer.sanitizeEmail(req.body.email);
  }
  if (req.body.firstName) {
    req.body.firstName = Sanitizer.sanitizeString(req.body.firstName);
  }
  if (req.body.lastName) {
    req.body.lastName = Sanitizer.sanitizeString(req.body.lastName);
  }
  next();
};

// Health check endpoint
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'auth' });
});

// Public routes
router.post('/register', authLimiter, normalizeAuthInput, validateRequest(registerSchema), authController.register);
router.post('/login', authLimiter, normalizeAuthInput, validateRequest(loginSchema), authController.login);
router.post('/password-reset', authLimiter, normalizeAuthInput, validateRequest(passwordResetSchema), authController.generatePasswordResetToken);
router.post('/password-reset/:token', authLimiter, validateRequest(resetPasswordSchema), authController.resetPassword);
router.post('/verify-email/:token', authLimiter, validateRequest(emailVerificationSchema), authController.verifyEmail);

// Protected routes
const tokenVerifier: ITokenVerifier = {
  verifyToken: async (token: string) => {
    try {
      const decoded = await cache.get(`token:${token}`);
      if (!decoded) return null;
      
      const parsed = JSON.parse(decoded as string) as TokenPayload;
      
      // Check if token is expired
      if (parsed.exp && parsed.exp < Date.now() / 1000) {
        await cache.delete(`token:${token}`);
        return null;
      }
      
      return {
        userId: parsed.userId,
        role: parsed.role
      };
    } catch (error) {
      logger.error('Token verification failed', { error });
      return null;
    }
  }
};

const authMiddleware = createAuthMiddleware(tokenVerifier);
router.post('/logout', authMiddleware as RequestHandler, authController.logout as RequestHandler);
router.post('/refresh-token', authLimiter, validateRequest(refreshTokenSchema), authController.refreshToken);
router.post('/change-password', authMiddleware as RequestHandler, validateRequest(changePasswordSchema), authController.changePassword as RequestHandler);
router.get('/sessions', authMiddleware as RequestHandler, authController.getActiveSessions as RequestHandler);

export default router;