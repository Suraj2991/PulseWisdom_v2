import express from 'express';
import request from 'supertest';
import { TransitService } from '../../services/TransitService';
import { BirthChartService } from '../../services/BirthChartService';
import { TransitController } from '../../controllers/TransitController';
import { errorHandler } from '../../shared/middleware/errorHandler';
import { validateRequest } from '../../shared/middleware/validateRequest';
import { z } from 'zod';

// Mock services
jest.mock('../../services/TransitService');
jest.mock('../../services/BirthChartService');

// Mock middleware
jest.mock('../../shared/middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    if (req.headers.authorization === 'Bearer valid-token') {
      req.user = { 
        id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        role: 'user'
      };
      next();
    } else {
      res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }
  }
}));

describe('Transit Routes', () => {
  let app: express.Application;
  let mockTransitService: jest.Mocked<TransitService>;
  let mockBirthChartService: jest.Mocked<BirthChartService>;
  let transitController: TransitController;

  const mockBirthChartId = '507f1f77bcf86cd799439011';
  const mockTransitAnalysis = {
    birthChartId: mockBirthChartId,
    date: {
      year: 2024,
      month: 1,
      day: 1,
      hour: 0,
      minute: 0,
      second: 0,
      timezone: 'UTC'
    },
    transits: [],
    windows: [],
    summary: 'Test transit analysis'
  };

  beforeEach(() => {
    mockTransitService = new TransitService({} as any, {} as any) as jest.Mocked<TransitService>;
    mockBirthChartService = new BirthChartService({} as any, {} as any) as jest.Mocked<BirthChartService>;
    transitController = new TransitController(mockTransitService, mockBirthChartService);

    // Setup mock implementations
    mockTransitService.analyzeTransits.mockResolvedValue(mockTransitAnalysis);
    mockTransitService.getTransitsByDateRange.mockResolvedValue([mockTransitAnalysis]);
    mockTransitService.calculateTransits.mockResolvedValue(mockTransitAnalysis);
    mockBirthChartService.getBirthChartById.mockResolvedValue({} as any);

    // Setup Express app
    app = express();
    app.use(express.json());

    const router = express.Router();
    
    // Routes
    router.get('/health', (req, res) => {
      res.status(200).json({ status: 'ok', service: 'transits' });
    });

    // Validation schemas
    const analyzeTransitsSchema = z.object({
      query: z.object({
        year: z.string().transform(Number).refine(val => !isNaN(val), 'Year must be a number'),
        month: z.string().transform(Number).refine(val => !isNaN(val) && val >= 1 && val <= 12, 'Month must be between 1 and 12'),
        day: z.string().transform(Number).refine(val => !isNaN(val) && val >= 1 && val <= 31, 'Day must be between 1 and 31'),
        hour: z.string().transform(Number).refine(val => !isNaN(val) && val >= 0 && val <= 23, 'Hour must be between 0 and 23').optional(),
        minute: z.string().transform(Number).refine(val => !isNaN(val) && val >= 0 && val <= 59, 'Minute must be between 0 and 59').optional(),
        second: z.string().transform(Number).refine(val => !isNaN(val) && val >= 0 && val <= 59, 'Second must be between 0 and 59').optional(),
        timezone: z.string().optional()
      })
    });

    const getTransitsByDateRangeSchema = z.object({
      query: z.object({
        startDate: z.string(),
        endDate: z.string()
      })
    });

    const calculateTransitsSchema = z.object({
      body: z.object({
        date: z.object({
          year: z.number(),
          month: z.number().min(1).max(12),
          day: z.number().min(1).max(31),
          hour: z.number().min(0).max(23).optional(),
          minute: z.number().min(0).max(59).optional(),
          second: z.number().min(0).max(59).optional(),
          timezone: z.string().optional()
        })
      })
    });

    // Protected routes
    router.use(require('../../shared/middleware/auth').authenticate);
    
    // Analyze transits
    router.get(
      '/birth-charts/:birthChartId/transits',
      validateRequest(analyzeTransitsSchema),
      (req, res, next) => transitController.analyzeTransits(req, res, next)
    );

    // Get transits by date range
    router.get(
      '/birth-charts/:birthChartId/transits/range',
      validateRequest(getTransitsByDateRangeSchema),
      (req, res, next) => transitController.getTransitsByDateRange(req, res, next)
    );

    // Calculate transits
    router.post(
      '/birth-charts/:birthChartId/transits/calculate',
      validateRequest(calculateTransitsSchema),
      (req, res, next) => transitController.calculateTransits(req, res, next)
    );

    app.use('/api/v1/transits', router);
    app.use(errorHandler);

    jest.clearAllMocks();
  });

  describe('GET /api/v1/transits/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/v1/transits/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'ok',
        service: 'transits'
      });
    });
  });

  describe('GET /api/v1/transits/birth-charts/:birthChartId/transits', () => {
    it('should analyze transits successfully', async () => {
      const response = await request(app)
        .get(`/api/v1/transits/birth-charts/${mockBirthChartId}/transits`)
        .query({
          year: '2024',
          month: '1',
          day: '1',
          hour: '0',
          minute: '0',
          second: '0',
          timezone: 'UTC'
        })
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockTransitAnalysis);
      expect(mockTransitService.analyzeTransits).toHaveBeenCalledWith(
        mockBirthChartId,
        {
          year: 2024,
          month: 1,
          day: 1,
          hour: 0,
          minute: 0,
          second: 0,
          timezone: 'UTC'
        }
      );
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get(`/api/v1/transits/birth-charts/${mockBirthChartId}/transits`)
        .query({
          year: '2024',
          month: '1',
          day: '1'
        });

      expect(response.status).toBe(401);
    });

    it('should return 400 for invalid date parameters', async () => {
      const response = await request(app)
        .get(`/api/v1/transits/birth-charts/${mockBirthChartId}/transits`)
        .query({
          year: 'invalid',
          month: '13',
          day: '32'
        })
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/transits/birth-charts/:birthChartId/transits/range', () => {
    it('should get transits by date range successfully', async () => {
      const response = await request(app)
        .get(`/api/v1/transits/birth-charts/${mockBirthChartId}/transits/range`)
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-02'
        })
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([mockTransitAnalysis]);
      expect(mockTransitService.getTransitsByDateRange).toHaveBeenCalled();
    });
  });

  describe('POST /api/v1/transits/birth-charts/:birthChartId/transits/calculate', () => {
    it('should calculate transits successfully', async () => {
      const response = await request(app)
        .post(`/api/v1/transits/birth-charts/${mockBirthChartId}/transits/calculate`)
        .send({
          date: {
            year: 2024,
            month: 1,
            day: 1,
            hour: 0,
            minute: 0,
            second: 0,
            timezone: 'UTC'
          }
        })
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockTransitAnalysis);
      expect(mockTransitService.calculateTransits).toHaveBeenCalled();
    });
  });
}); 