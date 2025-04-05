import express from 'express';
import request from 'supertest';
import { Types } from 'mongoose';
import { UserService } from '../../services/UserService';
import { NotFoundError, AuthError } from '../../types/errors';
import { UserController } from '../../controllers/UserController';
import { errorHandler } from '../../shared/middleware/errorHandler';
import { validateRequest } from '../../shared/middleware/validateRequest';
import { z } from 'zod';

// Mock services
jest.mock('../../services/UserService');

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

describe('User Routes', () => {
  let app: express.Application;
  let mockUserService: jest.Mocked<UserService>;
  let userController: UserController;

  const mockUser = {
    _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
    isEmailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    mockUserService = new UserService({} as any, {} as any) as jest.Mocked<UserService>;
    userController = new UserController(mockUserService);

    // Setup mock implementations
    mockUserService.createUser.mockResolvedValue(mockUser as any);
    mockUserService.getUserById.mockResolvedValue(mockUser as any);
    mockUserService.getUserByEmail.mockResolvedValue(mockUser as any);
    mockUserService.updateUser.mockResolvedValue(mockUser as any);
    mockUserService.deleteUser.mockResolvedValue(true);

    // Setup Express app
    app = express();
    app.use(express.json());

    const router = express.Router();
    
    // Routes
    router.get('/health', (req, res) => {
      res.status(200).json({ status: 'ok', service: 'users' });
    });

    const createUserSchema = z.object({
      body: z.object({
        email: z.string().email(),
        password: z.string().min(8),
        firstName: z.string().min(2),
        lastName: z.string().min(2),
        role: z.enum(['user', 'admin']),
        birthDate: z.string().transform((str) => new Date(str)),
        birthLocation: z.object({
          latitude: z.number().min(-90).max(90),
          longitude: z.number().min(-180).max(180),
          placeName: z.string().min(1)
        }),
        isEmailVerified: z.boolean(),
        preferences: z.object({
          timezone: z.string(),
          houseSystem: z.enum(['placidus', 'equal']),
          aspectOrbs: z.number(),
          themePreferences: z.object({
            colorScheme: z.enum(['light', 'dark']),
            fontSize: z.enum(['small', 'medium', 'large']),
            showAspects: z.boolean(),
            showHouses: z.boolean(),
            showPlanets: z.boolean(),
            showRetrogrades: z.boolean(),
            showLunarPhases: z.boolean(),
            showEclipses: z.boolean(),
            showStations: z.boolean(),
            showHeliacal: z.boolean(),
            showCosmic: z.boolean()
          }),
          insightPreferences: z.object({
            categories: z.array(z.string()),
            severity: z.array(z.enum(['high', 'medium', 'low'])),
            types: z.array(z.string()),
            showRetrogrades: z.boolean(),
            showEclipses: z.boolean(),
            showStations: z.boolean(),
            showHeliacal: z.boolean(),
            showCosmic: z.boolean(),
            dailyInsights: z.boolean(),
            progressionInsights: z.boolean(),
            lifeThemeInsights: z.boolean(),
            birthChartInsights: z.boolean()
          }),
          notificationPreferences: z.object({
            email: z.object({
              dailyInsights: z.boolean(),
              eclipseAlerts: z.boolean(),
              retrogradeAlerts: z.boolean(),
              stationAlerts: z.boolean(),
              heliacalAlerts: z.boolean(),
              cosmicAlerts: z.boolean()
            }),
            push: z.object({
              dailyInsights: z.boolean(),
              eclipseAlerts: z.boolean(),
              retrogradeAlerts: z.boolean(),
              stationAlerts: z.boolean(),
              heliacalAlerts: z.boolean(),
              cosmicAlerts: z.boolean()
            }),
            frequency: z.enum(['daily', 'weekly', 'monthly']),
            quietHours: z.object({
              enabled: z.boolean(),
              start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
              end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
            })
          })
        })
      }),
      params: z.object({}).optional(),
      query: z.object({}).optional()
    });

    // Public routes
    router.post('/', validateRequest(createUserSchema), userController.createUser);

    // Protected routes
    router.use(require('../../shared/middleware/auth').authenticate);
    router.get('/:userId', userController.getUserById);
    router.put('/:userId', userController.updateUser);
    router.delete('/:userId', userController.deleteUser);

    app.use('/api/v1/users', router);
    app.use(errorHandler);

    jest.clearAllMocks();
  });

  describe('GET /api/v1/users/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/v1/users/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'ok',
        service: 'users'
      });
    });
  });

  describe('POST /api/v1/users', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test123!@#',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        birthDate: new Date('1990-01-01'),
        birthLocation: {
          latitude: 0,
          longitude: 0,
          placeName: 'Test Location'
        },
        isEmailVerified: false,
        preferences: {
          timezone: 'UTC',
          houseSystem: 'placidus',
          aspectOrbs: 5,
          themePreferences: {
            colorScheme: 'light',
            fontSize: 'medium',
            showAspects: true,
            showHouses: true,
            showPlanets: true,
            showRetrogrades: true,
            showLunarPhases: true,
            showEclipses: true,
            showStations: true,
            showHeliacal: true,
            showCosmic: true
          },
          insightPreferences: {
            categories: [],
            severity: ['high', 'medium', 'low'],
            types: [],
            showRetrogrades: true,
            showEclipses: true,
            showStations: true,
            showHeliacal: true,
            showCosmic: true,
            dailyInsights: true,
            progressionInsights: true,
            lifeThemeInsights: true,
            birthChartInsights: true
          },
          notificationPreferences: {
            email: {
              dailyInsights: true,
              eclipseAlerts: true,
              retrogradeAlerts: true,
              stationAlerts: true,
              heliacalAlerts: true,
              cosmicAlerts: true
            },
            push: {
              dailyInsights: true,
              eclipseAlerts: true,
              retrogradeAlerts: true,
              stationAlerts: true,
              heliacalAlerts: true,
              cosmicAlerts: true
            },
            frequency: 'daily',
            quietHours: {
              enabled: false,
              start: '22:00',
              end: '06:00'
            }
          }
        }
      };

      const response = await request(app)
        .post('/api/v1/users')
        .send(userData);

      expect(response.status).toBe(201);
      expect(mockUserService.createUser).toHaveBeenCalledWith(userData);
    });

    it('should return 400 for invalid data', async () => {
      const response = await request(app)
        .post('/api/v1/users')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/users/:userId', () => {
    it('should get user by ID successfully', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${mockUser._id}`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(mockUserService.getUserById).toHaveBeenCalledWith(mockUser._id.toString());
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${mockUser._id}`);

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent user', async () => {
      mockUserService.getUserById.mockRejectedValue(new NotFoundError('User not found'));

      const response = await request(app)
        .get(`/api/v1/users/${mockUser._id}`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/v1/users/:userId', () => {
    it('should update user successfully', async () => {
      const updates = {
        firstName: 'Updated',
        lastName: 'Name'
      };

      const response = await request(app)
        .put(`/api/v1/users/${mockUser._id}`)
        .set('Authorization', 'Bearer valid-token')
        .send(updates);

      expect(response.status).toBe(200);
      expect(mockUserService.updateUser).toHaveBeenCalledWith(mockUser._id.toString(), updates);
    });
  });

  describe('DELETE /api/v1/users/:userId', () => {
    it('should delete user successfully', async () => {
      const response = await request(app)
        .delete(`/api/v1/users/${mockUser._id}`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(mockUserService.deleteUser).toHaveBeenCalledWith(mockUser._id.toString());
    });
  });
}); 