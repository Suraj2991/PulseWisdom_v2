import { EphemerisService } from '../../services/EphemerisService';
import { ICache } from '../../infrastructure/cache/ICache';
import { KerykeionClient } from '../../clients/KerykeionClient';
import { NotFoundError } from '../../types/errors';
import { DateTime, BirthChart, HouseSystem } from '../../types/ephemeris.types';
import { TransitAnalysis } from '../../types/transit.types';
import { Types } from 'mongoose';
import { BirthChartModel } from '../../models/BirthChart';

jest.mock('../../clients/KerykeionClient');
jest.mock('../../models/BirthChart');

describe('EphemerisService', () => {
  let service: EphemerisService;
  let mockCache: jest.Mocked<Pick<ICache, 'get' | 'set' | 'delete' | 'clear'>>;
  let mockClient: jest.Mocked<KerykeionClient>;
  const mockBirthChartId = new Types.ObjectId().toString();

  const mockDateTime: DateTime = {
    year: 1990,
    month: 1,
    day: 1,
    hour: 0,
    minute: 0,
    second: 0,
    timezone: 'UTC'
  };

  const mockLocation = { latitude: 0, longitude: 0 };

  const mockBirthChart: BirthChart = {
    datetime: mockDateTime,
    location: mockLocation,
    bodies: [],
    houses: { cusps: [], system: HouseSystem.PLACIDUS },
    angles: { ascendant: 0, midheaven: 0, descendant: 0, imumCoeli: 0 },
    aspects: []
  };

  const mockTransits = [{
    transitPlanet: 'Sun',
    natalPlanet: 'Moon',
    aspectType: 'conjunction',
    orb: 2,
    isApplying: true,
    strength: 'high' as const,
    angle: 0
  }];

  beforeEach(() => {
    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn()
    } as jest.Mocked<Pick<ICache, 'get' | 'set' | 'delete' | 'clear'>>;

    const mockClientInstance = {
      calculateBirthChart: jest.fn(),
      calculateTransits: jest.fn(),
      calculateTransitWindows: jest.fn(),
      calculatePlanetaryPositions: jest.fn(),
      healthCheck: jest.fn()
    };

    mockClient = mockClientInstance as unknown as jest.Mocked<KerykeionClient>;

    service = new EphemerisService(mockCache as unknown as ICache, 'http://localhost:8000');
    (service as any).client = mockClient;
  });

  describe('getBirthChartById', () => {
    it('should return cached birth chart if available', async () => {
      mockCache.get.mockResolvedValue(mockBirthChart);

      const result = await service.getBirthChartById(mockBirthChartId);

      expect(result).toEqual(mockBirthChart);
      expect(mockCache.get).toHaveBeenCalledWith(`birth_chart:${mockBirthChartId}`);
    });

    it('should fetch from database and cache if not in cache', async () => {
      mockCache.get.mockResolvedValue(null);
      (BirthChartModel.findById as jest.Mock).mockResolvedValue(mockBirthChart);

      const result = await service.getBirthChartById(mockBirthChartId);

      expect(result).toEqual(mockBirthChart);
      expect(mockCache.get).toHaveBeenCalledWith(`birth_chart:${mockBirthChartId}`);
      expect(BirthChartModel.findById).toHaveBeenCalledWith(mockBirthChartId);
      expect(mockCache.set).toHaveBeenCalledWith(`birth_chart:${mockBirthChartId}`, mockBirthChart, 3600);
    });

    it('should throw NotFoundError if birth chart not found', async () => {
      mockCache.get.mockResolvedValue(null);
      (BirthChartModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.getBirthChartById(mockBirthChartId))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe('calculateBirthChart', () => {
    const cacheKey = `birth_chart:${JSON.stringify({ datetime: mockDateTime, location: mockLocation, houseSystem: HouseSystem.PLACIDUS })}`;

    it('should return cached birth chart if available', async () => {
      mockCache.get.mockResolvedValue(mockBirthChart);

      const result = await service.calculateBirthChart(mockDateTime, mockLocation);

      expect(result).toEqual(mockBirthChart);
      expect(mockCache.get).toHaveBeenCalledWith(cacheKey);
    });

    it('should calculate and cache new birth chart if not in cache', async () => {
      mockCache.get.mockResolvedValue(null);
      mockClient.calculateBirthChart.mockResolvedValue(mockBirthChart);

      const result = await service.calculateBirthChart(mockDateTime, mockLocation);

      expect(result).toEqual(mockBirthChart);
      expect(mockCache.get).toHaveBeenCalledWith(cacheKey);
      expect(mockClient.calculateBirthChart).toHaveBeenCalledWith(mockDateTime, mockLocation, HouseSystem.PLACIDUS);
      expect(mockCache.set).toHaveBeenCalledWith(cacheKey, mockBirthChart, 3600);
    });
  });

  describe('analyzeTransits', () => {
    it('should calculate transits for a birth chart', async () => {
      // Mock getBirthChartById
      mockCache.get.mockImplementation((key: string) => {
        if (key === `birth_chart:${mockBirthChartId}`) {
          return Promise.resolve(mockBirthChart);
        }
        if (key.startsWith('transits:')) {
          return Promise.resolve(null);
        }
        return Promise.resolve(null);
      });

      // Mock calculateBirthChart, calculateTransits, and calculateTransitWindows
      mockClient.calculateBirthChart.mockResolvedValue(mockBirthChart);
      mockClient.calculateTransits.mockResolvedValue(mockTransits);
      mockClient.calculateTransitWindows.mockResolvedValue([]);

      const result: TransitAnalysis = await service.analyzeTransits(mockBirthChartId, mockDateTime);

      expect(result).toEqual({
        date: mockDateTime,
        transits: mockTransits,
        windows: []
      });
      expect(mockClient.calculateBirthChart).toHaveBeenCalledWith(mockDateTime, mockBirthChart.location, mockBirthChart.houses.system);
      expect(mockClient.calculateTransits).toHaveBeenCalledWith(mockBirthChart, mockDateTime);
      expect(mockClient.calculateTransitWindows).toHaveBeenCalledWith(mockBirthChart, mockDateTime);
    });

    it('should throw NotFoundError if birth chart not found', async () => {
      mockCache.get.mockResolvedValue(null);
      (BirthChartModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.analyzeTransits(mockBirthChartId, mockDateTime))
        .rejects
        .toThrow(NotFoundError);
    });
  });
}); 