import express from 'express';
import request from 'supertest';
import { Types } from 'mongoose';
import { BirthChartService } from '../../services/BirthChartService';
import { BirthChartController } from '../../controllers/BirthChartController';
import { errorHandler } from '../../shared/middleware/errorHandler';
import { validateRequest } from '../../shared/middleware/validateRequest';
import { z } from 'zod';
import { HouseSystem } from '../../types/ephemeris.types';

// Mock services
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

describe('Birth Chart Routes', () => {
  let app: express.Application;
  let mockBirthChartService: jest.Mocked<BirthChartService>;
  let birthChartController: BirthChartController;

  const mockBirthChart = {
    _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
    userId: '507f1f77bcf86cd799439012',
    datetime: {
      year: 1990,
      month: 1,
      day: 1,
      hour: 12,
      minute: 0,
      second: 0,
      timezone: 'UTC'
    },
    location: {
      latitude: 40.7128,
      longitude: -74.0060
    },
    houseSystem: HouseSystem.PLACIDUS,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    mockBirthChartService = new BirthChartService({} as any, {} as any) as jest.Mocked<BirthChartService>;
    birthChartController = new BirthChartController(mockBirthChartService);

    // Setup mock implementations
    mockBirthChartService.createBirthChart.mockResolvedValue(mockBirthChart as any);
    mockBirthChartService.getBirthChartById.mockResolvedValue(mockBirthChart as any);
    mockBirthChartService.getBirthChartsByUserId.mockResolvedValue([mockBirthChart] as any);
    mockBirthChartService.updateBirthChart.mockResolvedValue(mockBirthChart as any);
    mockBirthChartService.deleteBirthChart.mockResolvedValue(true);
    mockBirthChartService.calculateBirthChart.mockResolvedValue(mockBirthChart as any);

    // Setup Express app
    app = express();
    app.use(express.json());

    const router = express.Router();
    
    // Routes
    router.get('/health', (req, res) => {
      res.status(200).json({ status: 'ok', service: 'birth-charts' });
    });

    // Validation schemas
    const userIdSchema = z.object({
      params: z.object({
        userId: z.string().min(1, 'User ID is required')
      })
    });

    const birthChartIdSchema = z.object({
      params: z.object({
        birthChartId: z.string().min(1, 'Birth chart ID is required')
      })
    });

    const createBirthChartSchema = z.object({
      params: z.object({
        userId: z.string().min(1, 'User ID is required')
      }),
      body: z.object({
        datetime: z.object({
          year: z.number().int(),
          month: z.number().int().min(1).max(12),
          day: z.number().int().min(1).max(31),
          hour: z.number().int().min(0).max(23),
          minute: z.number().int().min(0).max(59),
          second: z.number().int().min(0).max(59),
          timezone: z.string().min(1, 'Timezone is required')
        }),
        location: z.object({
          latitude: z.number().min(-90).max(90),
          longitude: z.number().min(-180).max(180)
        })
      })
    });

    const calculateBirthChartSchema = z.object({
      body: z.object({
        datetime: z.object({
          year: z.number().int(),
          month: z.number().int().min(1).max(12),
          day: z.number().int().min(1).max(31),
          hour: z.number().int().min(0).max(23),
          minute: z.number().int().min(0).max(59),
          second: z.number().int().min(0).max(59),
          timezone: z.string().min(1, 'Timezone is required')
        }),
        location: z.object({
          latitude: z.number().min(-90).max(90),
          longitude: z.number().min(-180).max(180)
        }),
        houseSystem: z.nativeEnum(HouseSystem).optional()
      })
    });

    // Protected routes
    router.use(require('../../shared/middleware/auth').authenticate);
    
    // Create birth chart
    router.post(
      '/users/:userId/birth-charts',
      validateRequest(createBirthChartSchema),
      (req, res, next) => birthChartController.createBirthChart(req, res, next)
    );

    // Get birth chart by ID
    router.get(
      '/birth-charts/:birthChartId',
      validateRequest(birthChartIdSchema),
      (req, res, next) => birthChartController.getBirthChartById(req, res, next)
    );

    // Get birth charts by user ID
    router.get(
      '/users/:userId/birth-charts',
      validateRequest(userIdSchema),
      (req, res, next) => birthChartController.getBirthChartsByUserId(req, res, next)
    );

    // Calculate birth chart
    router.post(
      '/birth-charts/calculate',
      validateRequest(calculateBirthChartSchema),
      (req, res, next) => birthChartController.calculateBirthChart(req, res, next)
    );

    app.use('/api/v1/birth-charts', router);
    app.use(errorHandler);

    jest.clearAllMocks();
  });

  describe('GET /api/v1/birth-charts/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/v1/birth-charts/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'ok',
        service: 'birth-charts'
      });
    });
  });

  describe('POST /api/v1/birth-charts/users/:userId/birth-charts', () => {
    it('should create a new birth chart successfully', async () => {
      const birthChartData = {
        datetime: {
          year: 1990,
          month: 1,
          day: 1,
          hour: 12,
          minute: 0,
          second: 0,
          timezone: 'UTC'
        },
        location: {
          latitude: 40.7128,
          longitude: -74.0060
        }
      };

      const response = await request(app)
        .post(`/api/v1/birth-charts/users/${mockBirthChart.userId}/birth-charts`)
        .set('Authorization', 'Bearer valid-token')
        .send(birthChartData);

      expect(response.status).toBe(201);
      expect(mockBirthChartService.createBirthChart).toHaveBeenCalledWith(
        mockBirthChart.userId,
        birthChartData.datetime,
        birthChartData.location
      );
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post(`/api/v1/birth-charts/users/${mockBirthChart.userId}/birth-charts`)
        .send({});

      expect(response.status).toBe(401);
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        datetime: {
          year: 1990,
          month: 13, // Invalid month
          day: 1,
          hour: 12,
          minute: 0,
          second: 0,
          timezone: 'UTC'
        },
        location: {
          latitude: 40.7128,
          longitude: -74.0060
        }
      };

      const response = await request(app)
        .post(`/api/v1/birth-charts/users/${mockBirthChart.userId}/birth-charts`)
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/birth-charts/birth-charts/:birthChartId', () => {
    it('should get birth chart by ID successfully', async () => {
      const response = await request(app)
        .get(`/api/v1/birth-charts/birth-charts/${mockBirthChart._id}`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(mockBirthChartService.getBirthChartById).toHaveBeenCalledWith(mockBirthChart._id.toString());
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get(`/api/v1/birth-charts/birth-charts/${mockBirthChart._id}`);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/birth-charts/users/:userId/birth-charts', () => {
    it('should get birth charts by user ID successfully', async () => {
      const response = await request(app)
        .get(`/api/v1/birth-charts/users/${mockBirthChart.userId}/birth-charts`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(mockBirthChartService.getBirthChartsByUserId).toHaveBeenCalledWith(mockBirthChart.userId);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get(`/api/v1/birth-charts/users/${mockBirthChart.userId}/birth-charts`);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/birth-charts/birth-charts/calculate', () => {
    it('should calculate birth chart successfully', async () => {
      const calculationData = {
        datetime: {
          year: 1990,
          month: 1,
          day: 1,
          hour: 12,
          minute: 0,
          second: 0,
          timezone: 'UTC'
        },
        location: {
          latitude: 40.7128,
          longitude: -74.0060
        },
        houseSystem: HouseSystem.PLACIDUS
      };

      const response = await request(app)
        .post('/api/v1/birth-charts/birth-charts/calculate')
        .set('Authorization', 'Bearer valid-token')
        .send(calculationData);

      expect(response.status).toBe(200);
      expect(mockBirthChartService.calculateBirthChart).toHaveBeenCalledWith(
        calculationData.datetime,
        calculationData.location,
        calculationData.houseSystem
      );
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/birth-charts/birth-charts/calculate')
        .send({});

      expect(response.status).toBe(401);
    });
  });
}); 