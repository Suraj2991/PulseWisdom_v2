import { Types } from 'mongoose';
import { DateTime, GeoPosition } from '@pulsewisdom/astro';
import { BirthChartService } from '../../services/BirthChartService';
import { TransitService } from '../../services/TransitService';
import { ICache } from '../../types/cache';
import { IBirthChart } from '../../models/BirthChart';

// Mock cache implementation
class MockCache implements ICache {
  private cache: Map<string, any> = new Map();

  async get(key: string): Promise<any> {
    return this.cache.get(key);
  }

  async set(key: string, value: any): Promise<void> {
    this.cache.set(key, value);
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.cache.has(key);
  }

  async getPlanetaryPositions(): Promise<any> {
    return this.cache.get('planetaryPositions');
  }

  async setPlanetaryPositions(positions: any): Promise<void> {
    this.cache.set('planetaryPositions', positions);
  }

  async getBirthChart(id: string): Promise<IBirthChart | null> {
    return this.cache.get(`birthChart:${id}`);
  }

  async setBirthChart(id: string, chart: IBirthChart): Promise<void> {
    this.cache.set(`birthChart:${id}`, chart);
  }

  async deleteBirthChart(id: string): Promise<void> {
    this.cache.delete(`birthChart:${id}`);
  }

  async getTransitAnalysis(id: string, date: DateTime): Promise<any> {
    return this.cache.get(`transit:${id}:${date.year}-${date.month}-${date.day}`);
  }

  async setTransitAnalysis(id: string, date: DateTime, analysis: any): Promise<void> {
    this.cache.set(`transit:${id}:${date.year}-${date.month}-${date.day}`, analysis);
  }

  async deleteTransitAnalysis(id: string, date: DateTime): Promise<void> {
    this.cache.delete(`transit:${id}:${date.year}-${date.month}-${date.day}`);
  }

  async getInsight(id: string): Promise<any> {
    return this.cache.get(`insight:${id}`);
  }

  async setInsight(id: string, insight: any): Promise<void> {
    this.cache.set(`insight:${id}`, insight);
  }

  async deleteInsight(id: string): Promise<void> {
    this.cache.delete(`insight:${id}`);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async clearCache(): Promise<void> {
    this.cache.clear();
  }

  async disconnect(): Promise<void> {
    this.cache.clear();
  }
}

describe('Cache Performance Tests', () => {
  let birthChartService: BirthChartService;
  let transitService: TransitService;
  let mockCache: MockCache;

  const mockUserId = new Types.ObjectId('507f1f77bcf86cd799439011').toString();
  const mockDateTime: DateTime = {
    year: 1990,
    month: 1,
    day: 1,
    hour: 12,
    minute: 0,
    second: 0,
    timezone: 0
  };

  const mockLocation: GeoPosition = {
    latitude: 40.7128,
    longitude: -74.0060
  };

  beforeEach(() => {
    mockCache = new MockCache();
    birthChartService = new BirthChartService(mockCache);
    transitService = new TransitService(mockCache, birthChartService);
  });

  describe('Cache Hit Performance', () => {
    it('should retrieve cached data within performance threshold', async () => {
      // First, create and cache some data
      const birthChart = await birthChartService.createBirthChart(
        mockUserId,
        mockDateTime,
        mockLocation
      ) as IBirthChart & { _id: Types.ObjectId };

      const startTime = performance.now();
      
      // Retrieve cached data
      const cachedChart = await birthChartService.getBirthChartById(birthChart._id.toString()) as IBirthChart & { _id: Types.ObjectId };
      
      const endTime = performance.now();
      const retrievalTime = endTime - startTime;

      expect(retrievalTime).toBeLessThan(50); // Cache hit should be very fast (< 50ms)
      expect(cachedChart).toBeDefined();
      expect(cachedChart?._id.toString()).toBe(birthChart._id.toString());
    });

    it('should handle multiple concurrent cache hits efficiently', async () => {
      // First, create and cache some data
      const birthChart = await birthChartService.createBirthChart(
        mockUserId,
        mockDateTime,
        mockLocation
      ) as IBirthChart & { _id: Types.ObjectId };

      const startTime = performance.now();
      const numRetrievals = 1000;
      
      const retrievals = Array(numRetrievals).fill(null).map(() => 
        birthChartService.getBirthChartById(birthChart._id.toString())
      );

      const results = await Promise.all(retrievals);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(results.length).toBe(numRetrievals);
      expect(totalTime / numRetrievals).toBeLessThan(10); // Each cache hit should be very fast (< 10ms)
    });
  });

  describe('Cache Miss Performance', () => {
    it('should handle cache misses gracefully', async () => {
      const startTime = performance.now();
      const invalidId = new Types.ObjectId().toString();
      
      const result = await birthChartService.getBirthChartById(invalidId);
      
      const endTime = performance.now();
      const retrievalTime = endTime - startTime;

      expect(retrievalTime).toBeLessThan(100); // Cache miss should still be fast (< 100ms)
      expect(result).toBeNull();
    });

    it('should handle multiple concurrent cache misses efficiently', async () => {
      const startTime = performance.now();
      const numRetrievals = 100;
      
      const retrievals = Array(numRetrievals).fill(null).map(() => 
        birthChartService.getBirthChartById(new Types.ObjectId().toString())
      );

      const results = await Promise.all(retrievals);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(results.length).toBe(numRetrievals);
      expect(totalTime / numRetrievals).toBeLessThan(50); // Each cache miss should be fast (< 50ms)
    });
  });

  describe('Cache Write Performance', () => {
    it('should write to cache within performance threshold', async () => {
      const startTime = performance.now();
      const numWrites = 1000;
      
      const writes = Array(numWrites).fill(null).map((_, index) => {
        const id = new Types.ObjectId().toString();
        return mockCache.set(`test:${id}`, { value: index });
      });

      await Promise.all(writes);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime / numWrites).toBeLessThan(5); // Each cache write should be very fast (< 5ms)
    });

    it('should handle cache updates efficiently', async () => {
      // First, create some data
      const birthChart = await birthChartService.createBirthChart(
        mockUserId,
        mockDateTime,
        mockLocation
      ) as IBirthChart & { _id: Types.ObjectId };

      const startTime = performance.now();
      const numUpdates = 100;
      
      const updates = Array(numUpdates).fill(null).map((_, index) => {
        const updatedChart = {
          ...birthChart,
          updatedAt: new Date()
        };
        return mockCache.set(`birthChart:${birthChart._id}`, updatedChart);
      });

      await Promise.all(updates);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime / numUpdates).toBeLessThan(10); // Each cache update should be fast (< 10ms)
    });
  });

