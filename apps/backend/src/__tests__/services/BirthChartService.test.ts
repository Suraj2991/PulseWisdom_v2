import { BirthChartService } from '../../services/BirthChartService';
import { DateTime, GeoPosition, HouseSystem, BirthChart } from '../../types/ephemeris.types';
import { Types } from 'mongoose';
import { RedisCache } from '../../infrastructure/cache/RedisCache';
import { IBirthChart } from '../../models/BirthChart';
import { NotFoundError, ValidationError } from '../../types/errors';
import { EphemerisService } from '../../services/EphemerisService';
import { ICache } from '../../infrastructure/cache/ICache';
import { BirthChartModel } from '../../models/BirthChart';

// Type for test mocks
type MockCelestialBody = {
  id: number;
  name: string;
  longitude: number;
  latitude: number;
  speed: number;
  house: number;
  sign: string;
  signLongitude: number;
};

jest.mock('../../models/BirthChart');
jest.mock('../../services/EphemerisService');
jest.mock('../../infrastructure/cache/RedisCache', () => ({
  RedisCache: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn()
  }))
}));

describe('BirthChartService', () => {
  let service: BirthChartService;
  let mockCache: jest.Mocked<ICache>;
  let mockEphemerisService: jest.Mocked<EphemerisService>;

  const validDateTime: DateTime = {
    year: 2024,
    month: 3,
    day: 15,
    hour: 12,
    minute: 0,
    second: 0,
    timezone: 'UTC'
  };

  const validLocation: GeoPosition = {
    latitude: 40.7128,  // New York City
    longitude: -74.0060
  };

  const mockBirthChartId = new Types.ObjectId();
  const mockUserId = new Types.ObjectId();

  const mockBirthChart = {
    _id: mockBirthChartId,
    userId: mockUserId.toString(),
    datetime: validDateTime,
    location: validLocation,
    houseSystem: HouseSystem.PLACIDUS,
    bodies: [],
    angles: {
      ascendant: 0,
      mc: 0,
      ic: 180,
      descendant: 180
    },
    houses: {
      cusps: Array(12).fill(0),
      system: HouseSystem.PLACIDUS
    },
    aspects: [],
    createdAt: new Date(),
    updatedAt: new Date()
  } as unknown as IBirthChart;

  const mockCalculatedBirthChart = {
    datetime: validDateTime,
    location: validLocation,
    bodies: [],
    angles: {
      ascendant: 0,
      midheaven: 0,
      descendant: 180,
      imumCoeli: 180
    },
    houses: {
      system: HouseSystem.PLACIDUS,
      cusps: Array(12).fill(0)
    },
    aspects: []
  } as unknown as BirthChart;

  beforeEach(() => {
    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn()
    } as unknown as jest.Mocked<ICache>;

    mockEphemerisService = {
      getBirthChartById: jest.fn(),
      getBirthChartsByUserId: jest.fn(),
      calculateBirthChart: jest.fn().mockResolvedValue(mockCalculatedBirthChart),
      analyzeTransits: jest.fn(),
      calculateTransits: jest.fn(),
      calculatePlanetaryPositions: jest.fn(),
      healthCheck: jest.fn()
    } as unknown as jest.Mocked<EphemerisService>;

    service = new BirthChartService(mockCache, mockEphemerisService);
    jest.clearAllMocks();
  });

  describe('Service Initialization', () => {
    it('should initialize successfully', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(BirthChartService);
    });
  });

  describe('createBirthChart', () => {
    it('should create a birth chart with valid data', async () => {
      const userId = mockUserId.toString();
      mockEphemerisService.calculateBirthChart.mockResolvedValue(mockCalculatedBirthChart);
      (BirthChartModel.create as jest.Mock).mockResolvedValue(mockBirthChart);

      const chart = await service.createBirthChart(userId, validDateTime, validLocation);

      expect(chart).toBeDefined();
      expect(chart.userId.toString()).toBe(userId);
      expect(chart.datetime).toEqual(validDateTime);
      expect(chart.location).toEqual(validLocation);
      expect(chart.houseSystem).toBe(HouseSystem.PLACIDUS);
      expect(mockCache.set).toHaveBeenCalledWith(
        `birthChart:${mockBirthChartId.toString()}`,
        mockBirthChart,
        3600
      );
    });

    it('should throw error for invalid latitude', async () => {
      const userId = mockUserId.toString();
      const invalidLocation: GeoPosition = {
        latitude: 91,  // Invalid latitude
        longitude: validLocation.longitude
      };

      await expect(service.createBirthChart(userId, validDateTime, invalidLocation))
        .rejects.toThrow(ValidationError);
    });

    it('should throw error for invalid longitude', async () => {
      const userId = mockUserId.toString();
      const invalidLocation: GeoPosition = {
        latitude: validLocation.latitude,
        longitude: 181  // Invalid longitude
      };

      await expect(service.createBirthChart(userId, validDateTime, invalidLocation))
        .rejects.toThrow(ValidationError);
    });

    it('should throw error for invalid datetime fields', async () => {
      const userId = mockUserId.toString();
      const invalidDateTime = {
        ...validDateTime,
        month: 13,  // Invalid month
        day: 32,    // Invalid day
        hour: 24,   // Invalid hour
        minute: 60  // Invalid minute
      };

      await expect(service.createBirthChart(userId, invalidDateTime, validLocation))
        .rejects.toThrow(ValidationError);
    });

    it('should throw error for invalid userId format', async () => {
      const invalidUserId = 'invalid-id';

      await expect(service.createBirthChart(invalidUserId, validDateTime, validLocation))
        .rejects.toThrow(ValidationError);
    });

    it('should use UTC as default timezone when not provided', async () => {
      const userId = mockUserId.toString();
      const { timezone, ...dateWithoutTimezone } = validDateTime;
      const datetimeWithDefaultTimezone = { ...dateWithoutTimezone, timezone: 'UTC' };

      const result = await service.createBirthChart(userId, dateWithoutTimezone as unknown as DateTime, validLocation);
      
      expect(result.datetime.timezone).toBe('UTC');
    });
  });

  describe('getBirthChartById', () => {
    it('should return birth chart when found in cache', async () => {
      const chartId = mockBirthChartId.toString();
      mockCache.get.mockResolvedValue(mockBirthChart);

      const chart = await service.getBirthChartById(chartId);

      expect(chart).toBeDefined();
      expect(chart).not.toBeNull();
      expect(chart?.userId.toString()).toBe(mockUserId.toString());
      expect(mockCache.get).toHaveBeenCalledWith(`birthChart:${chartId}`);
    });

    it('should return birth chart when found in database', async () => {
      const chartId = mockBirthChartId.toString();
      mockCache.get.mockResolvedValue(null);
      mockEphemerisService.getBirthChartById.mockResolvedValue(mockBirthChart);

      const chart = await service.getBirthChartById(chartId);

      expect(chart).toBeDefined();
      expect(chart).not.toBeNull();
      expect(chart?.userId.toString()).toBe(mockUserId.toString());
      expect(mockCache.set).toHaveBeenCalledWith(
        `birthChart:${chartId}`,
        mockBirthChart,
        3600
      );
    });

    it('should return null when chart not found', async () => {
      const chartId = new Types.ObjectId().toString();
      mockCache.get.mockResolvedValue(null);
      mockEphemerisService.getBirthChartById.mockResolvedValue(null);

      const chart = await service.getBirthChartById(chartId);

      expect(chart).toBeNull();
    });

    it('should throw error for invalid chart ID format', async () => {
      const invalidId = 'invalid-id';

      await expect(service.getBirthChartById(invalidId))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('updateBirthChart', () => {
    it('should update birth chart with valid data', async () => {
      const chartId = mockBirthChartId.toString();
      const updateData = {
        datetime: {
          year: 2024,
          month: 3,
          day: 16,
          hour: 12,
          minute: 0,
          second: 0,
          timezone: 'UTC'
        },
        location: validLocation,
        houseSystem: HouseSystem.PLACIDUS
      };

      mockEphemerisService.getBirthChartById.mockResolvedValue(mockBirthChart);
      (BirthChartModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({
        ...mockBirthChart,
        ...updateData
      });

      const updatedChart = await service.updateBirthChart(chartId, updateData);

      expect(updatedChart).toBeDefined();
      expect(updatedChart).not.toBeNull();
      expect(updatedChart?.userId.toString()).toBe(mockUserId.toString());
      expect(mockCache.set).toHaveBeenCalledWith(
        `birthChart:${chartId}`,
        expect.any(Object),
        3600
      );
    });

    it('should throw NotFoundError when chart not found', async () => {
      const chartId = new Types.ObjectId().toString();
      const updateData = {
        datetime: mockBirthChart.datetime,
        location: mockBirthChart.location,
        houseSystem: HouseSystem.PLACIDUS
      };

      mockEphemerisService.getBirthChartById.mockResolvedValue(null);

      await expect(service.updateBirthChart(chartId, updateData))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw error for invalid update data', async () => {
      const chartId = mockBirthChartId.toString();
      const invalidUpdateData = {
        datetime: {
          ...validDateTime,
          month: 13  // Invalid month
        },
        location: validLocation,
        houseSystem: 'KOCH' as HouseSystem
      };

      await expect(service.updateBirthChart(chartId, invalidUpdateData))
        .rejects.toThrow(ValidationError);
    });

    it('should verify cache is updated after successful update', async () => {
      const chartId = mockBirthChartId.toString();
      const updateData = {
        datetime: validDateTime,
        location: validLocation,
        houseSystem: HouseSystem.PLACIDUS
      };

      mockEphemerisService.getBirthChartById.mockResolvedValue(mockBirthChart);
      (BirthChartModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({
        ...mockBirthChart,
        ...updateData
      });

      await service.updateBirthChart(chartId, updateData);

      expect(mockCache.delete).toHaveBeenCalledWith(`birthChart:${chartId}`);
      expect(mockCache.set).toHaveBeenCalledWith(
        `birthChart:${chartId}`,
        expect.any(Object),
        3600
      );
    });
  });

  describe('deleteBirthChart', () => {
    it('should delete birth chart successfully', async () => {
      const chartId = mockBirthChartId.toString();
      (BirthChartModel.findByIdAndDelete as jest.Mock).mockResolvedValue(mockBirthChart);

      const result = await service.deleteBirthChart(chartId);

      expect(result).toBe(true);
      expect(mockCache.delete).toHaveBeenCalledWith(`birthChart:${chartId}`);
    });

    it('should return false when chart not found', async () => {
      const chartId = new Types.ObjectId().toString();
      (BirthChartModel.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      const result = await service.deleteBirthChart(chartId);

      expect(result).toBe(false);
      expect(mockCache.delete).not.toHaveBeenCalled();
    });
  });

  describe('getBirthChartsByUserId', () => {
    it('should return birth charts for a user from cache', async () => {
      const userId = mockUserId.toString();
      const mockCharts = [mockBirthChart];
      mockCache.get.mockResolvedValue(mockCharts);

      const charts = await service.getBirthChartsByUserId(userId);

      expect(charts).toEqual(mockCharts);
      expect(mockCache.get).toHaveBeenCalledWith(`birthCharts:${userId}`);
    });

    it('should return birth charts for a user from database', async () => {
      const userId = mockUserId.toString();
      const mockCharts = [mockBirthChart];
      mockCache.get.mockResolvedValue(null);
      mockEphemerisService.getBirthChartsByUserId.mockResolvedValue(mockCharts);

      const charts = await service.getBirthChartsByUserId(userId);

      expect(charts).toEqual(mockCharts);
      expect(mockCache.set).toHaveBeenCalledWith(
        `birthCharts:${userId}`,
        mockCharts,
        3600
      );
    });

    it('should handle empty results gracefully', async () => {
      const userId = mockUserId.toString();
      mockCache.get.mockResolvedValue(null);
      mockEphemerisService.getBirthChartsByUserId.mockResolvedValue([]);

      const charts = await service.getBirthChartsByUserId(userId);

      expect(charts).toEqual([]);
    });

    it('should throw error for invalid user ID format', async () => {
      const invalidUserId = 'invalid-id';

      await expect(service.getBirthChartsByUserId(invalidUserId))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('calculateBirthChart', () => {
    it('should calculate birth chart with valid data', async () => {
      mockEphemerisService.calculateBirthChart.mockResolvedValue(mockCalculatedBirthChart);

      const chart = await service.calculateBirthChart(validDateTime, validLocation);

      expect(chart).toBeDefined();
      expect(chart.datetime).toEqual(validDateTime);
      expect(chart.location).toEqual(validLocation);
      expect(chart.houses.system).toBe(HouseSystem.PLACIDUS);
      expect(mockEphemerisService.calculateBirthChart).toHaveBeenCalledWith(
        validDateTime,
        validLocation,
        HouseSystem.PLACIDUS
      );
    });

    it('should handle calculation errors gracefully', async () => {
      mockEphemerisService.calculateBirthChart.mockRejectedValue(new Error('Calculation failed'));

      await expect(service.calculateBirthChart(validDateTime, validLocation))
        .rejects.toThrow('Calculation failed');
    });

    it('should validate calculation parameters', async () => {
      const invalidDateTime = {
        ...validDateTime,
        month: 13
      };

      await expect(service.calculateBirthChart(invalidDateTime, validLocation))
        .rejects.toThrow(ValidationError);
    });
  });
});
