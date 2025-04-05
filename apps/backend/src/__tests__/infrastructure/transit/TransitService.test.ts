import { TransitService } from '../../../infrastructure/transit/TransitService';
import { RedisCache } from '../../../infrastructure/cache/RedisCache';
import { BirthChartService } from '../../../infrastructure/birth-chart/BirthChartService';
import { ServiceError } from '../../../types/errors';
import { Transit } from '../../../types/transit.types';

jest.mock('../../../infrastructure/cache/RedisCache');
jest.mock('../../../infrastructure/birth-chart/BirthChartService');

describe('TransitService', () => {
  let transitService: TransitService;
  let mockCache: jest.Mocked<RedisCache>;
  let mockBirthChartService: jest.Mocked<BirthChartService>;

  const mockTransit: Transit = {
    id: 'test-transit',
    birthChartId: 'test-birth-chart',
    date: new Date('2024-01-01T00:00:00Z'),
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
    aspects: [
      {
        planet1: 'Sun',
        planet2: 'Moon',
        type: 'conjunction',
        orb: 0.5
      }
    ],
    housePositions: Array(12).fill(0).map((_, i) => ({
      number: i + 1,
      longitude: i * 30
    }))
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCache = new RedisCache('redis://localhost:6379') as jest.Mocked<RedisCache>;
    mockBirthChartService = new BirthChartService(mockCache, {} as any) as jest.Mocked<BirthChartService>;
    transitService = new TransitService(mockCache, mockBirthChartService);
  });

  describe('Transit Calculation', () => {
    it('should calculate transits for a birth chart', async () => {
      const date = new Date('2024-01-01T00:00:00Z');
      
      mockBirthChartService.getBirthChart.mockResolvedValue({
        id: 'test-birth-chart',
        datetime: new Date('1990-01-01T00:00:00Z'),
        location: { latitude: 0, longitude: 0 },
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
        houses: [],
        aspects: []
      });
      
      mockBirthChartService.calculateTransits.mockResolvedValue({
        planets: mockTransit.planets,
        aspects: mockTransit.aspects
      });
      
      const transit = await transitService.calculateTransit('test-birth-chart', date);
      
      expect(transit).toBeDefined();
      expect(transit.birthChartId).toBe('test-birth-chart');
      expect(transit.date).toEqual(date);
      expect(transit.planets).toBeDefined();
      expect(transit.aspects).toBeDefined();
      expect(transit.housePositions).toBeDefined();
      expect(mockBirthChartService.getBirthChart).toHaveBeenCalledWith('test-birth-chart');
      expect(mockBirthChartService.calculateTransits).toHaveBeenCalledWith('test-birth-chart', date);
    });

    it('should handle invalid dates', async () => {
      const invalidDate = new Date('invalid');
      
      await expect(transitService.calculateTransit('test-birth-chart', invalidDate))
        .rejects
        .toThrow(ServiceError);
    });
  });

  describe('Transit Retrieval', () => {
    it('should get transit from cache if available', async () => {
      mockCache.get.mockResolvedValue(JSON.stringify(mockTransit));
      
      const transit = await transitService.getTransit('test-transit');
      
      expect(transit).toEqual(mockTransit);
      expect(mockCache.get).toHaveBeenCalledWith('transit:test-transit');
    });

    it('should handle cache misses', async () => {
      mockCache.get.mockResolvedValue(null);
      
      await expect(transitService.getTransit('non-existent'))
        .rejects
        .toThrow(ServiceError);
    });

    it('should handle cache errors', async () => {
      mockCache.get.mockRejectedValue(new Error('Cache error'));
      
      await expect(transitService.getTransit('test-transit'))
        .rejects
        .toThrow(ServiceError);
    });
  });

  describe('Transit Storage', () => {
    it('should store transit in cache', async () => {
      await transitService.storeTransit('test-transit', mockTransit);
      
      expect(mockCache.set).toHaveBeenCalledWith(
        'transit:test-transit',
        JSON.stringify(mockTransit),
        'EX',
        3600
      );
    });

    it('should handle storage errors', async () => {
      mockCache.set.mockRejectedValue(new Error('Cache error'));
      
      await expect(transitService.storeTransit('test-transit', mockTransit))
        .rejects
        .toThrow(ServiceError);
    });
  });

  describe('Transit Deletion', () => {
    it('should delete transit from cache', async () => {
      await transitService.deleteTransit('test-transit');
      
      expect(mockCache.delete).toHaveBeenCalledWith('transit:test-transit');
    });

    it('should handle deletion errors', async () => {
      mockCache.delete.mockRejectedValue(new Error('Cache error'));
      
      await expect(transitService.deleteTransit('test-transit'))
        .rejects
        .toThrow(ServiceError);
    });
  });

  describe('Batch Operations', () => {
    it('should calculate transits for a date range', async () => {
      const startDate = new Date('2024-01-01T00:00:00Z');
      const endDate = new Date('2024-01-07T00:00:00Z');
      
      mockBirthChartService.getBirthChart.mockResolvedValue({
        id: 'test-birth-chart',
        datetime: new Date('1990-01-01T00:00:00Z'),
        location: { latitude: 0, longitude: 0 },
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
        houses: [],
        aspects: []
      });
      
      mockBirthChartService.calculateTransits.mockResolvedValue({
        planets: mockTransit.planets,
        aspects: mockTransit.aspects
      });
      
      const transits = await transitService.calculateTransitsForDateRange('test-birth-chart', startDate, endDate);
      
      expect(transits).toBeDefined();
      expect(transits.length).toBe(7); // One transit per day
      transits.forEach(transit => {
        expect(transit.birthChartId).toBe('test-birth-chart');
        expect(transit.planets).toBeDefined();
        expect(transit.aspects).toBeDefined();
      });
    });

    it('should handle invalid date ranges', async () => {
      const startDate = new Date('2024-01-07T00:00:00Z');
      const endDate = new Date('2024-01-01T00:00:00Z');
      
      await expect(transitService.calculateTransitsForDateRange('test-birth-chart', startDate, endDate))
        .rejects
        .toThrow(ServiceError);
    });
  });
}); 