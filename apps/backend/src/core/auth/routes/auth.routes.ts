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
import { TokenPayload, AuthRequest } from '../types/auth.types';

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

// Type-safe request body types
type RegisterBody = z.infer<typeof registerSchema>;
type LoginBody = z.infer<typeof loginSchema>;
type RefreshTokenBody = z.infer<typeof refreshTokenSchema>;
type PasswordResetBody = z.infer<typeof passwordResetSchema>;
type ResetPasswordBody = z.infer<typeof resetPasswordSchema>;

// Normalize and sanitize auth input
const normalizeAuthInput = (req: Request, res: Response, next: NextFunction): void => {
  const body = req.body as Partial<RegisterBody>;
  
  if (body.email) {
    body.email = Sanitizer.sanitizeEmail(body.email);
  }
  if (body.firstName) {
    body.firstName = Sanitizer.sanitizeString(body.firstName);
  }
  if (body.lastName) {
    body.lastName = Sanitizer.sanitizeString(body.lastName);
  }
  next();
};

// Health check endpoint
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'auth' });
});

// Create a type-safe middleware handler
function createMiddleware<P = unknown, ResBody = unknown, ReqBody = unknown>(
  middleware: (req: Request<P, ResBody, ReqBody>, res: Response) => Promise<void>
): RequestHandler {
  return function expressHandler(req: Request, res: Response, next: NextFunction): void {
    void middleware(req as Request<P, ResBody, ReqBody>, res).catch(next);
  };
}

// Public routes with type-safe request bodies
router.post(
  '/register',
  authLimiter,
  normalizeAuthInput,
  validateRequest(registerSchema),
  createMiddleware<unknown, unknown, RegisterBody>((req, res) => authController.register(req, res))
);

router.post(
  '/login',
  authLimiter,
  normalizeAuthInput,
  validateRequest(loginSchema),
  createMiddleware<unknown, unknown, LoginBody>((req, res) => authController.login(req, res))
);

router.post(
  '/password-reset',
  authLimiter,
  normalizeAuthInput,
  validateRequest(passwordResetSchema),
  createMiddleware<unknown, unknown, PasswordResetBody>((req, res) => authController.generatePasswordResetToken(req, res))
);

router.post(
  '/password-reset/:token',
  authLimiter,
  validateRequest(resetPasswordSchema),
  createMiddleware<{ token: string }, unknown, ResetPasswordBody>((req, res) => authController.resetPassword(req, res))
);

router.post(
  '/verify-email/:token',
  authLimiter,
  validateRequest(emailVerificationSchema),
  createMiddleware<{ token: string }>((req, res) => authController.verifyEmail(req, res))
);

// Protected routes
const tokenVerifier: ITokenVerifier = {
  verifyToken: async (token: string) => {
    try {
      const decoded = await cache.get(`token:${token}`);
      if (!decoded || typeof decoded !== 'string') return null;
      
      const parsed = JSON.parse(decoded) as TokenPayload;
      
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

// Protected routes with type-safe request handling
router.post(
  '/logout',
  authMiddleware as RequestHandler,
  createMiddleware((req, res) => authController.logout(req as AuthRequest, res))
);

router.post(
  '/refresh-token',
  authLimiter,
  validateRequest(refreshTokenSchema),
  createMiddleware<unknown, unknown, RefreshTokenBody>((req, res) => authController.refreshToken(req, res))
);

router.post(
  '/change-password',
  authMiddleware as RequestHandler,
  validateRequest(changePasswordSchema),
  createMiddleware((req, res) => authController.changePassword(req as AuthRequest, res))
);

router.get(
  '/sessions',
  authMiddleware as RequestHandler,
  createMiddleware((req, res) => authController.getActiveSessions(req as AuthRequest, res))
);

export default router;