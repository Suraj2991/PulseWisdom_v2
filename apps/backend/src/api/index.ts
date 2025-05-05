import { Router, Application, Request, Response } from 'express';
import authRoutes from '../core/auth/routes/auth.routes';
import userRoutes from '../core/user/routes/user.routes';
import birthChartRoutes from '../core/birthchart/routes/birthChart.routes';
import insightRoutes from '../core/insight/routes/insight.routes';
import lifeThemeRoutes from '../core/life-theme/routes/lifeTheme.routes';
import { createTransitRoutes } from '../core/transit/routes/transit.routes';
import { initializeInfrastructure } from '../bootstrap/infrastructure';

const { cacheClient } = initializeInfrastructure();
const router = Router();

// API version prefix
const API_PREFIX = '/api/v1';

// Mount routes
router.use(`${API_PREFIX}/auth`, authRoutes);
router.use(`${API_PREFIX}/users`, userRoutes);
router.use(`${API_PREFIX}/birth-charts`, birthChartRoutes);
router.use(`${API_PREFIX}/insights`, insightRoutes);
router.use(`${API_PREFIX}/life-themes`, lifeThemeRoutes);
router.use(`${API_PREFIX}/transits`, createTransitRoutes(cacheClient));

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

export const setupRoutes = (app: Application): void => {
  app.use(router);
};

export default router; 