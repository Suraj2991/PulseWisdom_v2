import { Router } from 'express';
import { LifeThemeController } from '../controllers/LifeThemeController';
import { LifeThemeService } from '../services/LifeThemeService';
import { BirthChartService } from '../services/BirthChartService';
import { EphemerisService } from '../services/EphemerisService';
import { AIService } from '../services/AIService';
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
const aiService = new AIService();
const lifeThemeService = new LifeThemeService(cache, ephemerisService, aiService);

const lifeThemeController = new LifeThemeController(lifeThemeService);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'life-themes' });
});

// Validation schemas
const updateLifeThemesSchema = z.object({
  coreIdentity: z.object({
    ascendant: z.string(),
    sunSign: z.string(),
    moonSign: z.string(),
    description: z.string()
  }).optional(),
  strengths: z.array(z.object({
    area: z.string(),
    description: z.string(),
    supportingAspects: z.array(z.string())
  })).optional(),
  challenges: z.array(z.object({
    area: z.string(),
    description: z.string(),
    growthOpportunities: z.array(z.string())
  })).optional(),
  patterns: z.array(z.object({
    type: z.string(),
    description: z.string(),
    planets: z.array(z.string()),
    houses: z.array(z.number())
  })).optional(),
  lifeThemes: z.array(z.object({
    theme: z.string(),
    description: z.string(),
    supportingFactors: z.array(z.string()),
    manifestation: z.string()
  })).optional(),
  houseLords: z.array(z.object({
    house: z.number(),
    lord: z.string(),
    dignity: z.string(),
    influence: z.string(),
    aspects: z.array(z.string())
  })).optional()
});

const userIdSchema = z.object({
  userId: z.string().min(1, 'User ID is required')
});

// Analyze life themes for a birth chart
router.get(
  '/birth-charts/:birthChartId/life-themes',
  authenticate,
  lifeThemeController.analyzeLifeThemes
);

// Get life themes by user ID
router.get(
  '/users/:userId/life-themes',
  authenticate,
  (req, res, next) => validateRequest(userIdSchema)(req, res, next),
  lifeThemeController.getLifeThemesByUserId
);

// Update life themes for a birth chart
router.put(
  '/birth-charts/:birthChartId/life-themes',
  authenticate,
  validateRequest(updateLifeThemesSchema),
  lifeThemeController.updateLifeThemes
);

export default router; 