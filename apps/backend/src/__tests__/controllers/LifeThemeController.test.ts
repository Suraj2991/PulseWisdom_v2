import { Request, Response, NextFunction } from 'express';
import { LifeThemeController } from '../../controllers/LifeThemeController';
import { LifeThemeService } from '../../services/LifeThemeService';
import { ValidationError, NotFoundError } from '../../types/errors';
import { LifeThemeAnalysis } from '../../types/lifeTheme.types';

describe('LifeThemeController', () => {
  let controller: LifeThemeController;
  let mockService: jest.Mocked<LifeThemeService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction = jest.fn();

  const mockLifeThemeAnalysis: LifeThemeAnalysis = {
    birthChartId: 'test-birth-chart-id',
    userId: 'test-user-id',
    themes: {
      coreIdentity: {
        ascendant: 'Aries',
        sunSign: 'Leo',
        moonSign: 'Cancer',
        description: 'Test description'
      },
      strengths: [
        {
          area: 'Communication',
          description: 'Strong communication skills',
          supportingAspects: ['Mercury in Gemini']
        }
      ],
      challenges: [
        {
          area: 'Patience',
          description: 'Need to develop patience',
          growthOpportunities: ['Practice mindfulness'],
          supportingAspects: ['Mars in Aries']
        }
      ],
      patterns: [
        {
          type: 'Grand Trine',
          description: 'Harmonious pattern',
          planets: ['Sun', 'Moon', 'Jupiter'],
          houses: [1, 5, 9]
        }
      ],
      lifeThemes: [
        {
          theme: 'Self Expression',
          description: 'Strong need for self expression',
          supportingFactors: ['Sun in Leo'],
          manifestation: 'Through creative activities'
        }
      ],
      houseLords: [
        {
          house: 1,
          lord: 'Mars',
          dignity: 'Ruler',
          influence: 'Strong drive',
          aspects: ['Conjunction with Sun']
        }
      ],
      overallSummary: 'Test overall summary'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    mockService = {
      analyzeLifeThemes: jest.fn(),
      getLifeThemesByUserId: jest.fn(),
      updateLifeThemes: jest.fn()
    } as any;

    controller = new LifeThemeController(mockService);
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
  });

  describe('analyzeLifeThemes', () => {
    it('should successfully analyze life themes', async () => {
      mockRequest = {
        params: { birthChartId: 'test-birth-chart-id' }
      };
      mockService.analyzeLifeThemes.mockResolvedValue(mockLifeThemeAnalysis);

      await controller.analyzeLifeThemes(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockService.analyzeLifeThemes).toHaveBeenCalledWith('test-birth-chart-id');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockLifeThemeAnalysis);
    });

    it('should handle missing birth chart ID', async () => {
      mockRequest = {
        params: {}
      };

      await controller.analyzeLifeThemes(
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
        params: { birthChartId: 'test-birth-chart-id' }
      };
      mockService.analyzeLifeThemes.mockRejectedValue(new NotFoundError('Birth chart not found'));

      await controller.analyzeLifeThemes(
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

  describe('getLifeThemesByUserId', () => {
    it('should successfully get life themes by user ID', async () => {
      mockRequest = {
        params: { userId: 'test-user-id' }
      };
      mockService.getLifeThemesByUserId.mockResolvedValue([mockLifeThemeAnalysis]);

      await controller.getLifeThemesByUserId(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockService.getLifeThemesByUserId).toHaveBeenCalledWith('test-user-id');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith([mockLifeThemeAnalysis]);
    });

    it('should handle missing user ID', async () => {
      mockRequest = {
        params: {}
      };

      await controller.getLifeThemesByUserId(
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
        params: { userId: 'test-user-id' }
      };
      mockService.getLifeThemesByUserId.mockRejectedValue(new NotFoundError('User not found'));

      await controller.getLifeThemesByUserId(
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

  describe('updateLifeThemes', () => {
    it('should successfully update life themes', async () => {
      mockRequest = {
        params: { birthChartId: 'test-birth-chart-id' },
        body: {
          coreIdentity: {
            ascendant: 'Aries',
            sunSign: 'Leo',
            moonSign: 'Cancer',
            description: 'Updated description'
          }
        }
      };
      mockService.updateLifeThemes.mockResolvedValue(mockLifeThemeAnalysis);

      await controller.updateLifeThemes(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockService.updateLifeThemes).toHaveBeenCalledWith('test-birth-chart-id', mockRequest.body);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockLifeThemeAnalysis);
    });

    it('should handle missing birth chart ID', async () => {
      mockRequest = {
        params: {},
        body: {}
      };

      await controller.updateLifeThemes(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Birth chart ID is required'
      });
    });

    it('should handle invalid themes data', async () => {
      mockRequest = {
        params: { birthChartId: 'test-birth-chart-id' },
        body: null
      };

      await controller.updateLifeThemes(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid themes data'
      });
    });

    it('should handle invalid core identity data', async () => {
      mockRequest = {
        params: { birthChartId: 'test-birth-chart-id' },
        body: {
          coreIdentity: {
            ascendant: 'Aries',
            sunSign: 'Leo'
            // Missing moonSign and description
          }
        }
      };

      await controller.updateLifeThemes(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Core identity must include ascendant, sunSign, moonSign, and description'
      });
    });

    it('should handle invalid strengths data', async () => {
      mockRequest = {
        params: { birthChartId: 'test-birth-chart-id' },
        body: {
          strengths: [
            {
              area: 'Communication'
              // Missing description and supportingAspects
            }
          ]
        }
      };

      await controller.updateLifeThemes(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Each strength must include area, description, and supportingAspects array'
      });
    });

    it('should handle birth chart not found', async () => {
      mockRequest = {
        params: { birthChartId: 'test-birth-chart-id' },
        body: {
          coreIdentity: {
            ascendant: 'Aries',
            sunSign: 'Leo',
            moonSign: 'Cancer',
            description: 'Test description'
          }
        }
      };
      mockService.updateLifeThemes.mockRejectedValue(new NotFoundError('Birth chart not found'));

      await controller.updateLifeThemes(
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
}); 