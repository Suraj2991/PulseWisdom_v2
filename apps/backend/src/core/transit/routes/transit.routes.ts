import { Router, Request, Response, NextFunction } from 'express';
import { TransitController, TransitService } from '../../transit';
import { BirthChartService } from '../../birthchart';
import { ICache } from '../../../infrastructure/cache/ICache';
import { createAuthMiddleware, ITokenVerifier } from '../../auth';
import { config } from '../../../shared/config';
import { EphemerisClient, EphemerisErrorHandler, EphemerisService, HouseService, AspectService, CelestialBodyService } from '../../ephemeris';
import { logger } from '../../../shared/logger';

export const createTransitRoutes = (cache: ICache): Router => {
  const router = Router();
  const ephemerisClient = new EphemerisClient(config.ephemerisApiUrl, config.ephemerisApiKey);
  const celestialBodyService = new CelestialBodyService(cache);
  const aspectService = new AspectService(cache);
  const houseService = new HouseService(cache, ephemerisClient);
  const errorHandler = new EphemerisErrorHandler(cache, ephemerisClient);

  const ephemerisService = new EphemerisService(
    ephemerisClient,
    cache,
    celestialBodyService,
    aspectService,
    houseService,
    errorHandler
  );

  const birthChartService = new BirthChartService(cache, ephemerisService);

  const transitService = new TransitService(
    ephemerisClient,
    cache,
    birthChartService,
    celestialBodyService,
    aspectService,
    houseService,
    errorHandler
  );

  const transitController = new TransitController(transitService, birthChartService);

  // Create token verifier
  const tokenVerifier: ITokenVerifier = {
    verifyToken: async (token: string) => {
      try {
        const decoded = await cache.get(`token:${token}`);
        if (!decoded) return null;
        return JSON.parse(decoded as string);
      } catch (error) {
        logger.error('Token verification failed', { error });
        return null;
      }
    }
  };

  // Health check endpoint
  router.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', service: 'transits' });
  });

  // Get transits by birth chart ID
  router.get(
    '/:birthChartId',
    createAuthMiddleware(tokenVerifier),
    (req: Request, res: Response, next: NextFunction) => {
      transitController.getTransitsByChartId(req, res, next);
    }
  );

  // Error handling middleware
  router.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error('Transit route error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  });

  return router;
};