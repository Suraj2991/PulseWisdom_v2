import express, { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { UserController, UserService, UserRepository } from '../../user';
import { AuthService, createAuthMiddleware } from '../../auth';
import { RedisCache } from '../../../infrastructure/cache/RedisCache';
import { AspectService, CelestialBodyService, EphemerisErrorHandler, EphemerisService, HouseService } from '../../ephemeris';
import { BirthChartService } from '../../birthchart';
import { validateRequest } from '../../../shared/middleware/validateRequest';
import { z } from 'zod';
import { EphemerisClient } from '../../ephemeris';
import { config } from '../../../shared/config';
import { RateLimiter } from '../../../shared/utils/rateLimiter';
import { Sanitizer } from '../../../shared/sanitization';
import { DatabaseService } from '../../../infrastructure/database/database';
import { ITokenVerifier } from '../../auth/ports/ITokenVerifier';
import { TokenPayload } from '../../auth/types/auth.types';
import { logger } from '../../../shared/logger';

// Add normalizeUserData middleware
const normalizeUserData = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.body.email) {
    req.body.email = Sanitizer.sanitizeEmail(req.body.email);
  }
  if (req.body.firstName) {
    req.body.firstName = Sanitizer.sanitizeString(req.body.firstName);
  }
  if (req.body.lastName) {
    req.body.lastName = Sanitizer.sanitizeString(req.body.lastName);
  }
  if (req.body.birthLocation?.name) {
    req.body.birthLocation.name = Sanitizer.sanitizeString(req.body.birthLocation.name);
  }
  if (req.body.preferences) {
    req.body.preferences = Sanitizer.sanitizePreferences(req.body.preferences);
  }
  next();
};

const router = Router();

// Initialize services
const redisUrl = config.redisUrl;
const cache = new RedisCache(redisUrl);
const ephemerisClient = new EphemerisClient(config.ephemerisApiUrl, config.ephemerisApiKey);
const celestialBodyService = new CelestialBodyService(cache);
const aspectService = new AspectService(cache);
const houseService = new HouseService(cache, ephemerisClient);
const errorHandler = new EphemerisErrorHandler(cache, ephemerisClient);
const ephemerisService = new EphemerisService(ephemerisClient, cache, celestialBodyService, aspectService, houseService, errorHandler);
const birthChartService = new BirthChartService(cache, ephemerisService);

const rateLimiter = new RateLimiter();
const databaseService = DatabaseService.getInstance();
const userRepository = new UserRepository(databaseService);
const authService = new AuthService(cache, userRepository, rateLimiter);
const userService = new UserService(cache, birthChartService, userRepository);
const userController = new UserController(userService, authService);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'users' });
});

// Validation schemas
const userIdSchema = z.object({
  params: z.object({
    userId: z.string().min(1, 'User ID is required')
  })
});

const emailSchema = z.object({
  params: z.object({
    email: z.string().email('Invalid email format')
  })
});

const createUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    birthDate: z.string().optional(),
    birthLocation: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      placeName: z.string().min(1, 'Place name is required')
    }).optional()
  })
});

const updateUserSchema = z.object({
  params: z.object({
    userId: z.string().min(1, 'User ID is required')
  }),
  body: z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters').optional(),
    lastName: z.string().min(2, 'Last name must be at least 2 characters').optional(),
    birthDate: z.string().optional(),
    birthLocation: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      placeName: z.string().min(1, 'Place name is required')
    }).optional()
  })
});

const searchSchema = z.object({
  query: z.object({
    query: z.string().min(1, 'Search query is required'),
    limit: z.number().optional().default(10)
  })
});

const validatePasswordSchema = z.object({
  params: z.object({
    userId: z.string().min(1, 'User ID is required')
  }),
  body: z.object({
    password: z.string().min(8, 'Password must be at least 8 characters')
  })
});

