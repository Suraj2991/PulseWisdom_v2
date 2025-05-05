import express, { Router, Request, Response, NextFunction } from 'express';
import { BirthChartController } from '../controllers/BirthChartController';
import { BirthChartService } from '../services/BirthChartService';
import { validateRequest } from '../../../shared/middleware/validateRequest';
import { birthChartValidations } from '../validator/birthChart.validator';
import { createAuthMiddleware } from '../../auth/middleware/auth';
import { RedisCache } from '../../../infrastructure/cache/RedisCache';
import { config } from '../../../shared/config';
import { DatabaseService } from '../../../infrastructure/database/database';
import { EphemerisClient } from '../../ephemeris/clients/EphemerisClient';
import { AspectService, CelestialBodyService, EphemerisErrorHandler, EphemerisService, HouseService } from '../../ephemeris';
import { ITokenVerifier } from '../../auth/ports/ITokenVerifier';
import { TokenPayload } from '../../auth/types/auth.types';
import { logger } from '../../../shared/logger';
import { RateLimiter } from '../../../shared/utils/rateLimiter';

const router = Router();

// Initialize services
const redisUrl = config.redisUrl;
const cache = new RedisCache(redisUrl);
const databaseService = DatabaseService.getInstance();
const ephemerisClient = new EphemerisClient(config.ephemerisApiUrl, config.ephemerisApiKey);
const celestialBodyService = new CelestialBodyService(cache);
const aspectService = new AspectService(cache);
const houseService = new HouseService(cache, ephemerisClient);
const errorHandler = new EphemerisErrorHandler(cache, ephemerisClient);
const ephemerisService = new EphemerisService(ephemerisClient, cache, celestialBodyService, aspectService, houseService, errorHandler);
const birthChartService = new BirthChartService(cache, ephemerisService, config.cacheTtl || 3600);
const birthChartController = new BirthChartController(birthChartService);
const rateLimiter = new RateLimiter();

// Middleware for all routes
router.use(express.json());

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'birth-charts' });
});

// Token verifier
const tokenVerifier: ITokenVerifier = {
  verifyToken: async (token: string) => {
    try {
      const decoded = await cache.get(`token:${token}`);
      if (!decoded) return null;
      
      const parsed = JSON.parse(decoded as string) as TokenPayload;
      
      if (parsed.exp && parsed.exp < Date.now() / 1000) {
        await cache.delete(`token:${token}`);
        return null;
      }
      
      return {
        userId: parsed.userId,
        role: parsed.role
      };
    } catch (error) {
      logger.error('Token verification failed', { error });
      return null;
    }
  }
};

// Protected routes
router.use(createAuthMiddleware(tokenVerifier));

// Rate limiting middleware
const rateLimitMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const clientKey = `birthChart:${req.ip}`;
  if (rateLimiter.isRateLimited(clientKey)) {
    res.status(429).json({
      status: 'error',
      message: 'Too many requests, please try again later'
    });
    return;
  }
  next();
};

// Birth chart routes
router.post(
  '/',
  rateLimitMiddleware,
  validateRequest(birthChartValidations.createBirthChart),
  birthChartController.createBirthChart
);

router.get(
  '/:birthChartId',
  rateLimitMiddleware,
  validateRequest(birthChartValidations.getBirthChartById),
  birthChartController.getBirthChartById
);

router.put(
  '/:birthChartId',
  rateLimitMiddleware,
  validateRequest(birthChartValidations.updateBirthChart),
  birthChartController.updateBirthChart
);

router.delete(
  '/:birthChartId',
  rateLimitMiddleware,
  validateRequest(birthChartValidations.deleteBirthChart),
  birthChartController.deleteBirthChart
);

router.get(
  '/user/:userId',
  rateLimitMiddleware,
  validateRequest(birthChartValidations.getBirthChartsByUserId),
  birthChartController.getBirthChartsByUserId
);

router.post(
  '/calculate',
  rateLimitMiddleware,
  validateRequest(birthChartValidations.calculateBirthChart),
  birthChartController.calculateBirthChart
);

// Error handling middleware
router.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Birth chart operation failed', { error: err });
  res.status(500).json({
    status: 'error',
    message: err.message || 'An unexpected error occurred'
  });
});

export default router; 