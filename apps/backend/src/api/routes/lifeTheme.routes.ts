import { Router } from 'express';
import { LifeThemeController } from '../controllers/LifeThemeController';
import { LifeThemeService } from '../../application/services/LifeThemeService';
import { EphemerisService } from '../../application/services/EphemerisService';
import { AIService } from '../../application/services/AIService';
import { ICache } from '../../infrastructure/cache/ICache';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../../shared/middleware/validateRequest';
import { z } from 'zod';
import { Sanitizer } from '../../shared/sanitization';
import { PromptBuilder } from '@/utils/PromptBuilder';
import { LLMClient } from '@/infrastructure/ai/LLMClient';
import { BirthChartService } from '@/application/services/BirthChartService';
import { EphemerisClient } from '@/infrastructure/clients/EphemerisClient';
import { config } from '../../shared/config';

export const createLifeThemeRoutes = (cache: ICache) => {
  const router = Router();
  const ephemerisClient = new EphemerisClient(config.ephemerisApiUrl, config.ephemerisApiKey);
  const ephemerisService = new EphemerisService(ephemerisClient, cache);
  const birthChartService = new BirthChartService(cache, ephemerisService);
  const llmClient = new LLMClient(config.openaiApiKey);
  const aiService = new AIService(llmClient, PromptBuilder, cache);
  const lifeThemeService = new LifeThemeService(cache, birthChartService, aiService);
  const lifeThemeController = new LifeThemeController(lifeThemeService);

  router.get('/:birthChartId', lifeThemeController.analyzeLifeThemes);
  router.get('/:birthChartId/:themeId', lifeThemeController.getLifeThemesByUserId);

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

  // Normalize and sanitize life theme input
  const normalizeLifeThemeInput = (req: any, res: any, next: any) => {
    if (req.body.coreIdentity) {
      req.body.coreIdentity.description = Sanitizer.sanitizeString(req.body.coreIdentity.description);
    }
    if (req.body.strengths) {
      req.body.strengths = req.body.strengths.map((strength: any) => ({
        ...strength,
        description: Sanitizer.sanitizeString(strength.description),
        area: Sanitizer.sanitizeString(strength.area)
      }));
    }
    if (req.body.challenges) {
      req.body.challenges = req.body.challenges.map((challenge: any) => ({
        ...challenge,
        description: Sanitizer.sanitizeString(challenge.description),
        area: Sanitizer.sanitizeString(challenge.area)
      }));
    }
    if (req.body.patterns) {
      req.body.patterns = req.body.patterns.map((pattern: any) => ({
        ...pattern,
        description: Sanitizer.sanitizeString(pattern.description)
      }));
    }
    if (req.body.lifeThemes) {
      req.body.lifeThemes = req.body.lifeThemes.map((theme: any) => ({
        ...theme,
        description: Sanitizer.sanitizeString(theme.description),
        manifestation: Sanitizer.sanitizeString(theme.manifestation)
      }));
    }
    next();
  };

  // Update life themes for a birth chart
  router.put(
    '/birth-charts/:birthChartId/life-themes',
    authenticate,
    normalizeLifeThemeInput,
    validateRequest(updateLifeThemesSchema),
    lifeThemeController.updateLifeThemes
  );

  return router;
};

export default createLifeThemeRoutes; 