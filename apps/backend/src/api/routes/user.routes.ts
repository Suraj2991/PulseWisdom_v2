import express, { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { UserService } from '../../application/services/UserService';
import { createAuthMiddleware } from '../../shared/middleware/auth';
import { RedisCache } from '../../infrastructure/cache/RedisCache';
import { EphemerisService } from '../../application/services/EphemerisService';
import { BirthChartService } from '../../application/services/BirthChartService';
import { validateRequest } from '../../shared/middleware/validateRequest';
import { z } from 'zod';
import { errorHandler } from '../../shared/middleware/errorHandler';
import { ICache } from '../../infrastructure/cache/ICache';
import { EphemerisClient } from '../../infrastructure/clients/EphemerisClient';
import { UserRepository } from '../../infrastructure/database/UserRepository';
import { config } from '../../shared/config';

// Add normalizeUserData middleware
const normalizeUserData = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.body) {
    // Normalize email
    if (req.body.email) {
      req.body.email = req.body.email.toLowerCase().trim();
    }

    // Normalize names
    if (req.body.firstName) {
      req.body.firstName = req.body.firstName.trim();
    }
    if (req.body.lastName) {
      req.body.lastName = req.body.lastName.trim();
    }

    // Normalize birth location if present
    if (req.body.birthLocation) {
      if (req.body.birthLocation.placeName) {
        req.body.birthLocation.placeName = req.body.birthLocation.placeName.trim();
      }
      if (req.body.birthLocation.latitude) {
        req.body.birthLocation.latitude = Number(req.body.birthLocation.latitude);
      }
      if (req.body.birthLocation.longitude) {
        req.body.birthLocation.longitude = Number(req.body.birthLocation.longitude);
      }
    }

    // Normalize preferences if present
    if (req.body.preferences) {
      if (req.body.preferences.timezone) {
        req.body.preferences.timezone = req.body.preferences.timezone.trim();
      }
      if (req.body.preferences.language) {
        req.body.preferences.language = req.body.preferences.language.toLowerCase().trim();
      }
    }
  }
  next();
};

const router = Router();

// Initialize services
const redisUrl = config.redisUrl;
const cache = new RedisCache(redisUrl);
const ephemerisClient = new EphemerisClient(config.ephemerisApiUrl, config.ephemerisApiKey);
const ephemerisService = new EphemerisService(ephemerisClient, cache);
const birthChartService = new BirthChartService(cache, ephemerisService);
const userRepository = new UserRepository();
const userService = new UserService(cache, birthChartService, userRepository);
const userController = new UserController(userService);

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
router.use(createAuthMiddleware(cache));

// Profile route (should be before :userId routes)
router.get('/profile', userController.getUserById);

// Search route (should be before :userId routes)
router.get(
  '/search',
  validateRequest(searchSchema),
  userController.searchUsers
);

// Email route (should be before :userId routes)
router.get(
  '/email/:email',
  validateRequest(emailSchema),
  userController.getUserByEmail
);

// User profile routes
router.get(
  '/:userId',
  validateRequest(userIdSchema),
  userController.getUserById
);

router.put(
  '/:userId',
  createAuthMiddleware(cache),
  normalizeUserData,
  validateRequest(updateUserSchema),
  userController.updateUser
);

router.delete(
  '/:userId',
  validateRequest(userIdSchema),
  userController.deleteUser
);

// User preferences routes
router.put(
  '/:userId/preferences',
  createAuthMiddleware(cache),
  normalizeUserData,
  validateRequest(updatePreferencesSchema),
  userController.updatePreferences
);

// User birth charts routes
router.get(
  '/:userId/birth-charts',
  validateRequest(userIdSchema),
  userController.getUserBirthCharts
);

// Password validation route
router.post(
  '/:userId/validate-password',
  validateRequest(validatePasswordSchema),
  userController.validatePassword
);

// Error handling middleware should be last
router.use(errorHandler);

export default router; 