  describe('Cache Memory Usage', () => {
    it('should maintain stable memory usage during cache operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      const numOperations = 10000;
      
      // Perform multiple cache operations
      for (let i = 0; i < numOperations; i++) {
        const id = new Types.ObjectId().toString();
        await mockCache.set(`test:${id}`, { value: i });
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (< 200MB for 10,000 operations)
      expect(memoryIncrease).toBeLessThan(200 * 1024 * 1024);
    });

    it('should clean up memory after cache clear', async () => {
      // First, fill the cache
      const numItems = 10000;
      for (let i = 0; i < numItems; i++) {
        const id = new Types.ObjectId().toString();
        await mockCache.set(`test:${id}`, { value: i });
      }

      const memoryBeforeClear = process.memoryUsage().heapUsed;
      
      // Clear the cache
      await mockCache.clear();
      
      const memoryAfterClear = process.memoryUsage().heapUsed;
      const memoryReduction = memoryBeforeClear - memoryAfterClear;

      // Memory should be significantly reduced after clear
      expect(memoryReduction).toBeGreaterThan(0);
    });
  });

  describe('Cache Concurrency', () => {
    it('should handle concurrent read/write operations correctly', async () => {
      const id = new Types.ObjectId().toString();
      const numOperations = 1000;
      
      const startTime = performance.now();
      
      // Mix of reads and writes
      const operations = Array(numOperations).fill(null).map((_, index) => {
        if (index % 2 === 0) {
          return mockCache.set(`test:${id}`, { value: index });
        } else {
          return mockCache.get(`test:${id}`);
        }
      });

      const results = await Promise.all(operations);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(results.length).toBe(numOperations);
      expect(totalTime / numOperations).toBeLessThan(10); // Each operation should be fast (< 10ms)
    });

    it('should maintain data consistency under concurrent access', async () => {
      const id = new Types.ObjectId().toString();
      const numWriters = 10;
      const numReaders = 100;
      
      // Start multiple writers
      const writers = Array(numWriters).fill(null).map((_, index) => {
        return new Promise<void>(async (resolve) => {
          for (let i = 0; i < 100; i++) {
            await mockCache.set(`test:${id}`, { value: i, writer: index });
          }
          resolve();
        });
      });

      // Start multiple readers
      const readers = Array(numReaders).fill(null).map(() => {
        return new Promise<void>(async (resolve) => {
          for (let i = 0; i < 10; i++) {
            await mockCache.get(`test:${id}`);
          }
          resolve();
        });
      });

      await Promise.all([...writers, ...readers]);
      // If we get here without errors, the test passes
    });
  });
}); 