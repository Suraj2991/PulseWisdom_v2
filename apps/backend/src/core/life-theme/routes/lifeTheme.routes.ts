import { Router, Request, Response, NextFunction } from 'express';
import { LifeThemeController } from '../controllers/LifeThemeController';
import { LifeThemeService } from '../../life-theme';
import { AspectService
  , CelestialBodyService
  , EphemerisErrorHandler
  , EphemerisService
  , HouseService } from '../../ephemeris';
import { AIService } from '../../ai';
import { ICache } from '../../../infrastructure/cache/ICache';
import { createAuthMiddleware, ITokenVerifier } from '../../auth';
import { validateRequest } from '../../../shared/middleware/validateRequest';
import { z } from 'zod';
import { Sanitizer } from '../../../shared/sanitization';
import { LLMClient } from '../../ai';
import { BirthChartService } from '../../birthchart';
import { EphemerisClient } from '../../ephemeris';
import { config } from '../../../shared/config';

// Define types for request body
interface CoreIdentity {
  ascendant: string;
  sunSign: string;
  moonSign: string;
  description: string;
}

interface Strength {
  area: string;
  description: string;
  supportingAspects: string[];
}

interface Challenge {
  area: string;
  description: string;
  growthOpportunities: string[];
}

interface Pattern {
  type: string;
  description: string;
  planets: string[];
  houses: number[];
}

interface LifeTheme {
  theme: string;
  description: string;
  supportingFactors: string[];
  manifestation: string;
}

interface HouseLord {
  house: number;
  lord: string;
  dignity: string;
  influence: string;
  aspects: string[];
}

interface LifeThemeRequestBody {
  coreIdentity?: CoreIdentity;
  strengths?: Strength[];
  challenges?: Challenge[];
  patterns?: Pattern[];
  lifeThemes?: LifeTheme[];
  houseLords?: HouseLord[];
}

export const createLifeThemeRoutes = (cache: ICache) => {
  const router = Router();
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
  const lifeThemeController = new LifeThemeController(lifeThemeService);

  // Validation schemas
  const birthChartIdSchema = z.object({
    birthChartId: z.string().min(1, 'Birth chart ID is required')
  });

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

  // Create token verifier
  const tokenVerifier: ITokenVerifier = {
    verifyToken: async (token: string) => {
      const cachedToken = await cache.get(token);
      if (!cachedToken) {
        throw new Error('Invalid token');
      }
      try {
        return JSON.parse(cachedToken.toString());
      } catch (error) {
        throw new Error('Invalid token format');
      }
    }
  };

  // Remove the duplicate routes and consolidate with proper validation
  router.get('/:birthChartId', validateRequest(birthChartIdSchema), lifeThemeController.analyzeLifeThemes);
  router.get('/:birthChartId/:themeId', validateRequest(birthChartIdSchema), lifeThemeController.getLifeThemesByUserId);

  // Health check endpoint
  router.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'life-themes' });
  });

  // Analyze life themes for a birth chart
  router.get(
    '/birth-charts/:birthChartId/life-themes',
    createAuthMiddleware(tokenVerifier),
    validateRequest(birthChartIdSchema),
    lifeThemeController.analyzeLifeThemes
  );

  // Get life themes by user ID
  router.get(
    '/users/:userId/life-themes',
    createAuthMiddleware(tokenVerifier),
    validateRequest(userIdSchema),
    lifeThemeController.getLifeThemesByUserId
  );

  // Normalize and sanitize life theme input
  const normalizeLifeThemeInput = (req: Request<Record<string, never>, unknown, LifeThemeRequestBody>, res: Response, next: NextFunction) => {
    if (req.body.coreIdentity) {
      req.body.coreIdentity.description = Sanitizer.sanitizeString(req.body.coreIdentity.description);
    }
    if (req.body.strengths) {
      req.body.strengths = req.body.strengths.map(strength => ({
        ...strength,
        description: Sanitizer.sanitizeString(strength.description),
        area: Sanitizer.sanitizeString(strength.area)
      }));
    }
    if (req.body.challenges) {
      req.body.challenges = req.body.challenges.map(challenge => ({
        ...challenge,
        description: Sanitizer.sanitizeString(challenge.description),
        area: Sanitizer.sanitizeString(challenge.area)
      }));
    }
    if (req.body.patterns) {
      req.body.patterns = req.body.patterns.map(pattern => ({
        ...pattern,
        description: Sanitizer.sanitizeString(pattern.description)
      }));
    }
    if (req.body.lifeThemes) {
      req.body.lifeThemes = req.body.lifeThemes.map(theme => ({
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
    createAuthMiddleware(tokenVerifier),
    normalizeLifeThemeInput,
    validateRequest(updateLifeThemesSchema),
    lifeThemeController.updateLifeThemes
  );

  return router;
};

export default createLifeThemeRoutes; 