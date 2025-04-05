import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import birthChartRoutes from './birthChart.routes';
import insightRoutes from './insight.routes';
import lifeThemeRoutes from './lifeTheme.routes';
import transitRoutes from './transit.routes';

const router = Router();

// API version prefix
const API_PREFIX = '/api/v1';

// Mount routes
router.use(`${API_PREFIX}/auth`, authRoutes);
router.use(`${API_PREFIX}/users`, userRoutes);
router.use(`${API_PREFIX}/birth-charts`, birthChartRoutes);
router.use(`${API_PREFIX}/insights`, insightRoutes);
router.use(`${API_PREFIX}/life-themes`, lifeThemeRoutes);
router.use(`${API_PREFIX}/transits`, transitRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
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

export default router; 