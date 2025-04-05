import { Types } from 'mongoose';
import { EphemerisService } from '../../services/EphemerisService';
import { BirthChartService } from '../../services/BirthChartService';
import { LifeThemeService } from '../../services/LifeThemeService';
import { InsightService } from '../../services/InsightService';
import { AIService } from '../../services/AIService';
import { ValidationError, NotFoundError, CalculationError } from '../../types/errors';
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

  async clear(): Promise<void> {
    this.cache.clear();
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

describe('Error Propagation Tests', () => {
  let ephemerisService: EphemerisService;
  let birthChartService: BirthChartService;
  let lifeThemeService: LifeThemeService;
  let insightService: InsightService;
  let aiService: AIService;
  let mockCache: MockCache;

  const mockUserId = new Types.ObjectId().toString();
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
    ephemerisService = new EphemerisService(mockCache, 'http://localhost:3000');
    birthChartService = new BirthChartService(mockCache, ephemerisService);
    aiService = new AIService();
    lifeThemeService = new LifeThemeService(mockCache, ephemerisService, aiService);
    insightService = new InsightService(mockCache, ephemerisService, lifeThemeService);
  });

  describe('Validation Error Propagation', () => {
    it('should propagate validation errors from birth chart to dependent services', async () => {
      // Create an invalid date to trigger validation error
      const invalidDateTime: DateTime = {
        ...mockDateTime,
        month: 13 // Invalid month
      };

      // Test birth chart creation
      await expect(birthChartService.createBirthChart(
        mockUserId,
        invalidDateTime,
        mockLocation
      )).rejects.toThrow(ValidationError);

      // Create a valid birth chart for testing dependent services
      const birthChart = await birthChartService.createBirthChart(
        mockUserId,
        mockDateTime,
        mockLocation
      ) as IBirthChart & { _id: Types.ObjectId };

      // Test timing analysis with invalid date range
      await expect(insightService.analyzeInsights(birthChart._id.toString()))
        .rejects.toThrow(ValidationError);
    });

    it('should propagate validation errors for invalid IDs', async () => {
      const invalidId = 'invalid-id';

      await expect(birthChartService.getBirthChartById(invalidId))
        .rejects.toThrow(ValidationError);

      await expect(insightService.analyzeInsights(invalidId))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('NotFound Error Propagation', () => {
    it('should propagate not found errors across services', async () => {
      const nonExistentId = new Types.ObjectId().toString();

      // Test direct not found error
      await expect(birthChartService.getBirthChartById(nonExistentId))
        .rejects.toThrow(NotFoundError);

      await expect(insightService.analyzeInsights(nonExistentId))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('Calculation Error Propagation', () => {
    it('should handle calculation errors in birth chart service', async () => {
      // Create conditions that would trigger calculation errors
      const edgeDateTime: DateTime = {
        year: 1,  // Edge case year
        month: 1,
        day: 1,
        hour: 0,
        minute: 0,
        second: 0,
        timezone: 0
      };

      await expect(birthChartService.createBirthChart(
        mockUserId,
        edgeDateTime,
        mockLocation
      )).rejects.toThrow(CalculationError);
    });

    it('should handle calculation errors in life theme service', async () => {
      const birthChart = await birthChartService.createBirthChart(
        mockUserId,
        mockDateTime,
        mockLocation
      ) as IBirthChart & { _id: Types.ObjectId };

      const futureDateTime: DateTime = {
        year: 2100,  // Future date that might cause calculation issues
        month: 1,
        day: 1,
        hour: 0,
        minute: 0,
        second: 0,
        timezone: 0
      };

      await expect(lifeThemeService.analyzeLifeThemes(birthChart._id.toString()))
        .rejects.toThrow(CalculationError);
    });
  });

  describe('Error Recovery', () => {
    it('should recover from cache errors gracefully', async () => {
      // Create a birth chart
      const birthChart = await birthChartService.createBirthChart(
        mockUserId,
        mockDateTime,
        mockLocation
      ) as IBirthChart & { _id: Types.ObjectId };

      // Simulate cache failure
      jest.spyOn(mockCache, 'get').mockRejectedValueOnce(new Error('Cache error'));

      // Service should still work by recalculating
      const result = await insightService.analyzeInsights(birthChart._id.toString());
      
      expect(result).toBeDefined();
      expect(result.birthChartId).toBe(birthChart._id.toString());
    });

    it('should handle concurrent error scenarios', async () => {
      const birthChart = await birthChartService.createBirthChart(
        mockUserId,
        mockDateTime,
        mockLocation
      ) as IBirthChart & { _id: Types.ObjectId };

      // Create multiple concurrent requests with some invalid data
      const requests = Array(5).fill(null).map((_, i) => {
        const date = { ...mockDateTime, month: i > 2 ? 13 : i + 1 };
        return insightService.analyzeInsights(birthChart._id.toString());
      });

      const results = await Promise.allSettled(requests);

      // Verify that valid requests succeeded and invalid ones failed
      expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(3);
      expect(results.filter(r => r.status === 'rejected')).toHaveLength(2);
    });
  });
}); 