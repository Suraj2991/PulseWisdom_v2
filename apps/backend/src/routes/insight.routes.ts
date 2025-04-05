import express from 'express';
import { InsightController } from '../controllers/InsightController';
import { InsightService } from '../services/InsightService';
import { authenticate } from '../shared/middleware/auth';
import { RedisCache } from '../infrastructure/cache/RedisCache';
import { BirthChartService } from '../services/BirthChartService';
import { LifeThemeService } from '../services/LifeThemeService';
import { TransitService } from '../services/TransitService';
import { EphemerisService } from '../services/EphemerisService';
import { AIService } from '../services/AIService';
import { validateRequest } from '../shared/middleware/validateRequest';
import { z } from 'zod';

const router = express.Router();
const cache = new RedisCache('redis://localhost:6379');
const ephemerisService = new EphemerisService(cache, 'http://localhost:3000');
const birthChartService = new BirthChartService(cache, ephemerisService);
const aiService = new AIService();
const lifeThemeService = new LifeThemeService(cache, ephemerisService, aiService);
const transitService = new TransitService(cache, ephemerisService);
const insightService = new InsightService(cache, ephemerisService, lifeThemeService);
const insightController = new InsightController(insightService);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'insights' });
});

// Validation schemas
const birthChartIdSchema = z.object({
  params: z.object({
    birthChartId: z.string().min(1, 'Birth chart ID is required')
  })
});

const userIdSchema = z.object({
  params: z.object({
    userId: z.string().min(1, 'User ID is required')
  })
});

const categorySchema = z.object({
  params: z.object({
    birthChartId: z.string().min(1, 'Birth chart ID is required')
  }),
  query: z.object({
    category: z.string().min(1, 'Category is required')
  })
});

const dateRangeSchema = z.object({
  params: z.object({
    birthChartId: z.string().min(1, 'Birth chart ID is required')
  }),
  query: z.object({
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required')
  })
});

const updateInsightsSchema = z.object({
  params: z.object({
    birthChartId: z.string().min(1, 'Birth chart ID is required')
  }),
  body: z.object({
    insights: z.array(z.object({
      id: z.string().optional(),
      type: z.string(),
      category: z.string(),
      severity: z.string(),
      title: z.string(),
      description: z.string(),
      recommendations: z.array(z.string()).optional()
    })).optional(),
    overallSummary: z.string().optional()
  })
});

// Analyze insights for a birth chart
router.get(
  '/analyze/:birthChartId',
  authenticate,
  validateRequest(birthChartIdSchema),
  insightController.analyzeInsights
);

// Get insights by user ID
router.get(
  '/user/:userId',
  authenticate,
  validateRequest(userIdSchema),
  insightController.getInsightsByUserId
);

// Get insights by category
router.get(
  '/category/:birthChartId',
  authenticate,
  validateRequest(categorySchema),
  insightController.getInsightsByCategory
);

// Update insights
router.put(
  '/:birthChartId',
  authenticate,
  validateRequest(updateInsightsSchema),
  insightController.updateInsights
);

// Get birth chart insights
router.get(
  '/birthChart/:birthChartId',
  authenticate,
  validateRequest(birthChartIdSchema),
  insightController.getBirthChartInsights
);

// Get insights by date range
router.get(
  '/dateRange/:birthChartId',
  authenticate,
  validateRequest(dateRangeSchema),
  insightController.getInsightsByDateRange
);

// Get transit insights
router.get(
  '/transit/:birthChartId',
  authenticate,
  validateRequest(birthChartIdSchema),
  insightController.getTransitInsights
);

// Get life theme insights
router.get(
  '/lifeTheme/:birthChartId',
  authenticate,
  validateRequest(birthChartIdSchema),
  insightController.getLifeThemeInsights
);

export default router; 