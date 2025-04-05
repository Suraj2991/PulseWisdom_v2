import { Types } from 'mongoose';
import { DateTime, GeoPosition } from '../../types/ephemeris.types';
import { BirthChartService } from '../../services/BirthChartService';
import { TransitService } from '../../services/TransitService';
import { InsightService } from '../../services/InsightService';
import { LifeThemeService } from '../../services/LifeThemeService';
import { EphemerisService } from '../../services/EphemerisService';
import { AIService } from '../../services/AIService';
import { ICache } from '../../types/cache';
import { IBirthChart } from '../../models/BirthChart';

// Mock cache implementation
class MockCache implements ICache {
  private cache: Map<string, any> = new Map();

  async get<T>(key: string): Promise<T | null> {
    return this.cache.get(key) || null;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    this.cache.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
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

  async getBirthChart(id: string): Promise<any> {
    return this.cache.get(`birthchart:${id}`);
  }

  async setBirthChart(id: string, data: any): Promise<void> {
    this.cache.set(`birthchart:${id}`, data);
  }

  async deleteBirthChart(id: string): Promise<void> {
    this.cache.delete(`birthchart:${id}`);
  }

  async getInsight(id: string): Promise<any> {
    return this.cache.get(`insight:${id}`);
  }

  async setInsight(id: string, data: any): Promise<void> {
    this.cache.set(`insight:${id}`, data);
  }

  async deleteInsight(id: string): Promise<void> {
    this.cache.delete(`insight:${id}`);
  }

  async clearCache(): Promise<void> {
    this.cache.clear();
  }

  async disconnect(): Promise<void> {
    // No-op for mock
  }
}

describe('Service Performance Tests', () => {
  let birthChartService: BirthChartService;
  let transitService: TransitService;
  let insightService: InsightService;
  let lifeThemeService: LifeThemeService;
  let ephemerisService: EphemerisService;
  let aiService: AIService;
  let mockCache: MockCache;

  const mockUserId = new Types.ObjectId('507f1f77bcf86cd799439011').toString();
  const mockDateTime: DateTime = {
    year: 1990,
    month: 1,
    day: 1,
    hour: 12,
    minute: 0,
    second: 0,
    timezone: '0'
  };

  const mockLocation: GeoPosition = {
    latitude: 40.7128,
    longitude: -74.0060
  };

  let mockBirthChartId: string;

  beforeEach(async () => {
    mockCache = new MockCache();
    ephemerisService = new EphemerisService(mockCache, 'http://localhost:8000');
    birthChartService = new BirthChartService(mockCache, ephemerisService);
    aiService = new AIService();
    lifeThemeService = new LifeThemeService(mockCache, ephemerisService, aiService);
    transitService = new TransitService(mockCache, ephemerisService);
    insightService = new InsightService(mockCache, ephemerisService, lifeThemeService);

    // Create a birth chart for testing
    const birthChart = await birthChartService.createBirthChart(mockUserId, mockDateTime, mockLocation);
    mockBirthChartId = (birthChart as IBirthChart & { _id: Types.ObjectId })._id.toString();
  });

  describe('Service Initialization Performance', () => {
    it('should initialize services within performance threshold', async () => {
      const startTime = performance.now();
      
      // Initialize all services independently
      const localCache = new MockCache();
      const localEphemerisService = new EphemerisService(localCache, 'http://localhost:8000');
      const localBirthChartService = new BirthChartService(localCache, localEphemerisService);
      const localAIService = new AIService();
      const localLifeThemeService = new LifeThemeService(localCache, localEphemerisService, localAIService);
      const localTransitService = new TransitService(localCache, localEphemerisService);
      const localInsightService = new InsightService(localCache, localEphemerisService, localLifeThemeService);

      const services = [
        localBirthChartService,
        localTransitService,
        localLifeThemeService,
        localInsightService
      ];

      const endTime = performance.now();
      const initializationTime = endTime - startTime;

      expect(initializationTime).toBeLessThan(100); // Service initialization should be fast (< 100ms)
      expect(services.length).toBe(4);
    });
  });

  describe('Service Operation Performance', () => {
    it('should handle multiple concurrent operations efficiently', async () => {
      const startTime = performance.now();
      const operations = [
        birthChartService.createBirthChart(mockUserId, mockDateTime, mockLocation),
        transitService.analyzeTransits(mockBirthChartId, mockDateTime),
        lifeThemeService.analyzeLifeThemes(mockBirthChartId),
        insightService.analyzeInsights(mockBirthChartId)
      ];

      await Promise.all(operations);
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const averageTime = totalTime / operations.length;

      expect(averageTime).toBeLessThan(500); // Each operation should average less than 500ms
    });

    it('should handle service operations under load', async () => {
      const startTime = performance.now();
      const numUsers = 100;
      const operationsPerUser = 5;

      // Simulate multiple users performing operations
      const userOperations = Array(numUsers).fill(null).map((_, userIndex) => {
        const userId = new Types.ObjectId().toString();
        return Array(operationsPerUser).fill(null).map(async (_, opIndex) => {
          const date = {
            ...mockDateTime,
            day: mockDateTime.day + opIndex
          };
          return birthChartService.createBirthChart(userId, date, mockLocation);
        });
      });

      const results = await Promise.all(userOperations.flat());
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(results.length).toBe(numUsers * operationsPerUser);
      expect(totalTime / (numUsers * operationsPerUser)).toBeLessThan(200); // Average time per operation should be less than 200ms
    });
  });

  describe('Service Memory Management', () => {
    it('should maintain stable memory usage during operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      const operations = [];

      // Create 1000 operations
      for (let i = 0; i < 1000; i++) {
        operations.push(
          birthChartService.createBirthChart(mockUserId, mockDateTime, mockLocation),
          transitService.analyzeTransits(mockBirthChartId, mockDateTime),
          lifeThemeService.analyzeLifeThemes(mockBirthChartId),
          insightService.analyzeInsights(mockBirthChartId)
        );
      }

      await Promise.all(operations);
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      expect(memoryIncrease).toBeLessThan(500 * 1024 * 1024); // Less than 500MB increase
    });

    it('should clean up resources after service operations', async () => {
      const operations = [
        birthChartService.createBirthChart(mockUserId, mockDateTime, mockLocation),
        transitService.analyzeTransits(mockBirthChartId, mockDateTime),
        lifeThemeService.analyzeLifeThemes(mockBirthChartId),
        insightService.analyzeInsights(mockBirthChartId)
      ];

      await Promise.all(operations);
      
      // Clear cache and check memory
      await mockCache.clear();
      const memoryAfterClear = process.memoryUsage().heapUsed;
      
      // Create new operations to verify cleanup
      await Promise.all(operations);
      const memoryAfterNewOperations = process.memoryUsage().heapUsed;
      
      expect(memoryAfterNewOperations - memoryAfterClear).toBeLessThan(100 * 1024 * 1024); // Less than 100MB increase after cleanup
    });
  });
}); 