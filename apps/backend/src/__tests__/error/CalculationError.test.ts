import { Types } from 'mongoose';
import { EphemerisService } from '../../services/EphemerisService';
import { BirthChartService } from '../../services/BirthChartService';
import { LifeThemeService } from '../../services/LifeThemeService';
import { InsightService } from '../../services/InsightService';
import { AIService } from '../../services/AIService';
import { CalculationError } from '../../types/errors';
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

describe('Calculation Error Tests', () => {
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

  describe('Birth Chart Calculation Errors', () => {
    it('should handle calculation errors for extreme dates', async () => {
      const extremeDates = [
        { ...mockDateTime, year: 1 },      // Too far in past
        { ...mockDateTime, year: 3000 },   // Too far in future
        { ...mockDateTime, year: -1 }      // Invalid year
      ];

      for (const date of extremeDates) {
        await expect(birthChartService.createBirthChart(
          mockUserId,
          date,
          mockLocation
        )).rejects.toThrow(CalculationError);
      }
    });

    it('should handle calculation errors for extreme locations', async () => {
      const extremeLocations = [
        { latitude: 90.1, longitude: 0 },  // Beyond North Pole
        { latitude: -90.1, longitude: 0 }, // Beyond South Pole
        { latitude: 0, longitude: 180.1 }  // Beyond date line
      ];

      for (const location of extremeLocations) {
        await expect(birthChartService.createBirthChart(
          mockUserId,
          mockDateTime,
          location
        )).rejects.toThrow(CalculationError);
      }
    });
  });

  describe('Insight Calculation Errors', () => {
    it('should handle calculation errors for insight analysis', async () => {
      const birthChart = await birthChartService.createBirthChart(
        mockUserId,
        mockDateTime,
        mockLocation
      ) as IBirthChart & { _id: Types.ObjectId };

      // Simulate a corrupted birth chart that would cause calculation errors
      const corruptedBirthChart = {
        ...birthChart,
        bodies: [] // Missing planetary bodies
      };

      await mockCache.setBirthChart(birthChart._id.toString(), corruptedBirthChart);

      await expect(insightService.analyzeInsights(
        birthChart._id.toString()
      )).rejects.toThrow(CalculationError);
    });
  });

  describe('Error Recovery', () => {
    it('should recover from calculation errors when retrying with valid data', async () => {
      // First attempt with invalid data
      await expect(birthChartService.createBirthChart(
        mockUserId,
        { ...mockDateTime, year: 1 },
        mockLocation
      )).rejects.toThrow(CalculationError);

      // Second attempt with valid data should succeed
      const birthChart = await birthChartService.createBirthChart(
        mockUserId,
        mockDateTime,
        mockLocation
      ) as IBirthChart & { _id: Types.ObjectId };

      expect(birthChart).toBeDefined();
      expect(birthChart._id).toBeDefined();
    });
  });
}); 