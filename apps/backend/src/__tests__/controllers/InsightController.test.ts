import { Request, Response, NextFunction } from 'express';
import { InsightController } from '../../controllers/InsightController';
import { InsightService } from '../../services/InsightService';
import { Types } from 'mongoose';
import { ValidationError, NotFoundError } from '../../types/errors';
import { InsightCategory, InsightType, InsightAnalysis, Insight } from '../../types/insight.types';

jest.mock('../../services/InsightService');

describe('InsightController', () => {
  let controller: InsightController;
  let mockService: jest.Mocked<InsightService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction = jest.fn();

  const mockBirthChartId = new Types.ObjectId().toString();
  const mockUserId = new Types.ObjectId().toString();

  const mockAspect = {
    body1Id: 0,
    body2Id: 1,
    type: 'conjunction',
    angle: 0,
    orb: 2,
    isApplying: true
  };

  const mockHouse = {
    number: 1,
    cusp: 0,
    nextCusp: 30,
    size: 30,
    rulerId: 0
  };

  const mockInsight: Insight = {
    id: '1',
    type: InsightType.BIRTH_CHART,
    category: InsightCategory.PERSONALITY,
    title: 'Test Insight',
    description: 'Test Description',
    severity: 'high',
    aspects: [mockAspect],
    houses: [mockHouse],
    supportingFactors: ['Strong Sun placement'],
    challenges: ['Potential ego issues'],
    recommendations: ['Practice humility'],
    date: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockInsightAnalysis: InsightAnalysis = {
    birthChartId: mockBirthChartId,
    userId: mockUserId,
    insights: [mockInsight],
    overallSummary: 'Test Summary',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    mockService = {
      analyzeInsights: jest.fn(),
      getInsightsByUserId: jest.fn(),
      getInsightsByCategory: jest.fn(),
      updateInsights: jest.fn(),
      getBirthChartInsights: jest.fn(),
      getInsightsByDateRange: jest.fn(),
      getTransitInsights: jest.fn(),
      getLifeThemeInsights: jest.fn()
    } as any;

    controller = new InsightController(mockService);
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
  });

  describe('analyzeInsights', () => {
    it('should successfully analyze insights', async () => {
      mockRequest = {
        params: { birthChartId: mockBirthChartId }
      };
      mockService.analyzeInsights.mockResolvedValue(mockInsightAnalysis);

      await controller.analyzeInsights(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockService.analyzeInsights).toHaveBeenCalledWith(mockBirthChartId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockInsightAnalysis);
    });

    it('should handle missing birth chart ID', async () => {
      mockRequest = {
        params: {}
      };

      await controller.analyzeInsights(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Birth chart ID is required'
      });
    });

    it('should handle birth chart not found', async () => {
      mockRequest = {
        params: { birthChartId: mockBirthChartId }
      };
      mockService.analyzeInsights.mockRejectedValue(new NotFoundError('Birth chart not found'));

      await controller.analyzeInsights(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Birth chart not found'
      });
    });
  });

  describe('getInsightsByUserId', () => {
    it('should successfully get insights by user ID', async () => {
      mockRequest = {
        params: { userId: mockUserId }
      };
      mockService.getInsightsByUserId.mockResolvedValue([mockInsightAnalysis]);

      await controller.getInsightsByUserId(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockService.getInsightsByUserId).toHaveBeenCalledWith(mockUserId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith([mockInsightAnalysis]);
    });

    it('should handle missing user ID', async () => {
      mockRequest = {
        params: {}
      };

      await controller.getInsightsByUserId(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'User ID is required'
      });
    });

    it('should handle user not found', async () => {
      mockRequest = {
        params: { userId: mockUserId }
      };
      mockService.getInsightsByUserId.mockRejectedValue(new NotFoundError('User not found'));

      await controller.getInsightsByUserId(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'User not found'
      });
    });
  });

  describe('getInsightsByCategory', () => {
    it('should successfully get insights by category', async () => {
      mockRequest = {
        params: { birthChartId: mockBirthChartId },
        query: { category: InsightCategory.PERSONALITY }
      };
      mockService.getInsightsByCategory.mockResolvedValue(mockInsightAnalysis.insights);

      await controller.getInsightsByCategory(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockService.getInsightsByCategory).toHaveBeenCalledWith(
        mockBirthChartId,
        InsightCategory.PERSONALITY
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockInsightAnalysis.insights);
    });

    it('should handle missing birth chart ID', async () => {
      mockRequest = {
        params: {},
        query: { category: InsightCategory.PERSONALITY }
      };

      await controller.getInsightsByCategory(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Birth chart ID is required'
      });
    });

    it('should handle missing category', async () => {
      mockRequest = {
        params: { birthChartId: mockBirthChartId },
        query: {}
      };

      await controller.getInsightsByCategory(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Category is required'
      });
    });

    it('should handle invalid category', async () => {
      mockRequest = {
        params: { birthChartId: mockBirthChartId },
        query: { category: 'INVALID_CATEGORY' }
      };

      await controller.getInsightsByCategory(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid category'
      });
    });
  });

  describe('updateInsights', () => {
    it('should successfully update insights', async () => {
      mockRequest = {
        params: { birthChartId: mockBirthChartId },
        body: {
          insights: [mockInsightAnalysis.insights[0]],
          overallSummary: 'Updated summary'
        }
      };
      mockService.updateInsights.mockResolvedValue(mockInsightAnalysis);

      await controller.updateInsights(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockService.updateInsights).toHaveBeenCalledWith(
        mockBirthChartId,
        mockRequest.body
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockInsightAnalysis);
    });

    it('should handle missing birth chart ID', async () => {
      mockRequest = {
        params: {},
        body: {}
      };

      await controller.updateInsights(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Birth chart ID is required'
      });
    });

    it('should handle invalid update data', async () => {
      mockRequest = {
        params: { birthChartId: mockBirthChartId },
        body: null
      };

      await controller.updateInsights(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid update data'
      });
    });

    it('should handle invalid insight data structure', async () => {
      mockRequest = {
        params: { birthChartId: mockBirthChartId },
        body: {
          insights: [{
            id: 'test-insight-id'
            // Missing required fields
          }]
        }
      };

      await controller.updateInsights(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid insight data structure'
      });
    });
  });

  describe('getBirthChartInsights', () => {
    it('should successfully get birth chart insights', async () => {
      mockRequest = {
        params: { birthChartId: mockBirthChartId }
      };
      mockService.getBirthChartInsights.mockResolvedValue(mockInsightAnalysis.insights);

      await controller.getBirthChartInsights(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockService.getBirthChartInsights).toHaveBeenCalledWith(mockBirthChartId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockInsightAnalysis.insights);
    });

    it('should handle missing birth chart ID', async () => {
      mockRequest = {
        params: {}
      };

      await controller.getBirthChartInsights(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Birth chart ID is required'
      });
    });
  });

  describe('getInsightsByDateRange', () => {
    it('should successfully get insights by date range', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';

      mockRequest = {
        params: { birthChartId: mockBirthChartId },
        query: { startDate, endDate }
      };
      mockService.getInsightsByDateRange.mockResolvedValue(mockInsightAnalysis.insights);

      await controller.getInsightsByDateRange(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockService.getInsightsByDateRange).toHaveBeenCalledWith(
        mockBirthChartId,
        new Date(startDate),
        new Date(endDate)
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockInsightAnalysis.insights);
    });

    it('should handle missing birth chart ID', async () => {
      mockRequest = {
        params: {},
        query: {
          startDate: '2024-01-01',
          endDate: '2024-12-31'
        }
      };

      await controller.getInsightsByDateRange(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Birth chart ID is required'
      });
    });

    it('should handle missing date parameters', async () => {
      mockRequest = {
        params: { birthChartId: mockBirthChartId },
        query: {}
      };

      await controller.getInsightsByDateRange(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Start and end dates are required'
      });
    });

    it('should handle invalid date format', async () => {
      mockRequest = {
        params: { birthChartId: mockBirthChartId },
        query: {
          startDate: 'invalid-date',
          endDate: '2024-12-31'
        }
      };

      await controller.getInsightsByDateRange(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid date format'
      });
    });

    it('should handle end date before start date', async () => {
      mockRequest = {
        params: { birthChartId: mockBirthChartId },
        query: {
          startDate: '2024-12-31',
          endDate: '2024-01-01'
        }
      };

      await controller.getInsightsByDateRange(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'End date must be after start date'
      });
    });
  });

  describe('getTransitInsights', () => {
    it('should successfully get transit insights', async () => {
      mockRequest = {
        params: { birthChartId: mockBirthChartId }
      };
      mockService.getTransitInsights.mockResolvedValue(mockInsightAnalysis.insights);

      await controller.getTransitInsights(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockService.getTransitInsights).toHaveBeenCalledWith(mockBirthChartId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockInsightAnalysis.insights);
    });

    it('should handle missing birth chart ID', async () => {
      mockRequest = {
        params: {}
      };

      await controller.getTransitInsights(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Birth chart ID is required'
      });
    });
  });

  describe('getLifeThemeInsights', () => {
    it('should successfully get life theme insights', async () => {
      mockRequest = {
        params: { birthChartId: mockBirthChartId }
      };
      mockService.getLifeThemeInsights.mockResolvedValue(mockInsightAnalysis.insights);

      await controller.getLifeThemeInsights(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockService.getLifeThemeInsights).toHaveBeenCalledWith(mockBirthChartId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockInsightAnalysis.insights);
    });

    it('should handle missing birth chart ID', async () => {
      mockRequest = {
        params: {}
      };

      await controller.getLifeThemeInsights(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Birth chart ID is required'
      });
    });
  });
}); 