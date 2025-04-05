import request from 'supertest';
import express from 'express';
import mainRouter from '../../routes';
import { authenticate } from '../../shared/middleware/auth';

jest.mock('../../shared/middleware/auth', () => ({
  authenticate: jest.fn((req, res, next) => next())
}));

describe('Main Router', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(mainRouter);
  });

  describe('Health Check', () => {
    it('should return 200 and health status', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Route Mounting', () => {
    it('should mount auth routes at /api/v1/auth', async () => {
      const response = await request(app)
        .get('/api/v1/auth/health');

      expect(response.status).toBe(200);
    });

    it('should mount user routes at /api/v1/users', async () => {
      const response = await request(app)
        .get('/api/v1/users/health');

      expect(response.status).toBe(200);
    });

    it('should mount birth chart routes at /api/v1/birth-charts', async () => {
      const response = await request(app)
        .get('/api/v1/birth-charts/health');

      expect(response.status).toBe(200);
    });

    it('should mount insight routes at /api/v1/insights', async () => {
      const response = await request(app)
        .get('/api/v1/insights/health');

      expect(response.status).toBe(200);
    });

    it('should mount life theme routes at /api/v1/life-themes', async () => {
      const response = await request(app)
        .get('/api/v1/life-themes/health');

      expect(response.status).toBe(200);
    });

    it('should mount transit routes at /api/v1/transits', async () => {
      const response = await request(app)
        .get('/api/v1/transits/health');

      expect(response.status).toBe(200);
    });
  });

  describe('Authentication Middleware', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should apply authentication middleware to protected routes', async () => {
      await request(app)
        .get('/api/v1/users/profile');

      expect(authenticate).toHaveBeenCalled();
    });

    it('should not apply authentication middleware to public routes', async () => {
      await request(app)
        .get('/health');

      expect(authenticate).not.toHaveBeenCalled();
    });
  });
}); 