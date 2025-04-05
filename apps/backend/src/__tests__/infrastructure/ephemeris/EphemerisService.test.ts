import { EphemerisService } from '../../../infrastructure/ephemeris/EphemerisService';
import { RedisCache } from '../../../infrastructure/cache/RedisCache';
import { CelestialBody } from '../../../types/ephemeris.types';
import { ServiceError } from '../../../types/errors';

jest.mock('../../../infrastructure/cache/RedisCache');

describe('EphemerisService', () => {
  let ephemerisService: EphemerisService;
  let mockCache: jest.Mocked<RedisCache>;

  const mockPlanetaryPositions: CelestialBody[] = [
    {
      id: 1,
      name: 'Sun',
      longitude: 0,
      latitude: 0,
      speed: 1,
      house: 1,
      sign: 'Aries',
      signLongitude: 0
    },
    {
      id: 2,
      name: 'Moon',
      longitude: 90,
      latitude: 0,
      speed: 13,
      house: 4,
      sign: 'Cancer',
      signLongitude: 0
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockCache = new RedisCache('redis://localhost:6379') as jest.Mocked<RedisCache>;
    ephemerisService = new EphemerisService(mockCache);
  });

  describe('Planetary Positions', () => {
    it('should get planetary positions from cache if available', async () => {
      mockCache.getPlanetaryPositions.mockResolvedValue(mockPlanetaryPositions);
      
      const positions = await ephemerisService.getPlanetaryPositions();
      
      expect(positions).toEqual(mockPlanetaryPositions);
      expect(mockCache.getPlanetaryPositions).toHaveBeenCalled();
    });

    it('should calculate and cache planetary positions if not in cache', async () => {
      mockCache.getPlanetaryPositions.mockResolvedValue(null);
      mockCache.setPlanetaryPositions.mockResolvedValue(undefined);
      
      const positions = await ephemerisService.getPlanetaryPositions();
      
      expect(positions).toBeDefined();
      expect(positions.length).toBeGreaterThan(0);
      expect(mockCache.setPlanetaryPositions).toHaveBeenCalled();
    });

    it('should handle cache errors gracefully', async () => {
      mockCache.getPlanetaryPositions.mockRejectedValue(new Error('Cache error'));
      
      await expect(ephemerisService.getPlanetaryPositions())
        .rejects
        .toThrow(ServiceError);
    });
  });

  describe('Position Calculation', () => {
    it('should calculate positions for a specific date', async () => {
      const date = new Date('2024-01-01T00:00:00Z');
      const positions = await ephemerisService.calculatePositions(date);
      
      expect(positions).toBeDefined();
      expect(positions.length).toBeGreaterThan(0);
      positions.forEach(position => {
        expect(position).toHaveProperty('id');
        expect(position).toHaveProperty('name');
        expect(position).toHaveProperty('longitude');
        expect(position).toHaveProperty('latitude');
        expect(position).toHaveProperty('speed');
        expect(position).toHaveProperty('house');
        expect(position).toHaveProperty('sign');
        expect(position).toHaveProperty('signLongitude');
      });
    });

    it('should handle invalid dates', async () => {
      const invalidDate = new Date('invalid');
      
      await expect(ephemerisService.calculatePositions(invalidDate))
        .rejects
        .toThrow(ServiceError);
    });
  });

  describe('House System', () => {
    it('should calculate house positions', async () => {
      const date = new Date('2024-01-01T00:00:00Z');
      const latitude = 0;
      const longitude = 0;
      
      const houses = await ephemerisService.calculateHouses(date, latitude, longitude);
      
      expect(houses).toBeDefined();
      expect(houses.length).toBe(12);
      houses.forEach(house => {
        expect(house).toHaveProperty('number');
        expect(house).toHaveProperty('longitude');
      });
    });

    it('should handle invalid coordinates', async () => {
      const date = new Date('2024-01-01T00:00:00Z');
      const invalidLatitude = 91;
      const invalidLongitude = 181;
      
      await expect(ephemerisService.calculateHouses(date, invalidLatitude, invalidLongitude))
        .rejects
        .toThrow(ServiceError);
    });
  });

  describe('Aspects', () => {
    it('should calculate aspects between planets', async () => {
      const date = new Date('2024-01-01T00:00:00Z');
      const positions = await ephemerisService.calculatePositions(date);
      
      const aspects = await ephemerisService.calculateAspects(positions);
      
      expect(aspects).toBeDefined();
      expect(aspects.length).toBeGreaterThan(0);
      aspects.forEach(aspect => {
        expect(aspect).toHaveProperty('planet1');
        expect(aspect).toHaveProperty('planet2');
        expect(aspect).toHaveProperty('type');
        expect(aspect).toHaveProperty('orb');
      });
    });

    it('should handle empty position array', async () => {
      const aspects = await ephemerisService.calculateAspects([]);
      
      expect(aspects).toBeDefined();
      expect(aspects.length).toBe(0);
    });
  });

  describe('Cache Management', () => {
    it('should clear planetary positions cache', async () => {
      await ephemerisService.clearCache();
      
      expect(mockCache.clearCache).toHaveBeenCalled();
    });

    it('should handle cache clearing errors', async () => {
      mockCache.clearCache.mockRejectedValue(new Error('Cache error'));
      
      await expect(ephemerisService.clearCache())
        .rejects
        .toThrow(ServiceError);
    });
  });
}); 