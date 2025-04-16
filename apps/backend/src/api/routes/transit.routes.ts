import { Router } from 'express';
import { TransitController } from '../controllers/TransitController';
import { TransitService } from '../../application/services/TransitService';
import { EphemerisService } from '../../application/services/EphemerisService';
import { ICache } from '../../infrastructure/cache/ICache';
import { createAuthMiddleware } from '../../shared/middleware/auth';
import { validateRequest } from '../../shared/middleware/validateRequest';
import { z } from 'zod';
import { config } from '../../shared/config';
import { EphemerisClient } from '../../infrastructure/clients/EphemerisClient';
import { BirthChartService } from '../../application/services/BirthChartService';

export const createTransitRoutes = (cache: ICache) => {
  const router = Router();
  const ephemerisClient = new EphemerisClient(config.ephemerisApiUrl, config.ephemerisApiKey);
  const ephemerisService = new EphemerisService(ephemerisClient, cache);
  const birthChartService = new BirthChartService(cache, ephemerisService);
  const transitService = new TransitService(ephemerisClient, cache, birthChartService);
  const transitController = new TransitController(transitService, birthChartService);

  router.get('/:birthChartId', createAuthMiddleware(cache), transitController.analyzeTransits);
  router.get('/:birthChartId/current', createAuthMiddleware(cache), transitController.getTransitsByDateRange);
  router.get('/:birthChartId/upcoming', createAuthMiddleware(cache), transitController.calculateTransits);

  return router;
}; 