import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { AuthController } from '../controllers/AuthController';
import { AuthService } from '../../application/services/AuthService';
import { RedisCache } from '../../infrastructure/cache/RedisCache';
import {  } from '../../shared/middleware/auth';
import { validateRequest } from '../../shared/middleware/validateRequest';
import { UserService } from '../../application/services/UserService';
import { BirthChartService } from '../../application/services/BirthChartService';
import { EphemerisService } from '../../application/services/EphemerisService';
import { UserRepository } from '../../infrastructure/database/UserRepository';
import { ICache } from '../../infrastructure/cache/ICache';
import { Sanitizer } from '../../shared/sanitization';
import { EphemerisClient } from '../../infrastructure/clients/EphemerisClient';
import { createAuthMiddleware } from '../../shared/middleware/auth';
import { config } from '../../shared/config';

const router = Router();

// Initialize services
const redisUrl = config.redisUrl;
const cache = new RedisCache(redisUrl);
const ephemerisClient = new EphemerisClient(config.ephemerisApiUrl, config.ephemerisApiKey);
const ephemerisService = new EphemerisService(ephemerisClient, cache);
const birthChartService = new BirthChartService(cache, ephemerisService);
const userRepository = new UserRepository();
const userService = new UserService(cache, birthChartService, userRepository);
const authService = new AuthService(cache, userRepository);
const authController = new AuthController(authService);

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
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
const normalizeAuthInput = (req: any, res: any, next: any) => {
  if (req.body.email) {
    req.body.email = req.body.email.trim().toLowerCase();
  }
  if (req.body.firstName) {
    req.body.firstName = req.body.firstName.trim();
  }
  if (req.body.lastName) {
    req.body.lastName = req.body.lastName.trim();
  }
  next();
};

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'auth' });
});

// Public routes
router.post('/register', authLimiter, normalizeAuthInput, validateRequest(registerSchema), authController.register);
router.post('/login', authLimiter, normalizeAuthInput, validateRequest(loginSchema), authController.login);
router.post('/password-reset', authLimiter, normalizeAuthInput, validateRequest(passwordResetSchema), authController.generatePasswordResetToken);
router.post('/password-reset/:token', authLimiter, validateRequest(resetPasswordSchema), authController.resetPassword);
router.post('/verify-email/:token', validateRequest(emailVerificationSchema), authController.verifyEmail);

// Protected routes
router.post('/logout', createAuthMiddleware(cache), authController.logout);
router.post('/refresh-token', validateRequest(refreshTokenSchema), authController.refreshToken);
router.post('/change-password', createAuthMiddleware(cache), validateRequest(changePasswordSchema), authController.changePassword);
router.get('/sessions', createAuthMiddleware(cache), authController.getActiveSessions);

export default router;

export const createAuthRoutes = (cache: ICache) => {
  const router = Router();
  const userRepository = new UserRepository();
  const authService = new AuthService(cache, userRepository);
  const authController = new AuthController(authService);

  router.post('/register', authController.register);
  router.post('/login', authController.login);
  router.post('/logout', authController.logout);
  router.post('/refresh-token', authController.refreshToken);
  router.post('/verify-email', authController.verifyEmail);
  router.post('/forgot-password', authController.generatePasswordResetToken);
  router.post('/reset-password', authController.resetPassword);

  return router;
}; 