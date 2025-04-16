import express from 'express';
import { InsightController } from '../controllers/InsightController';
import { InsightService } from '../../application/services/InsightService';
import { RedisCache } from '../../infrastructure/cache/RedisCache';
import { BirthChartService } from '../../application/services/BirthChartService';
import { LifeThemeService } from '../../application/services/LifeThemeService';
import { TransitService } from '../../application/services/TransitService';
import { EphemerisService } from '../../application/services/EphemerisService';
import { AIService } from '../../application/services/AIService';
import { validateRequest } from '../../shared/middleware/validateRequest';
import { z } from 'zod';
import { Router } from 'express';
import { InsightGenerator } from '../../application/services/insight/InsightGenerator';
import { InsightRepository } from '../../application/services/insight/InsightRepository';
import { InsightAnalyzer } from '../../application/services/insight/InsightAnalyzer';
import { ICache } from '../../infrastructure/cache/ICache';
import { Sanitizer } from '../../shared/sanitization';
import { EphemerisClient } from '../../infrastructure/clients/EphemerisClient';
import { LLMClient } from '../../infrastructure/ai/LLMClient';
import { PromptBuilder } from '../../utils/PromptBuilder';
import { authenticate } from '../middleware/auth';
import { config } from '../../shared/config';

const router = express.Router();
const cache = new RedisCache('redis://localhost:6379');
const ephemerisClient = new EphemerisClient(config.ephemerisApiUrl, config.ephemerisApiKey);
const ephemerisService = new EphemerisService(ephemerisClient, cache);
const birthChartService = new BirthChartService(cache, ephemerisService);
const llmClient = new LLMClient(config.openaiApiKey);
const aiService = new AIService(llmClient, PromptBuilder, cache);
const lifeThemeService = new LifeThemeService(cache, birthChartService, aiService);
const transitService = new TransitService(ephemerisClient, cache, birthChartService);
const insightGenerator = new InsightGenerator(aiService);
const insightRepository = new InsightRepository(cache);
const insightAnalyzer = new InsightAnalyzer(lifeThemeService, transitService);

const insightService = new InsightService(
  cache,
  ephemerisService,
  lifeThemeService,
  birthChartService,
  transitService,
  aiService,
  insightGenerator,
  insightRepository,
  insightAnalyzer
);

const insightController = new InsightController(insightService);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'insights' });
});

// Normalize and sanitize insight input
const normalizeInsightInput = (req: any, res: any, next: any) => {
  if (req.body.insights) {
    req.body.insights = req.body.insights.map((insight: any) => ({
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
router.get('/:birthChartId', authenticate, validateRequest(birthChartIdSchema), insightController.analyzeInsights);
router.get('/:birthChartId/user/:userId', authenticate, validateRequest(userIdSchema), insightController.getInsightsByUserId);
router.get('/:birthChartId/:insightId', authenticate, validateRequest(birthChartIdSchema), insightController.getInsightsByCategory);

export default router; 