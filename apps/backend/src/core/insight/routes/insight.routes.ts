import express from 'express';
import { RedisCache } from '../../../infrastructure/cache/RedisCache';
import { BirthChartService } from '../../birthchart';
import { LifeThemeService } from '../../life-theme';
import { TransitService } from '../../transit';
import { EphemerisService, EphemerisClient, CelestialBodyService, AspectService, HouseService, EphemerisErrorHandler } from '../../ephemeris';
import { AIService, LLMClient } from '../../ai';
import { validateRequest } from '../../../shared/middleware/validateRequest';
import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

import { InsightAnalyzer
  , InsightRepository
  , InsightGenerator
  , InsightController
  , InsightService } from '../../insight';
import { Sanitizer } from '../../../shared/sanitization';
import { createAuthMiddleware, ITokenVerifier } from '../../auth';
import { config } from '../../../shared/config';

const router = express.Router();
const cache = new RedisCache('redis://localhost:6379');
const ephemerisClient = new EphemerisClient(config.ephemerisApiUrl, config.ephemerisApiKey);
const celestialBodyService = new CelestialBodyService(cache);
const aspectService = new AspectService(cache);
const houseService = new HouseService(cache, ephemerisClient);
const errorHandler = new EphemerisErrorHandler(cache, ephemerisClient);
const ephemerisService = new EphemerisService(ephemerisClient, cache, celestialBodyService, aspectService, houseService, errorHandler);
const birthChartService = new BirthChartService(cache, ephemerisService);
const llmClient = new LLMClient(cache, config.openaiApiKey);
const aiService = new AIService(llmClient, cache);
const lifeThemeService = new LifeThemeService(cache, birthChartService, aiService, celestialBodyService, aspectService);
const transitService = new TransitService(ephemerisClient, cache, birthChartService, celestialBodyService, aspectService, houseService, errorHandler);
const insightRepository = new InsightRepository(cache);
const insightGenerator = new InsightGenerator(cache, aiService);
const insightAnalyzer = new InsightAnalyzer(cache, lifeThemeService, transitService, llmClient);

const insightService = new InsightService(
  cache,
  ephemerisService,
  lifeThemeService,
  birthChartService,
  transitService,
  aiService,
  insightGenerator,
  insightAnalyzer,
  insightRepository,
  new InsightRepository(cache)
);

const insightController = new InsightController(insightService);

const tokenVerifier: ITokenVerifier = {
  verifyToken: async (token: string) => {
    const decoded = await cache.get(`token:${token}`);
    if (!decoded) return null;
    return JSON.parse(decoded as string);
  }
};

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'insights' });
});

// Normalize and sanitize insight input
interface InsightInput {
  title?: string;
  description?: string;
  recommendations?: string[];
  type?: string;
  category?: string;
  severity?: string;
  id?: string;
}

const normalizeInsightInput = (req: Request, res: Response, next: NextFunction) => {
  if (req.body.insights) {
    req.body.insights = req.body.insights.map((insight: InsightInput) => ({
      ...insight,
      title: insight.title ? Sanitizer.sanitizeString(insight.title) : insight.title,
      description: insight.description ? Sanitizer.sanitizeInsightContent(insight.description) : insight.description,
      recommendations: insight.recommendations?.map((rec: string) => Sanitizer.sanitizeString(rec))
    }));
  }
  if (req.body.overallSummary) {
    req.body.overallSummary = Sanitizer.sanitizeInsightContent(req.body.overallSummary);
  }
  next();
};

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

// Routes
router.get('/:birthChartId', createAuthMiddleware(tokenVerifier), validateRequest(birthChartIdSchema), insightController.analyzeInsights);
router.get('/:birthChartId/user/:userId', createAuthMiddleware(tokenVerifier), validateRequest(userIdSchema), insightController.getInsightsByUserId);
router.get('/:birthChartId/:insightId', createAuthMiddleware(tokenVerifier), validateRequest(birthChartIdSchema), insightController.getInsightsByCategory);

// Add routes with proper validation
router.get('/:birthChartId/category',
  createAuthMiddleware(tokenVerifier),
  validateRequest(categorySchema),
  insightController.getInsightsByCategory
);

router.get('/:birthChartId/date-range',
  createAuthMiddleware(tokenVerifier),
  validateRequest(dateRangeSchema),
  insightController.getInsightsByDateRange
);

router.put('/:birthChartId',
  createAuthMiddleware(tokenVerifier),
  validateRequest(updateInsightsSchema),
  normalizeInsightInput,
  insightController.updateInsights
);

export default router; 