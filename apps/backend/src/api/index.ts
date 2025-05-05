import { Router, Application, Request, Response } from 'express';
import authRoutes from '../core/auth/routes/auth.routes';
import userRoutes from '../core/user/routes/user.routes';
import birthChartRoutes from '../core/birthchart/routes/birthChart.routes';
import insightRoutes from '../core/insight/routes/insight.routes';
import lifeThemeRoutes from '../core/life-theme/routes/lifeTheme.routes';
import { createTransitRoutes } from '../core/transit/routes/transit.routes';
import { initializeInfrastructure } from '../bootstrap/index';
import { ICache } from '../infrastructure/cache/ICache';

const router = Router();
let cacheClient: ICache;

// API version prefix
const API_PREFIX = '/api/v1';

export const initializeRouter = async (): Promise<Router> => {
  const { cacheClient: cache } = await initializeInfrastructure();
  cacheClient = cache;

  // Mount routes
  router.use(`${API_PREFIX}/auth`, authRoutes);
  router.use(`${API_PREFIX}/users`, userRoutes);
  router.use(`${API_PREFIX}/birth-charts`, birthChartRoutes);
  router.use(`${API_PREFIX}/insights`, insightRoutes);
  router.use(`${API_PREFIX}/life-themes`, lifeThemeRoutes);
  router.use(`${API_PREFIX}/transits`, createTransitRoutes(cacheClient));

  return router;
};

// Health check endpoint
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      auth: { status: 'ok' },
      users: { status: 'ok' },
      birthCharts: { status: 'ok' },
      insights: { status: 'ok' },
      lifeThemes: { status: 'ok' },
      transits: { status: 'ok' }
    }
  });
});

export const setupRoutes = async (app: Application): Promise<void> => {
  const initializedRouter = await initializeRouter();
  app.use(initializedRouter);
};

export default router; 