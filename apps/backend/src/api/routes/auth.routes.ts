import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { AuthController } from '../controllers/AuthController';
import { AuthService } from '../services/AuthService';
import { RedisCache } from '../infrastructure/cache/RedisCache';
import { authenticate } from '../shared/middleware/auth';
import { validateRequest } from '../shared/middleware/validateRequest';
import { UserService } from '../services/UserService';
import { BirthChartService } from '../services/BirthChartService';
import { EphemerisService } from '../services/EphemerisService';

const router = Router();

// Initialize services
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const cache = new RedisCache(redisUrl);
const ephemerisService = new EphemerisService(cache, 'http://localhost:8000');
const birthChartService = new BirthChartService(cache, ephemerisService);
const userService = new UserService(cache, birthChartService);
const authService = new AuthService(cache, userService);
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

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'auth' });
});

// Public routes
router.post('/register', authLimiter, validateRequest(registerSchema), authController.register);
router.post('/login', authLimiter, validateRequest(loginSchema), authController.login);
router.post('/password-reset', authLimiter, validateRequest(passwordResetSchema), authController.generatePasswordResetToken);
router.post('/password-reset/:token', authLimiter, validateRequest(resetPasswordSchema), authController.resetPassword);
router.post('/verify-email/:token', validateRequest(emailVerificationSchema), authController.verifyEmail);

// Protected routes
router.post('/logout', authenticate, authController.logout);
router.post('/refresh-token', validateRequest(refreshTokenSchema), authController.refreshToken);
router.post('/change-password', authenticate, validateRequest(changePasswordSchema), authController.changePassword);
router.get('/sessions', authenticate, authController.getActiveSessions);

export default router; 