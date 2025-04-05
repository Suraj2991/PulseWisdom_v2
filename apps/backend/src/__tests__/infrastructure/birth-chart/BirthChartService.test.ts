import { BirthChartService } from '../../../infrastructure/birth-chart/BirthChartService';
import { RedisCache } from '../../../infrastructure/cache/RedisCache';
import { EphemerisService } from '../../../infrastructure/ephemeris/EphemerisService';
import { ServiceError } from '../../../types/errors';
import { BirthChart } from '../../../types/birth-chart.types';

jest.mock('../../../infrastructure/cache/RedisCache');
jest.mock('../../../infrastructure/ephemeris/EphemerisService');

describe('BirthChartService', () => {
  let birthChartService: BirthChartService;
  let mockCache: jest.Mocked<RedisCache>;
  let mockEphemerisService: jest.Mocked<EphemerisService>;

  const mockBirthChart: BirthChart = {
    id: 'test-id',
    datetime: new Date('1990-01-01T00:00:00Z'),
    location: {
      latitude: 0,
      longitude: 0
    },
    planets: [
      {
        id: 1,
        name: 'Sun',
        longitude: 0,
        latitude: 0,
        speed: 1,
        house: 1,
        sign: 'Aries',
        signLongitude: 0
      }
    ],
    houses: Array(12).fill(0).map((_, i) => ({
      number: i + 1,
      longitude: i * 30
    })),
    aspects: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCache = new RedisCache('redis://localhost:6379') as jest.Mocked<RedisCache>;
    mockEphemerisService = new EphemerisService(mockCache) as jest.Mocked<EphemerisService>;
    birthChartService = new BirthChartService(mockCache, mockEphemerisService);
  });

  describe('Birth Chart Creation', () => {
    it('should create a birth chart', async () => {
      const datetime = new Date('1990-01-01T00:00:00Z');
      const location = { latitude: 0, longitude: 0 };
      
      mockEphemerisService.calculatePositions.mockResolvedValue(mockBirthChart.planets);
      mockEphemerisService.calculateHouses.mockResolvedValue(mockBirthChart.houses);
      mockEphemerisService.calculateAspects.mockResolvedValue(mockBirthChart.aspects);
      
      const chart = await birthChartService.createBirthChart(datetime, location);
      
      expect(chart).toBeDefined();
      expect(chart.planets).toHaveLength(mockBirthChart.planets.length);
      expect(chart.houses).toHaveLength(12);
      expect(mockEphemerisService.calculatePositions).toHaveBeenCalledWith(datetime);
      expect(mockEphemerisService.calculateHouses).toHaveBeenCalledWith(datetime, location.latitude, location.longitude);
      expect(mockEphemerisService.calculateAspects).toHaveBeenCalled();
    });

    it('should handle invalid birth data', async () => {
      const invalidDate = new Date('invalid');
      const invalidLocation = { latitude: 91, longitude: 181 };
      
      await expect(birthChartService.createBirthChart(invalidDate, invalidLocation))
        .rejects
        .toThrow(ServiceError);
    });
  });

  describe('Birth Chart Retrieval', () => {
    it('should get birth chart from cache if available', async () => {
      mockCache.getBirthChart.mockResolvedValue(mockBirthChart);
      
      const chart = await birthChartService.getBirthChart('test-id');
      
      expect(chart).toEqual(mockBirthChart);
      expect(mockCache.getBirthChart).toHaveBeenCalledWith('test-id');
    });

    it('should handle cache misses', async () => {
      mockCache.getBirthChart.mockResolvedValue(null);
      
      await expect(birthChartService.getBirthChart('non-existent'))
        .rejects
        .toThrow(ServiceError);
    });

    it('should handle cache errors', async () => {
      mockCache.getBirthChart.mockRejectedValue(new Error('Cache error'));
      
      await expect(birthChartService.getBirthChart('test-id'))
        .rejects
        .toThrow(ServiceError);
    });
  });

  describe('Birth Chart Storage', () => {
    it('should store birth chart in cache', async () => {
      await birthChartService.storeBirthChart('test-id', mockBirthChart);
      
      expect(mockCache.setBirthChart).toHaveBeenCalledWith('test-id', mockBirthChart);
    });

    it('should handle storage errors', async () => {
      mockCache.setBirthChart.mockRejectedValue(new Error('Cache error'));
      
      await expect(birthChartService.storeBirthChart('test-id', mockBirthChart))
        .rejects
        .toThrow(ServiceError);
    });
  });

  describe('Birth Chart Deletion', () => {
    it('should delete birth chart from cache', async () => {
      await birthChartService.deleteBirthChart('test-id');
      
      expect(mockCache.deleteBirthChart).toHaveBeenCalledWith('test-id');
    });

    it('should handle deletion errors', async () => {
      mockCache.deleteBirthChart.mockRejectedValue(new Error('Cache error'));
      
      await expect(birthChartService.deleteBirthChart('test-id'))
        .rejects
        .toThrow(ServiceError);
    });
  });

  describe('Transit Calculations', () => {
    it('should calculate transits for a birth chart', async () => {
      const transitDate = new Date('2024-01-01T00:00:00Z');
      
      mockEphemerisService.calculatePositions.mockResolvedValue(mockBirthChart.planets);
      mockEphemerisService.calculateAspects.mockResolvedValue(mockBirthChart.aspects);
      
      const transits = await birthChartService.calculateTransits('test-id', transitDate);
      
      expect(transits).toBeDefined();
      expect(transits.planets).toBeDefined();
      expect(transits.aspects).toBeDefined();
      expect(mockEphemerisService.calculatePositions).toHaveBeenCalledWith(transitDate);
      expect(mockEphemerisService.calculateAspects).toHaveBeenCalled();
    });

    it('should handle invalid transit dates', async () => {
      const invalidDate = new Date('invalid');
      
      await expect(birthChartService.calculateTransits('test-id', invalidDate))
        .rejects
        .toThrow(ServiceError);
    });
  });
}); 