const updatePreferencesSchema = z.object({
  params: z.object({
    userId: z.string().min(1, 'User ID is required')
  }),
  body: z.object({
    timezone: z.string().optional(),
    houseSystem: z.string().optional(),
    aspectOrbs: z.number().optional(),
    themePreferences: z.object({
      colorScheme: z.enum(['light', 'dark']).optional(),
      fontSize: z.enum(['small', 'medium', 'large']).optional(),
      showAspects: z.boolean().optional(),
      showHouses: z.boolean().optional(),
      showPlanets: z.boolean().optional(),
      showRetrogrades: z.boolean().optional(),
      showLunarPhases: z.boolean().optional(),
      showEclipses: z.boolean().optional(),
      showStations: z.boolean().optional(),
      showHeliacal: z.boolean().optional(),
      showCosmic: z.boolean().optional()
    }).optional(),
    insightPreferences: z.object({
      categories: z.array(z.string()).optional(),
      severity: z.array(z.string()).optional(),
      types: z.array(z.string()).optional(),
      showRetrogrades: z.boolean().optional(),
      showEclipses: z.boolean().optional(),
      showStations: z.boolean().optional(),
      showHeliacal: z.boolean().optional(),
      showCosmic: z.boolean().optional(),
      dailyInsights: z.boolean().optional(),
      progressionInsights: z.boolean().optional(),
      lifeThemeInsights: z.boolean().optional(),
      birthChartInsights: z.boolean().optional()
    }).optional(),
    notificationPreferences: z.object({
      email: z.object({
        dailyInsights: z.boolean().optional(),
        eclipseAlerts: z.boolean().optional(),
        retrogradeAlerts: z.boolean().optional(),
        stationAlerts: z.boolean().optional(),
        heliacalAlerts: z.boolean().optional(),
        cosmicAlerts: z.boolean().optional()
      }).optional(),
      push: z.object({
        dailyInsights: z.boolean().optional(),
        eclipseAlerts: z.boolean().optional(),
        retrogradeAlerts: z.boolean().optional(),
        stationAlerts: z.boolean().optional(),
        heliacalAlerts: z.boolean().optional(),
        cosmicAlerts: z.boolean().optional()
      }).optional(),
      frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
      quietHours: z.object({
        enabled: z.boolean().optional(),
        start: z.string().optional(),
        end: z.string().optional()
      }).optional()
    }).optional()
  })
});

// Middleware for all routes
router.use(express.json());

// Public routes
router.post('/', normalizeUserData, validateRequest(createUserSchema), userController.createUser);

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

router.use(createAuthMiddleware(tokenVerifier));

// Profile route (should be before :userId routes)
router.get('/profile', (req: Request, res: Response, next: NextFunction) => {
  userController.getUserById(req, res, next);
});

// Search route (should be before :userId routes)
router.get(
  '/search',
  validateRequest(searchSchema),
  (req: Request, res: Response, next: NextFunction) => {
    userController.searchUsers(req, res, next);
  }
);

// Email route (should be before :userId routes)
router.get(
  '/email/:email',
  validateRequest(emailSchema),
  (req: Request, res: Response, next: NextFunction) => {
    userController.getUserByEmail(req, res, next);
  }
);

// User profile routes
router.get(
  '/:userId',
  validateRequest(userIdSchema),
  (req: Request, res: Response, next: NextFunction) => {
    userController.getUserById(req, res, next);
  }
);

router.put(
  '/:userId',
  createAuthMiddleware(tokenVerifier) as RequestHandler,
  normalizeUserData,
  validateRequest(updateUserSchema),
  (req: Request, res: Response, next: NextFunction) => {
    userController.updateUser(req, res, next);
  }
);

router.delete(
  '/:userId',
  validateRequest(userIdSchema),
  (req: Request, res: Response, next: NextFunction) => {
    userController.deleteUser(req, res, next);
  }
);

// User preferences routes
router.put(
  '/:userId/preferences',
  createAuthMiddleware(tokenVerifier) as RequestHandler,
  normalizeUserData,
  validateRequest(updatePreferencesSchema),
  (req: Request, res: Response, next: NextFunction) => {
    userController.updatePreferences(req, res, next);
  }
);

// User birth charts routes
router.get(
  '/:userId/birth-charts',
  validateRequest(userIdSchema),
  (req: Request, res: Response, next: NextFunction) => {
    userController.getUserBirthCharts(req, res, next);
  }
);

// Password validation route
router.post(
  '/:userId/validate-password',
  validateRequest(validatePasswordSchema),
  (req: Request, res: Response, next: NextFunction) => {
    userController.validatePassword(req, res, next);
  }
);

// Error handling middleware should be last
router.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error'
  });
});

export default router; 