import { Router } from 'express';
import { BirthChartController } from '../controllers/BirthChartController';
import { BirthChartService } from '../../application/services/BirthChartService';
import { authenticate } from '../middleware/auth';
import { RedisCache } from '../../infrastructure/cache/RedisCache';
import { EphemerisService } from '../../application/services/EphemerisService';
import { validateRequest } from '../../shared/middleware/validateRequest';
import { z } from 'zod';
import { HouseSystem, HOUSE_SYSTEMS } from '../../shared/constants/astrology';
import { ICache } from '../../infrastructure/cache/ICache';
import { Sanitizer } from '../../shared/sanitization';
import { EphemerisClient } from '../../infrastructure/clients/EphemerisClient';
import { config } from '../../shared/config';

const router = Router();

// Initialize services
const redisUrl = config.redisUrl;
const cache = new RedisCache(redisUrl);
const ephemerisClient = new EphemerisClient(config.ephemerisApiUrl, config.ephemerisApiKey);
const ephemerisService = new EphemerisService(ephemerisClient, cache);
const birthChartService = new BirthChartService(cache, ephemerisService);
const birthChartController = new BirthChartController(birthChartService);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'birth-charts' });
});

// Validation schemas
const userIdSchema = z.object({
  params: z.object({
    userId: z.string().min(1, 'User ID is required')
  })
});

const birthChartIdSchema = z.object({
  params: z.object({
    birthChartId: z.string().min(1, 'Birth chart ID is required')
  })
});

const createBirthChartSchema = z.object({
  params: z.object({
    userId: z.string().min(1, 'User ID is required')
  }),
  body: z.object({
    datetime: z.object({
      year: z.number().int(),
      month: z.number().int().min(1).max(12),
      day: z.number().int().min(1).max(31),
      hour: z.number().int().min(0).max(23),
      minute: z.number().int().min(0).max(59),
      second: z.number().int().min(0).max(59),
      timezone: z.string().min(1, 'Timezone is required')
    }),
    location: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180)
    })
  })
});

const updateBirthChartSchema = z.object({
  params: z.object({
    birthChartId: z.string().min(1, 'Birth chart ID is required')
  }),
  body: z.object({
    datetime: z.object({
      year: z.number().int(),
      month: z.number().int().min(1).max(12),
      day: z.number().int().min(1).max(31),
      hour: z.number().int().min(0).max(23),
      minute: z.number().int().min(0).max(59),
      second: z.number().int().min(0).max(59),
      timezone: z.string().min(1, 'Timezone is required')
    }).optional(),
    location: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180)
    }).optional()
  })
});

const calculateBirthChartSchema = z.object({
  body: z.object({
    datetime: z.object({
      year: z.number().int(),
      month: z.number().int().min(1).max(12),
      day: z.number().int().min(1).max(31),
      hour: z.number().int().min(0).max(23),
      minute: z.number().int().min(0).max(59),
      second: z.number().int().min(0).max(59),
      timezone: z.string().min(1, 'Timezone is required')
    }),
    location: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180)
    }),
    houseSystem: z.enum(Object.values(HOUSE_SYSTEMS) as [string, ...string[]]).optional()
  })
});

// Protected routes
router.use(authenticate);

// Normalize and sanitize birth chart input
const normalizeBirthChartInput = (req: any, res: any, next: any) => {
  if (req.body.datetime?.timezone) {
    req.body.datetime.timezone = req.body.datetime.timezone.trim();
  }
  if (req.body.location?.name) {
    req.body.location.name = Sanitizer.sanitizeString(req.body.location.name);
  }
  next();
};

// Create a new birth chart
router.post(
  '/users/:userId/birth-charts',
  normalizeBirthChartInput,
  validateRequest(createBirthChartSchema),
  birthChartController.createBirthChart
);

// Get birth chart by ID
router.get(
  '/birth-charts/:birthChartId',
  validateRequest(birthChartIdSchema),
  birthChartController.getBirthChartById
);

// Update birth chart
router.put(
  '/birth-charts/:birthChartId',
  normalizeBirthChartInput,
  validateRequest(updateBirthChartSchema),
  birthChartController.updateBirthChart
);

// Delete birth chart
router.delete(
  '/birth-charts/:birthChartId',
  validateRequest(birthChartIdSchema),
  birthChartController.deleteBirthChart
);

// Get all birth charts for a user
router.get(
  '/users/:userId/birth-charts',
  validateRequest(userIdSchema),
  birthChartController.getBirthChartsByUserId
);

// Calculate birth chart without saving
router.post(
  '/birth-charts/calculate',
  normalizeBirthChartInput,
  validateRequest(calculateBirthChartSchema),
  birthChartController.calculateBirthChart
);

export default router; 