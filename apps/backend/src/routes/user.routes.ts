import express, { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { UserService } from '../services/UserService';
import { authenticate } from '../shared/middleware/auth';
import { RedisCache } from '../infrastructure/cache/RedisCache';
import { EphemerisService } from '../services/EphemerisService';
import { BirthChartService } from '../services/BirthChartService';
import { validateRequest } from '../shared/middleware/validateRequest';
import { z } from 'zod';
import { errorHandler } from '../shared/middleware/errorHandler';

const router = Router();

// Initialize services
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const cache = new RedisCache(redisUrl);
const ephemerisService = new EphemerisService(cache, process.env.EPHEMERIS_SERVICE_URL || 'http://localhost:3000');
const birthChartService = new BirthChartService(cache, ephemerisService);
const userService = new UserService(cache, birthChartService);
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
router.post('/', validateRequest(createUserSchema), userController.createUser);

// Protected routes
router.use(authenticate);

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