import express from 'express';
import request from 'supertest';
import { LifeThemeService } from '../../services/LifeThemeService';
import { BirthChartService } from '../../services/BirthChartService';
import { LifeThemeController } from '../../controllers/LifeThemeController';
import { errorHandler } from '../../shared/middleware/errorHandler';
import { validateRequest } from '../../shared/middleware/validateRequest';
import { z } from 'zod';

// Mock services
jest.mock('../../services/LifeThemeService');
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

describe('Life Theme Routes', () => {
  let app: express.Application;
  let mockLifeThemeService: jest.Mocked<LifeThemeService>;
  let mockBirthChartService: jest.Mocked<BirthChartService>;
  let lifeThemeController: LifeThemeController;

  const mockBirthChartId = '507f1f77bcf86cd799439011';
  const mockUserId = '507f1f77bcf86cd799439012';
  const mockLifeThemes = {
    birthChartId: mockBirthChartId,
    userId: mockUserId,
    themes: {
      coreIdentity: {
        ascendant: 'Aries',
        sunSign: 'Leo',
        moonSign: 'Cancer',
        description: 'Test description'
      },
      strengths: [],
      challenges: [],
      patterns: [],
      lifeThemes: [],
      houseLords: [],
      overallSummary: 'Test overall summary'
    },
    createdAt: '2025-04-03T12:20:29.028Z',
    updatedAt: '2025-04-03T12:20:29.028Z'
  };

  beforeEach(() => {
    mockLifeThemeService = new LifeThemeService({} as any, {} as any, {} as any) as jest.Mocked<LifeThemeService>;
    mockBirthChartService = new BirthChartService({} as any, {} as any) as jest.Mocked<BirthChartService>;
    lifeThemeController = new LifeThemeController(mockLifeThemeService);

    // Setup mock implementations
    mockLifeThemeService.analyzeLifeThemes.mockResolvedValue({
      ...mockLifeThemes,
      createdAt: new Date(mockLifeThemes.createdAt),
      updatedAt: new Date(mockLifeThemes.updatedAt)
    });
    mockLifeThemeService.getLifeThemesByUserId.mockResolvedValue([{
      ...mockLifeThemes,
      createdAt: new Date(mockLifeThemes.createdAt),
      updatedAt: new Date(mockLifeThemes.updatedAt)
    }]);
    mockLifeThemeService.updateLifeThemes.mockResolvedValue({
      ...mockLifeThemes,
      createdAt: new Date(mockLifeThemes.createdAt),
      updatedAt: new Date(mockLifeThemes.updatedAt)
    });
    mockBirthChartService.getBirthChartById.mockResolvedValue({} as any);

    // Setup Express app
    app = express();
    app.use(express.json());

    const router = express.Router();
    
    // Routes
    router.get('/health', (req, res) => {
      res.status(200).json({ status: 'ok', service: 'life-themes' });
    });

    // Validation schemas
    const updateLifeThemesSchema = z.object({
      coreIdentity: z.object({
        ascendant: z.string(),
        sunSign: z.string(),
        moonSign: z.string(),
        description: z.string()
      }).optional(),
      strengths: z.array(z.object({
        area: z.string(),
        description: z.string(),
        supportingAspects: z.array(z.string())
      })).optional(),
      challenges: z.array(z.object({
        area: z.string(),
        description: z.string(),
        growthOpportunities: z.array(z.string())
      })).optional(),
      patterns: z.array(z.object({
        type: z.string(),
        description: z.string(),
        planets: z.array(z.string()),
        houses: z.array(z.number())
      })).optional(),
      lifeThemes: z.array(z.object({
        theme: z.string(),
        description: z.string(),
        supportingFactors: z.array(z.string()),
        manifestation: z.string()
      })).optional(),
      houseLords: z.array(z.object({
        house: z.number(),
        lord: z.string(),
        dignity: z.string(),
        influence: z.string(),
        aspects: z.array(z.string())
      })).optional()
    });

    const userIdSchema = z.object({
      params: z.object({
        userId: z.string().min(1, 'User ID is required')
      })
    });

    // Protected routes
    router.use(require('../../shared/middleware/auth').authenticate);
    
    // Analyze life themes
    router.get(
      '/birth-charts/:birthChartId/life-themes',
      (req, res, next) => lifeThemeController.analyzeLifeThemes(req, res, next)
    );

    // Get life themes by user ID
    router.get(
      '/users/:userId/life-themes',
      validateRequest(userIdSchema),
      (req, res, next) => lifeThemeController.getLifeThemesByUserId(req, res, next)
    );

    // Update life themes
    router.put(
      '/birth-charts/:birthChartId/life-themes',
      validateRequest(updateLifeThemesSchema),
      (req, res, next) => lifeThemeController.updateLifeThemes(req, res, next)
    );

    app.use('/api/v1/life-themes', router);
    app.use(errorHandler);

    jest.clearAllMocks();
  });

  describe('GET /api/v1/life-themes/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/v1/life-themes/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'ok',
        service: 'life-themes'
      });
    });
  });

  describe('GET /api/v1/life-themes/birth-charts/:birthChartId/life-themes', () => {
    it('should analyze life themes successfully', async () => {
      const response = await request(app)
        .get(`/api/v1/life-themes/birth-charts/${mockBirthChartId}/life-themes`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockLifeThemes);
      expect(mockLifeThemeService.analyzeLifeThemes).toHaveBeenCalledWith(mockBirthChartId);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get(`/api/v1/life-themes/birth-charts/${mockBirthChartId}/life-themes`);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/life-themes/users/:userId/life-themes', () => {
    it('should get life themes by user ID successfully', async () => {
      const response = await request(app)
        .get(`/api/v1/life-themes/users/${mockUserId}/life-themes`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([mockLifeThemes]);
      expect(mockLifeThemeService.getLifeThemesByUserId).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('PUT /api/v1/life-themes/birth-charts/:birthChartId/life-themes', () => {
    it('should update life themes successfully', async () => {
      const updateData = {
        coreIdentity: {
          ascendant: 'Aries',
          sunSign: 'Leo',
          moonSign: 'Cancer',
          description: 'Updated description'
        }
      };

      const response = await request(app)
        .put(`/api/v1/life-themes/birth-charts/${mockBirthChartId}/life-themes`)
        .set('Authorization', 'Bearer valid-token')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockLifeThemes);
      expect(mockLifeThemeService.updateLifeThemes).toHaveBeenCalledWith(mockBirthChartId, updateData);
    });
  });
}); 