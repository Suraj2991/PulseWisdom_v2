import { Router } from 'express';
import { TransitController } from '../controllers/TransitController';
import { TransitService } from '../services/TransitService';
import { BirthChartService } from '../services/BirthChartService';
import { EphemerisService } from '../services/EphemerisService';
import { RedisCache } from '../infrastructure/cache/RedisCache';
import { authenticate } from '../shared/middleware/auth';
import { validateRequest } from '../shared/middleware/validateRequest';
import { z } from 'zod';

const router = Router();

// Initialize services
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const cache = new RedisCache(redisUrl);
const ephemerisService = new EphemerisService(cache, process.env.EPHEMERIS_SERVICE_URL || 'http://localhost:3000');
const birthChartService = new BirthChartService(cache, ephemerisService);
const transitService = new TransitService(cache, ephemerisService);

// Initialize controller
const transitController = new TransitController(transitService, birthChartService);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'transits' });
});

// Validation schemas
const calculateTransitsSchema = z.object({
  date: z.object({
    year: z.number(),
    month: z.number().min(1).max(12),
    day: z.number().min(1).max(31),
    hour: z.number().min(0).max(23).optional(),
    minute: z.number().min(0).max(59).optional(),
    second: z.number().min(0).max(59).optional(),
    timezone: z.string().optional()
  })
});

const analyzeTransitsSchema = z.object({
  year: z.string().transform(Number).refine(val => !isNaN(val), 'Year must be a number'),
  month: z.string().transform(Number).refine(val => !isNaN(val) && val >= 1 && val <= 12, 'Month must be between 1 and 12'),
  day: z.string().transform(Number).refine(val => !isNaN(val) && val >= 1 && val <= 31, 'Day must be between 1 and 31'),
  hour: z.string().transform(Number).refine(val => !isNaN(val) && val >= 0 && val <= 23, 'Hour must be between 0 and 23').optional(),
  minute: z.string().transform(Number).refine(val => !isNaN(val) && val >= 0 && val <= 59, 'Minute must be between 0 and 59').optional(),
  second: z.string().transform(Number).refine(val => !isNaN(val) && val >= 0 && val <= 59, 'Second must be between 0 and 59').optional(),
  timezone: z.string().optional()
});

const getTransitsByDateRangeSchema = z.object({
  startDate: z.string(),
  endDate: z.string()
});

// Analyze transits for a birth chart at a specific date
router.get(
  '/birth-charts/:birthChartId/transits',
  authenticate,
  (req, res, next) => validateRequest(analyzeTransitsSchema)(req, res, next),
  transitController.analyzeTransits
);

// Get transits for a date range
router.get(
  '/birth-charts/:birthChartId/transits/range',
  authenticate,
  (req, res, next) => validateRequest(getTransitsByDateRangeSchema)(req, res, next),
  transitController.getTransitsByDateRange
);

// Calculate transits without saving
router.post(
  '/birth-charts/:birthChartId/transits/calculate',
  authenticate,
  validateRequest(calculateTransitsSchema),
  transitController.calculateTransits
);

export default router; 