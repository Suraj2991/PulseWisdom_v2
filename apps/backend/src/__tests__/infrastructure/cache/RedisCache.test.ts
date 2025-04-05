import Redis from 'ioredis';
import { RedisCache } from '../../../infrastructure/cache/RedisCache';
import { ServiceError } from '../../../types/errors';
import { CelestialBody } from '../../../types/ephemeris.types';

// Mock Redis client
jest.mock('ioredis', () => {
  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    flushall: jest.fn(),
    exists: jest.fn(),
    quit: jest.fn(),
    on: jest.fn()
  };
  return jest.fn(() => mockRedis);
});

describe('RedisCache', () => {
  let redisCache: RedisCache;
  let mockRedis: jest.Mocked<Redis>;

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
    }
  ];

  const mockBirthChart = {
    id: 'test-id',
    datetime: new Date(),
    location: {
      latitude: 0,
      longitude: 0
    }
  };

  const mockInsight = {
    id: 'test-insight',
    type: 'daily',
    content: 'Test insight'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    redisCache = new RedisCache('redis://localhost:6379');
    mockRedis = new Redis() as jest.Mocked<Redis>;
  });

  describe('Basic Cache Operations', () => {
    it('should get value from cache', async () => {
      const testKey = 'test-key';
      const testValue = { data: 'test' };
      
      mockRedis.get.mockResolvedValue(JSON.stringify(testValue));
      
      const result = await redisCache.get(testKey);
      expect(result).toEqual(testValue);
      expect(mockRedis.get).toHaveBeenCalledWith(testKey);
    });

    it('should return null for non-existent key', async () => {
      mockRedis.get.mockResolvedValue(null);
      
      const result = await redisCache.get('non-existent');
      expect(result).toBeNull();
    });

    it('should set value in cache with TTL', async () => {
      const testKey = 'test-key';
      const testValue = { data: 'test' };
      const ttl = 3600;
      
      await redisCache.set(testKey, testValue, ttl);
      
      expect(mockRedis.set).toHaveBeenCalledWith(
        testKey,
        JSON.stringify(testValue),
        'EX',
        ttl
      );
    });

    it('should delete key from cache', async () => {
      const testKey = 'test-key';
      
      await redisCache.delete(testKey);
      
      expect(mockRedis.del).toHaveBeenCalledWith(testKey);
    });

    it('should check if key exists', async () => {
      const testKey = 'test-key';
      mockRedis.exists.mockResolvedValue(1);
      
      const exists = await redisCache.exists(testKey);
      
      expect(exists).toBe(true);
      expect(mockRedis.exists).toHaveBeenCalledWith(testKey);
    });

    it('should get keys by pattern', async () => {
      const pattern = 'test:*';
      const keys = ['test:1', 'test:2'];
      mockRedis.keys.mockResolvedValue(keys);
      
      const result = await redisCache.keys(pattern);
      
      expect(result).toEqual(keys);
      expect(mockRedis.keys).toHaveBeenCalledWith(pattern);
    });

    it('should clear cache', async () => {
      await redisCache.clear();
      
      expect(mockRedis.flushall).toHaveBeenCalled();
    });

    it('should disconnect from Redis', async () => {
      await redisCache.disconnect();
      
      expect(mockRedis.quit).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle Redis get error', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis error'));
      
      await expect(redisCache.get('test-key'))
        .rejects
        .toThrow(ServiceError);
    });

    it('should handle Redis set error', async () => {
      mockRedis.set.mockRejectedValue(new Error('Redis error'));
      
      await expect(redisCache.set('test-key', 'value', 3600))
        .rejects
        .toThrow(ServiceError);
    });

    it('should handle Redis delete error', async () => {
      mockRedis.del.mockRejectedValue(new Error('Redis error'));
      
      await expect(redisCache.delete('test-key'))
        .rejects
        .toThrow(ServiceError);
    });
  });

  describe('Domain-Specific Operations', () => {
    describe('Planetary Positions', () => {
      it('should get planetary positions', async () => {
        mockRedis.get.mockResolvedValue(JSON.stringify(mockPlanetaryPositions));
        
        const result = await redisCache.getPlanetaryPositions();
        
        expect(result).toEqual(mockPlanetaryPositions);
        expect(mockRedis.get).toHaveBeenCalledWith('planetary:positions');
      });

      it('should set planetary positions', async () => {
        await redisCache.setPlanetaryPositions(mockPlanetaryPositions);
        
        expect(mockRedis.set).toHaveBeenCalledWith(
          'planetary:positions',
          JSON.stringify(mockPlanetaryPositions),
          'EX',
          3600
        );
      });
    });

    describe('Birth Charts', () => {
      it('should get birth chart', async () => {
        const id = 'test-id';
        mockRedis.get.mockResolvedValue(JSON.stringify(mockBirthChart));
        
        const result = await redisCache.getBirthChart(id);
        
        expect(result).toEqual(mockBirthChart);
        expect(mockRedis.get).toHaveBeenCalledWith('birthchart:test-id');
      });

      it('should set birth chart', async () => {
        const id = 'test-id';
        await redisCache.setBirthChart(id, mockBirthChart);
        
        expect(mockRedis.set).toHaveBeenCalledWith(
          'birthchart:test-id',
          JSON.stringify(mockBirthChart),
          'EX',
          3600
        );
      });

      it('should delete birth chart', async () => {
        const id = 'test-id';
        await redisCache.deleteBirthChart(id);
        
        expect(mockRedis.del).toHaveBeenCalledWith('birthchart:test-id');
      });
    });

    describe('Insights', () => {
      it('should get insight', async () => {
        const id = 'test-insight';
        mockRedis.get.mockResolvedValue(JSON.stringify(mockInsight));
        
        const result = await redisCache.getInsight(id);
        
        expect(result).toEqual(mockInsight);
        expect(mockRedis.get).toHaveBeenCalledWith('insight:test-insight');
      });

      it('should set insight', async () => {
        const id = 'test-insight';
        await redisCache.setInsight(id, mockInsight);
        
        expect(mockRedis.set).toHaveBeenCalledWith(
          'insight:test-insight',
          JSON.stringify(mockInsight),
          'EX',
          3600
        );
      });

      it('should delete insight', async () => {
        const id = 'test-insight';
        await redisCache.deleteInsight(id);
        
        expect(mockRedis.del).toHaveBeenCalledWith('insight:test-insight');
      });
    });
  });
}); 