import { Types } from 'mongoose';
import { EphemerisService } from '../../services/EphemerisService';
import { BirthChartService } from '../../services/BirthChartService';
import { LifeThemeService } from '../../services/LifeThemeService';
import { InsightService } from '../../services/InsightService';
import { AIService } from '../../services/AIService';
import { ValidationError } from '../../types/errors';
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

describe('Validation Error Tests', () => {
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

  describe('Date Validation', () => {
    it('should validate date components', async () => {
      const invalidDates = [
        { ...mockDateTime, month: 13 }, // Invalid month
        { ...mockDateTime, day: 32 },   // Invalid day
        { ...mockDateTime, hour: 24 },  // Invalid hour
        { ...mockDateTime, minute: 60 } // Invalid minute
      ];

      for (const invalidDate of invalidDates) {
        await expect(birthChartService.createBirthChart(
          mockUserId,
          invalidDate,
          mockLocation
        )).rejects.toThrow(ValidationError);
      }
    });

    it('should validate date ranges for transit analysis', async () => {
      const birthChart = await birthChartService.createBirthChart(
        mockUserId,
        mockDateTime,
        mockLocation
      ) as IBirthChart & { _id: Types.ObjectId };

      const invalidDates = [
        { ...mockDateTime, year: 1800 }, // Too far in past
        { ...mockDateTime, year: 2100 }  // Too far in future
      ];

      for (const invalidDate of invalidDates) {
        await expect(transitService.analyzeTransits(
          birthChart._id.toString(),
          invalidDate
        )).rejects.toThrow(ValidationError);
      }
    });
  });

  describe('Location Validation', () => {
    it('should validate location coordinates', async () => {
      const invalidLocations = [
        { latitude: 91, longitude: 0 },    // Invalid latitude
        { latitude: -91, longitude: 0 },   // Invalid latitude
        { latitude: 0, longitude: 181 },   // Invalid longitude
        { latitude: 0, longitude: -181 }   // Invalid longitude
      ];

      for (const invalidLocation of invalidLocations) {
        await expect(birthChartService.createBirthChart(
          mockUserId,
          mockDateTime,
          invalidLocation
        )).rejects.toThrow(ValidationError);
      }
    });
  });

  describe('ID Validation', () => {
    it('should validate MongoDB ObjectId format', async () => {
      const invalidIds = [
        'invalid-id',
        '123',
        'not-a-valid-objectid',
        '507f1f77bcf86cd79943901' // Too short
      ];

      for (const invalidId of invalidIds) {
        await expect(birthChartService.getBirthChartById(invalidId))
          .rejects.toThrow(ValidationError);
      }
    });
  });

  describe('Timing Analysis Validation', () => {
    it('should validate date ranges for timing analysis', async () => {
      const birthChart = await birthChartService.createBirthChart(
        mockUserId,
        mockDateTime,
        mockLocation
      ) as IBirthChart & { _id: Types.ObjectId };

      const invalidRanges = [
        {
          startDate: new Date(2024, 12, 1), // Invalid month
          endDate: new Date(2024, 1, 1)
        },
        {
          startDate: new Date(2024, 1, 1),
          endDate: new Date(2023, 1, 1) // End before start
        }
      ];

      for (const range of invalidRanges) {
        await expect(timingAnalysisService.analyzeTiming(
          birthChart._id.toString(),
          range.startDate,
          range.endDate,
          'career_change'
        )).rejects.toThrow(ValidationError);
      }
    });

    it('should validate activity types', async () => {
      const birthChart = await birthChartService.createBirthChart(
        mockUserId,
        mockDateTime,
        mockLocation
      ) as IBirthChart & { _id: Types.ObjectId };

      await expect(timingAnalysisService.analyzeTiming(
        birthChart._id.toString(),
        new Date(2024, 1, 1),
        new Date(2024, 2, 1),
        'invalid_activity_type'
      )).rejects.toThrow(ValidationError);
    });
  });
}); 