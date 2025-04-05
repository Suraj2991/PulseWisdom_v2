import express from 'express';
import request from 'supertest';
import { InsightService } from '../../services/InsightService';
import { InsightController } from '../../controllers/InsightController';
import { errorHandler } from '../../shared/middleware/errorHandler';
import { validateRequest } from '../../shared/middleware/validateRequest';
import { InsightCategory, InsightType, InsightSeverity } from '../../types/insight.types';
import { z } from 'zod';

// Mock services
jest.mock('../../services/InsightService');

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

describe('Insight Routes', () => {
  let app: express.Application;
  let mockInsightService: jest.Mocked<InsightService>;
  let insightController: InsightController;

  const mockBirthChartId = '507f1f77bcf86cd799439011';
  const mockUserId = '507f1f77bcf86cd799439012';
  const mockDate = new Date('2025-04-03T12:20:29.028Z');

  const mockInsight = {
    id: '1',
    type: InsightType.BIRTH_CHART,
    category: InsightCategory.PERSONALITY,
    title: 'Test Insight',
    description: 'Test Description',
    severity: 'high' as InsightSeverity,
    aspects: [],
    houses: [],
    supportingFactors: ['Strong Sun placement'],
    challenges: ['Potential ego issues'],
    recommendations: ['Practice humility'],
    date: mockDate,
    createdAt: mockDate,
    updatedAt: mockDate
  };

  const mockInsightAnalysis = {
    birthChartId: mockBirthChartId,
    userId: mockUserId,
    insights: [mockInsight],
    overallSummary: 'Test Summary',
    createdAt: mockDate,
    updatedAt: mockDate
  };

  beforeEach(() => {
    mockInsightService = new InsightService({} as any, {} as any, {} as any) as jest.Mocked<InsightService>;
    insightController = new InsightController(mockInsightService);

    // Setup mock implementations
    mockInsightService.analyzeInsights.mockResolvedValue(mockInsightAnalysis);
    mockInsightService.getInsightsByUserId.mockResolvedValue([mockInsightAnalysis]);
    mockInsightService.getInsightsByCategory.mockResolvedValue([mockInsight]);
    mockInsightService.updateInsights.mockResolvedValue(mockInsightAnalysis);
    mockInsightService.getBirthChartInsights.mockResolvedValue([mockInsight]);
    mockInsightService.getInsightsByDateRange.mockResolvedValue([mockInsight]);
    mockInsightService.getTransitInsights.mockResolvedValue([mockInsight]);
    mockInsightService.getLifeThemeInsights.mockResolvedValue([mockInsight]);

    // Setup Express app
    app = express();
    app.use(express.json());

    const router = express.Router();
    
    // Routes
    router.get('/health', (req, res) => {
      res.status(200).json({ status: 'ok', service: 'insights' });
    });

    // Validation schemas
    const birthChartIdSchema = z.object({
      params: z.object({
        birthChartId: z.string().min(1, 'Birth chart ID is required')
      })
    });

    const userIdSchema = z.object({
      params: z.object({
        userId: z.string().min(1, 'User ID is required')
      })
    });

    const categorySchema = z.object({
      params: z.object({
        birthChartId: z.string().min(1, 'Birth chart ID is required')
      }),
      query: z.object({
        category: z.string().min(1, 'Category is required')
      })
    });

    const dateRangeSchema = z.object({
      params: z.object({
        birthChartId: z.string().min(1, 'Birth chart ID is required')
      }),
      query: z.object({
        startDate: z.string().min(1, 'Start date is required'),
        endDate: z.string().min(1, 'End date is required')
      })
    });

    const updateInsightsSchema = z.object({
      body: z.object({
        overallSummary: z.string().min(1)
      })
    });

    // Protected routes
    router.use(require('../../shared/middleware/auth').authenticate);
    
    // Analyze insights
    router.get(
      '/analyze/:birthChartId',
      validateRequest(birthChartIdSchema),
      (req, res, next) => insightController.analyzeInsights(req, res, next)
    );

    // Get insights by user ID
    router.get(
      '/user/:userId',
      validateRequest(userIdSchema),
      (req, res, next) => insightController.getInsightsByUserId(req, res, next)
    );

    // Get insights by category
    router.get(
      '/category/:birthChartId',
      validateRequest(categorySchema),
      (req, res, next) => insightController.getInsightsByCategory(req, res, next)
    );

    // Update insights
    router.put(
      '/:birthChartId',
      validateRequest(updateInsightsSchema),
      (req, res, next) => insightController.updateInsights(req, res, next)
    );

    // Get birth chart insights
    router.get(
      '/birthChart/:birthChartId',
      validateRequest(birthChartIdSchema),
      (req, res, next) => insightController.getBirthChartInsights(req, res, next)
    );

    // Get insights by date range
    router.get(
      '/dateRange/:birthChartId',
      validateRequest(dateRangeSchema),
      (req, res, next) => insightController.getInsightsByDateRange(req, res, next)
    );

    // Get transit insights
    router.get(
      '/transit/:birthChartId',
      validateRequest(birthChartIdSchema),
      (req, res, next) => insightController.getTransitInsights(req, res, next)
    );

    // Get life theme insights
    router.get(
      '/lifeTheme/:birthChartId',
      validateRequest(birthChartIdSchema),
      (req, res, next) => insightController.getLifeThemeInsights(req, res, next)
    );

    app.use('/api/v1/insights', router);
    app.use(errorHandler);

    jest.clearAllMocks();
  });

  describe('GET /api/v1/insights/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/v1/insights/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'ok',
        service: 'insights'
      });
    });
  });

  describe('GET /api/v1/insights/analyze/:birthChartId', () => {
    it('should analyze insights successfully', async () => {
      const response = await request(app)
        .get(`/api/v1/insights/analyze/${mockBirthChartId}`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ...mockInsightAnalysis,
        createdAt: mockDate.toISOString(),
        updatedAt: mockDate.toISOString(),
        insights: [{
          ...mockInsight,
          date: mockDate.toISOString(),
          createdAt: mockDate.toISOString(),
          updatedAt: mockDate.toISOString()
        }]
      });
      expect(mockInsightService.analyzeInsights).toHaveBeenCalledWith(mockBirthChartId);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get(`/api/v1/insights/analyze/${mockBirthChartId}`);

      expect(response.status).toBe(401);
    });

    it('should handle service errors gracefully', async () => {
      mockInsightService.analyzeInsights.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get(`/api/v1/insights/analyze/${mockBirthChartId}`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/v1/insights/user/:userId', () => {
    it('should get insights by user ID successfully', async () => {
      const response = await request(app)
        .get(`/api/v1/insights/user/${mockUserId}`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([{
        ...mockInsightAnalysis,
        createdAt: mockDate.toISOString(),
        updatedAt: mockDate.toISOString(),
        insights: [{
          ...mockInsight,
          date: mockDate.toISOString(),
          createdAt: mockDate.toISOString(),
          updatedAt: mockDate.toISOString()
        }]
      }]);
      expect(mockInsightService.getInsightsByUserId).toHaveBeenCalledWith(mockUserId);
    });

    it('should return empty array when no insights found', async () => {
      mockInsightService.getInsightsByUserId.mockResolvedValue([]);

      const response = await request(app)
        .get(`/api/v1/insights/user/${mockUserId}`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('GET /api/v1/insights/category/:birthChartId', () => {
    it('should get insights by category successfully', async () => {
      const response = await request(app)
        .get(`/api/v1/insights/category/${mockBirthChartId}`)
        .query({ category: InsightCategory.PERSONALITY })
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([{
        ...mockInsight,
        date: mockDate.toISOString(),
        createdAt: mockDate.toISOString(),
        updatedAt: mockDate.toISOString()
      }]);
      expect(mockInsightService.getInsightsByCategory).toHaveBeenCalledWith(
        mockBirthChartId,
        InsightCategory.PERSONALITY
      );
    });

    it('should validate category parameter', async () => {
      const response = await request(app)
        .get(`/api/v1/insights/category/${mockBirthChartId}`)
        .query({ category: 'invalid-category' })
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('PUT /api/v1/insights/:birthChartId', () => {
    it('should update insights successfully', async () => {
      const updateData = {
        overallSummary: 'Updated Summary'
      };

      mockInsightService.updateInsights.mockResolvedValue({
        ...mockInsightAnalysis,
        overallSummary: 'Updated Summary'
      });

      const response = await request(app)
        .put(`/api/v1/insights/${mockBirthChartId}`)
        .set('Authorization', 'Bearer valid-token')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ...mockInsightAnalysis,
        overallSummary: 'Updated Summary',
        createdAt: mockDate.toISOString(),
        updatedAt: mockDate.toISOString(),
        insights: [{
          ...mockInsight,
          date: mockDate.toISOString(),
          createdAt: mockDate.toISOString(),
          updatedAt: mockDate.toISOString()
        }]
      });
      expect(mockInsightService.updateInsights).toHaveBeenCalledWith(mockBirthChartId, updateData);
    });

    it('should validate update data', async () => {
      const invalidData = {
        overallSummary: ''  // Empty string should fail validation
      };

      const response = await request(app)
        .put(`/api/v1/insights/${mockBirthChartId}`)
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/v1/insights/dateRange/:birthChartId', () => {
    it('should get insights by date range successfully', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';

      const response = await request(app)
        .get(`/api/v1/insights/dateRange/${mockBirthChartId}`)
        .query({ startDate, endDate })
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([{
        ...mockInsight,
        date: mockDate.toISOString(),
        createdAt: mockDate.toISOString(),
        updatedAt: mockDate.toISOString()
      }]);
      expect(mockInsightService.getInsightsByDateRange).toHaveBeenCalledWith(
        mockBirthChartId,
        new Date(startDate),
        new Date(endDate)
      );
    });

    it('should validate date range parameters', async () => {
      const response = await request(app)
        .get(`/api/v1/insights/dateRange/${mockBirthChartId}`)
        .query({ startDate: 'invalid-date', endDate: '2024-12-31' })
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/v1/insights/transit/:birthChartId', () => {
    it('should get transit insights successfully', async () => {
      const response = await request(app)
        .get(`/api/v1/insights/transit/${mockBirthChartId}`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([{
        ...mockInsight,
        date: mockDate.toISOString(),
        createdAt: mockDate.toISOString(),
        updatedAt: mockDate.toISOString()
      }]);
      expect(mockInsightService.getTransitInsights).toHaveBeenCalledWith(mockBirthChartId);
    });
  });

  describe('GET /api/v1/insights/lifeTheme/:birthChartId', () => {
    it('should get life theme insights successfully', async () => {
      const response = await request(app)
        .get(`/api/v1/insights/lifeTheme/${mockBirthChartId}`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([{
        ...mockInsight,
        date: mockDate.toISOString(),
        createdAt: mockDate.toISOString(),
        updatedAt: mockDate.toISOString()
      }]);
      expect(mockInsightService.getLifeThemeInsights).toHaveBeenCalledWith(mockBirthChartId);
    });
  });
}); 