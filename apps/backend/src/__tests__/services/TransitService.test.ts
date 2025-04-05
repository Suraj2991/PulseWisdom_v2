import { Types } from 'mongoose';
import { TransitService } from '../../services/TransitService';
import { ICache } from '../../infrastructure/cache/ICache';
import { EphemerisService } from '../../services/EphemerisService';
import { NotFoundError, ValidationError, ConfigurationError } from '../../types/errors';
import { TransitAnalysis } from '../../types/transit.types';
import { DateTime, HouseSystem } from '../../types/ephemeris.types';
import { IBirthChart } from '../../models/BirthChart';

jest.mock('../../services/EphemerisService');

describe('TransitService', () => {
  let service: TransitService;
  let mockCache: jest.Mocked<ICache>;
  let mockEphemerisService: jest.Mocked<EphemerisService>;

  const mockBirthChartId = new Types.ObjectId().toString();
  const mockUserId = new Types.ObjectId().toString();

  const validDateTime: DateTime = {
    year: 2024,
    month: 3,
    day: 15,
    hour: 12,
    minute: 0,
    second: 0,
    timezone: 'UTC'
  };

  const mockBirthChart: IBirthChart = {
    _id: new Types.ObjectId(mockBirthChartId),
    userId: new Types.ObjectId(mockUserId),
    datetime: validDateTime,
    location: { latitude: 40.7128, longitude: -74.0060 },
    houseSystem: HouseSystem.PLACIDUS,
    bodies: [
      { id: 0, name: 'Sun', longitude: 0, latitude: 0, speed: 1, house: 1, sign: 'Aries', signLongitude: 0 },
      { id: 1, name: 'Moon', longitude: 60, latitude: 0, speed: 2, house: 3, sign: 'Gemini', signLongitude: 0 }
    ],
    angles: {
      ascendant: 0,
      mc: 90,
      ic: 270,
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

  const mockTransitAnalysis: TransitAnalysis = {
    transits: [{
      transitPlanet: 'Sun',
      natalPlanet: 'Moon',
      aspectType: 'conjunction',
      orb: 2,
      isApplying: true,
      strength: 'high',
      angle: 0
    }],
    windows: [],
    date: validDateTime
  };

  beforeEach(() => {
    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn()
    } as unknown as jest.Mocked<ICache>;

    mockEphemerisService = {
      analyzeTransits: jest.fn(),
      calculateTransits: jest.fn()
    } as unknown as jest.Mocked<EphemerisService>;

    service = new TransitService(mockCache, mockEphemerisService);
  });

  describe('Service Initialization', () => {
    it('should throw error when cache service is not initialized', () => {
      expect(() => new TransitService(null as unknown as ICache, mockEphemerisService))
        .toThrow(ConfigurationError);
    });

    it('should throw error when ephemeris service is not initialized', () => {
      expect(() => new TransitService(mockCache, null as unknown as EphemerisService))
        .toThrow(ConfigurationError);
    });
  });

  describe('Cache Management', () => {
    it('should handle cache expiration', async () => {
      mockCache.get.mockResolvedValue(null);
      mockEphemerisService.analyzeTransits.mockResolvedValue(mockTransitAnalysis);

      const result = await service.analyzeTransits(mockBirthChartId, validDateTime);

      expect(result).toEqual(mockTransitAnalysis);
      expect(mockCache.set).toHaveBeenCalledWith(
        `transits:${mockBirthChartId}:${validDateTime.year}-${validDateTime.month}-${validDateTime.day}`,
        mockTransitAnalysis,
        3600 // Verify cache expiration time
      );
    });

    it('should handle cache invalidation', async () => {
      // First call - cache miss
      mockCache.get.mockResolvedValue(null);
      mockEphemerisService.analyzeTransits.mockResolvedValue(mockTransitAnalysis);
      await service.analyzeTransits(mockBirthChartId, validDateTime);

      // Second call - cache hit
      mockCache.get.mockResolvedValue(mockTransitAnalysis);
      const result = await service.analyzeTransits(mockBirthChartId, validDateTime);

      expect(result).toEqual(mockTransitAnalysis);
      expect(mockEphemerisService.analyzeTransits).toHaveBeenCalledTimes(1);
    });
  });

  describe('analyzeTransits', () => {
    it('should return cached transits if available', async () => {
      mockCache.get.mockResolvedValue(mockTransitAnalysis);

      const result = await service.analyzeTransits(mockBirthChartId, validDateTime);

      expect(result).toEqual(mockTransitAnalysis);
      expect(mockCache.get).toHaveBeenCalledWith(
        `transits:${mockBirthChartId}:${validDateTime.year}-${validDateTime.month}-${validDateTime.day}`
      );
    });

    it('should calculate and cache new transits if not in cache', async () => {
      mockCache.get.mockResolvedValue(null);
      mockEphemerisService.analyzeTransits.mockResolvedValue(mockTransitAnalysis);

      const result = await service.analyzeTransits(mockBirthChartId, validDateTime);

      expect(result).toEqual(mockTransitAnalysis);
      expect(mockEphemerisService.analyzeTransits).toHaveBeenCalledWith(mockBirthChartId, validDateTime);
      expect(mockCache.set).toHaveBeenCalledWith(
        `transits:${mockBirthChartId}:${validDateTime.year}-${validDateTime.month}-${validDateTime.day}`,
        mockTransitAnalysis,
        3600
      );
    });

    it('should handle ephemeris service errors', async () => {
      mockCache.get.mockResolvedValue(null);
      mockEphemerisService.analyzeTransits.mockRejectedValue(new Error('Ephemeris calculation failed'));

      await expect(service.analyzeTransits(mockBirthChartId, validDateTime))
        .rejects
        .toThrow('Ephemeris calculation failed');
    });

    it('should handle cache errors gracefully', async () => {
      mockCache.get.mockRejectedValue(new Error('Cache error'));
      mockEphemerisService.analyzeTransits.mockResolvedValue(mockTransitAnalysis);

      const result = await service.analyzeTransits(mockBirthChartId, validDateTime);

      expect(result).toEqual(mockTransitAnalysis);
      expect(mockEphemerisService.analyzeTransits).toHaveBeenCalledWith(mockBirthChartId, validDateTime);
    });

    it('should validate date input', async () => {
      const invalidDateTime: DateTime = {
        year: 2024,
        month: 13, // Invalid month
        day: 15,
        hour: 12,
        minute: 0,
        second: 0,
        timezone: 'UTC'
      };

      await expect(service.analyzeTransits(mockBirthChartId, invalidDateTime))
        .rejects
        .toThrow(ValidationError);
    });
  });

  describe('calculateTransits', () => {
    it('should calculate transits using ephemeris service', async () => {
      mockEphemerisService.calculateTransits.mockResolvedValue(mockTransitAnalysis);

      const result = await service.calculateTransits(mockBirthChart, validDateTime);

      expect(result).toEqual(mockTransitAnalysis);
      expect(mockEphemerisService.calculateTransits).toHaveBeenCalledWith(mockBirthChart, validDateTime);
    });

    it('should handle ephemeris service calculation errors', async () => {
      mockEphemerisService.calculateTransits.mockRejectedValue(new Error('Calculation failed'));

      await expect(service.calculateTransits(mockBirthChart, validDateTime))
        .rejects
        .toThrow('Calculation failed');
    });

    it('should validate birth chart data', async () => {
      const invalidBirthChart = {
        ...mockBirthChart,
        bodies: [] // Empty bodies array
      } as unknown as IBirthChart;

      await expect(service.calculateTransits(invalidBirthChart, validDateTime))
        .rejects
        .toThrow(ValidationError);
    });
  });

  describe('getTransitsByDateRange', () => {
    it('should return transits for each day in the date range', async () => {
      const startDate: DateTime = {
        year: 2024,
        month: 3,
        day: 15,
        hour: 0,
        minute: 0,
        second: 0,
        timezone: 'UTC'
      };

      const endDate: DateTime = {
        year: 2024,
        month: 3,
        day: 16,
        hour: 0,
        minute: 0,
        second: 0,
        timezone: 'UTC'
      };

      mockCache.get.mockResolvedValue(null);
      mockEphemerisService.analyzeTransits.mockResolvedValue(mockTransitAnalysis);

      const result = await service.getTransitsByDateRange(mockBirthChartId, startDate, endDate);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockTransitAnalysis);
      expect(result[1]).toEqual(mockTransitAnalysis);
      expect(mockEphemerisService.analyzeTransits).toHaveBeenCalledTimes(2);
    });

    it('should handle empty transit results', async () => {
      const startDate: DateTime = {
        year: 2024,
        month: 3,
        day: 15,
        hour: 0,
        minute: 0,
        second: 0,
        timezone: 'UTC'
      };

      const endDate: DateTime = {
        year: 2024,
        month: 3,
        day: 16,
        hour: 0,
        minute: 0,
        second: 0,
        timezone: 'UTC'
      };

      mockCache.get.mockResolvedValue(null);
      mockEphemerisService.analyzeTransits.mockResolvedValue({
        transits: [],
        windows: [],
        date: startDate
      });

      const result = await service.getTransitsByDateRange(mockBirthChartId, startDate, endDate);

      expect(result).toHaveLength(2);
      expect(result[0].transits).toHaveLength(0);
      expect(result[1].transits).toHaveLength(0);
    });

    it('should validate date range', async () => {
      const startDate: DateTime = {
        year: 2024,
        month: 3,
        day: 16,
        hour: 0,
        minute: 0,
        second: 0,
        timezone: 'UTC'
      };

      const endDate: DateTime = {
        year: 2024,
        month: 3,
        day: 15, // End date before start date
        hour: 0,
        minute: 0,
        second: 0,
        timezone: 'UTC'
      };

      await expect(service.getTransitsByDateRange(mockBirthChartId, startDate, endDate))
        .rejects
        .toThrow(ValidationError);
    });

    it('should handle malformed transit data', async () => {
      const startDate: DateTime = {
        year: 2024,
        month: 3,
        day: 15,
        hour: 0,
        minute: 0,
        second: 0,
        timezone: 'UTC'
      };

      const endDate: DateTime = {
        year: 2024,
        month: 3,
        day: 16,
        hour: 0,
        minute: 0,
        second: 0,
        timezone: 'UTC'
      };

      mockCache.get.mockResolvedValue(null);
      mockEphemerisService.analyzeTransits.mockResolvedValue({
        transits: [{
          transitPlanet: 'Invalid', // Invalid planet name
          natalPlanet: 'Moon',
          aspectType: 'conjunction',
          orb: 2,
          isApplying: true,
          strength: 'high',
          angle: 0
        }],
        windows: [],
        date: startDate
      });

      await expect(service.getTransitsByDateRange(mockBirthChartId, startDate, endDate))
        .rejects
        .toThrow(ValidationError);
    });
  });
}); 