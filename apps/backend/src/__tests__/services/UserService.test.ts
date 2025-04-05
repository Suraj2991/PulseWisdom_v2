import { Types, Document } from 'mongoose';
import { UserService } from '../../services/UserService';
import { User, IUser } from '../../models/User';
import { ValidationError } from '../../types/errors';
import { ICache } from '../../infrastructure/cache/ICache';
import { BirthChartService } from '../../services/BirthChartService';
import { IBirthChart } from '../../models/BirthChart';

jest.mock('../../models/User');
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn().mockResolvedValue(true)
}));

describe('UserService', () => {
  let userService: UserService;
  let mockCache: jest.Mocked<ICache>;
  let mockBirthChartService: jest.Mocked<BirthChartService>;

  const mockUser = {
    _id: new Types.ObjectId(),
    email: 'test@example.com',
    password: 'hashedPassword',
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
    birthDate: new Date('1990-01-01'),
    birthTime: '12:00',
    birthLocation: {
      latitude: 40.7128,
      longitude: -74.0060,
      placeName: 'New York'
    },
    preferences: {
      timezone: 'UTC',
      houseSystem: 'placidus' as const,
      aspectOrbs: 8,
      themePreferences: {
        colorScheme: 'light' as const,
        fontSize: 'medium' as const,
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
        categories: ['personality'],
        severity: ['high'],
        types: ['PLANETARY_POSITION'],
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
        frequency: 'daily' as const,
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '07:00'
        }
      }
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    $assertPopulated: jest.fn(),
    $clearModifiedPaths: jest.fn(),
    $clone: jest.fn(),
    $getAllSubdocs: jest.fn(),
    $ignore: jest.fn(),
    $isDefault: jest.fn(),
    $isDeleted: jest.fn(),
    $isEmpty: jest.fn(),
    $isValid: jest.fn(),
    $locals: {},
    $markValid: jest.fn(),
    $model: jest.fn(),
    $op: null,
    $session: jest.fn(),
    $set: jest.fn(),
    $where: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    increment: jest.fn(),
    init: jest.fn(),
    invalidate: jest.fn(),
    isDirectModifiedPaths: jest.fn(),
    isDirectSelectedPaths: jest.fn(),
    isInit: jest.fn(),
    isModified: jest.fn(),
    isNew: jest.fn(),
    isSelected: jest.fn(),
    markModified: jest.fn(),
    modelName: 'User',
    overwrite: jest.fn(),
    populate: jest.fn(),
    populated: jest.fn(),
    remove: jest.fn(),
    save: jest.fn(),
    schema: {} as any,
    toJSON: jest.fn(),
    toObject: jest.fn(),
    unmarkModified: jest.fn(),
    update: jest.fn(),
    validate: jest.fn(),
    validateSync: jest.fn()
  } as unknown as IUser & { _id: Types.ObjectId };

  beforeEach(() => {
    jest.clearAllMocks();

    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      keys: jest.fn(),
      clear: jest.fn(),
      exists: jest.fn(),
      getPlanetaryPositions: jest.fn(),
      setPlanetaryPositions: jest.fn(),
      getTransitData: jest.fn(),
      setTransitData: jest.fn(),
      getBirthChart: jest.fn(),
      setBirthChart: jest.fn(),
      deleteBirthChart: jest.fn(),
      getAspectData: jest.fn(),
      setAspectData: jest.fn(),
      getInsight: jest.fn(),
      setInsight: jest.fn(),
      deleteInsight: jest.fn(),
      clearCache: jest.fn(),
      disconnect: jest.fn()
    } as unknown as jest.Mocked<ICache>;

    mockBirthChartService = {
      getBirthChartById: jest.fn(),
      getBirthChartsByUserId: jest.fn(),
      calculateBirthChart: jest.fn(),
      createBirthChart: jest.fn(),
      updateBirthChart: jest.fn(),
      deleteBirthChart: jest.fn(),
      cache: mockCache,
      ephemerisService: {} as any,
      validateLocation: jest.fn(),
      validateDateTime: jest.fn(),
      validateObjectId: jest.fn()
    } as unknown as jest.Mocked<BirthChartService>;

    userService = new UserService(mockCache, mockBirthChartService);
  });

  describe('Core CRUD Operations', () => {
    describe('createUser', () => {
      const validUserData = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
        role: 'user' as const,
        birthDate: new Date('1990-01-01'),
        birthTime: '12:00',
        birthLocation: {
          latitude: 40.7128,
          longitude: -74.0060,
          placeName: 'New York'
        }
      } as unknown as Omit<IUser, '_id' | 'createdAt' | 'updatedAt'>;

      it('should create user successfully', async () => {
        (User.create as jest.Mock).mockResolvedValue({
          ...mockUser,
          save: jest.fn().mockResolvedValue(mockUser)
        });
        const result = await userService.createUser(validUserData);
        expect(result).toBeDefined();
        expect(mockCache.set).toHaveBeenCalled();
      });

      it('should validate email format', async () => {
        await expect(userService.createUser({ ...validUserData, email: 'invalid' } as unknown as Omit<IUser, '_id' | 'createdAt' | 'updatedAt'>))
          .rejects
          .toThrow('Invalid email format');
      });

      it('should prevent duplicate emails', async () => {
        (User.findOne as jest.Mock).mockResolvedValue(mockUser);
        await expect(userService.createUser(validUserData))
          .rejects
          .toThrow('Email already exists');
      });
    });

    describe('getUserById', () => {
      it('should return cached user if available', async () => {
        mockCache.get.mockResolvedValue(mockUser);
        const result = await userService.getUserById(mockUser._id.toString());
        expect(result).toEqual(mockUser);
        expect(User.findById).not.toHaveBeenCalled();
      });

      it('should fetch from database if not in cache', async () => {
        mockCache.get.mockResolvedValue(null);
        (User.findById as jest.Mock).mockResolvedValue(mockUser);
        const result = await userService.getUserById(mockUser._id.toString());
        expect(result).toEqual(mockUser);
        expect(mockCache.set).toHaveBeenCalled();
      });
    });

    describe('updateUser', () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name'
      };

      it('should update user successfully', async () => {
        (User.findByIdAndUpdate as jest.Mock).mockResolvedValue({ ...mockUser, ...updateData });
        const result = await userService.updateUser(mockUser._id.toString(), updateData);
        expect(result.firstName).toBe(updateData.firstName);
        expect(mockCache.set).toHaveBeenCalled();
      });

      it('should validate email uniqueness on update', async () => {
        (User.findOne as jest.Mock).mockResolvedValue({ ...mockUser, _id: new Types.ObjectId() });
        await expect(userService.updateUser(mockUser._id.toString(), { email: 'existing@example.com' }))
          .rejects
          .toThrow('Email already in use');
      });
    });

    describe('deleteUser', () => {
      it('should delete user and clear cache', async () => {
        (User.findByIdAndDelete as jest.Mock).mockResolvedValue(mockUser);
        const result = await userService.deleteUser(mockUser._id.toString());
        expect(result).toBe(true);
        expect(mockCache.delete).toHaveBeenCalled();
      });
    });
  });
});