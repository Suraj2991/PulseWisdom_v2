import { Types } from 'mongoose';
import { DateTime, GeoPosition } from '../../types/ephemeris.types';
import { BirthChartService } from '../../services/BirthChartService';
import { TransitService } from '../../services/TransitService';
import { ICache } from '../../types/cache';
import { NotFoundError, ValidationError } from '../../types/errors';
import { IBirthChart } from '../../models/BirthChart';
import { EphemerisService } from '../../services/EphemerisService';
import { TransitAnalysis } from '../../types/transit.types';

// Mock implementations
jest.mock('../../services/EphemerisService');

// Mock cache implementation
class MockCache implements ICache {
  private cache: Map<string, any> = new Map();

  async keys(pattern: string): Promise<string[]> {
    return Array.from(this.cache.keys()).filter(key => key.includes(pattern));
  }

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

  async getLifeThemeAnalysis(id: string): Promise<any> {
    return this.cache.get(`lifeTheme:${id}`);
  }

  async setLifeThemeAnalysis(id: string, analysis: any): Promise<void> {
    this.cache.set(`lifeTheme:${id}`, analysis);
  }

  async deleteLifeThemeAnalysis(id: string): Promise<void> {
    this.cache.delete(`lifeTheme:${id}`);
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

  async getInsightAnalysis(id: string): Promise<any> {
    return this.cache.get(`insights:${id}`);
  }

  async setInsightAnalysis(id: string, analysis: any): Promise<void> {
    this.cache.set(`insights:${id}`, analysis);
  }

  async deleteInsightAnalysis(id: string): Promise<void> {
    this.cache.delete(`insights:${id}`);
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

interface ExtendedBirthChart extends IBirthChart {
  _id: Types.ObjectId;
}

interface ExtendedTransitAnalysis extends TransitAnalysis {
  birthChartId: string;
  userId: string;
  significantEvents: any[];
  overallStrength: number;
  summary: string;
}

describe('BirthChart and Transit Integration', () => {
  let birthChartService: BirthChartService;
  let transitService: TransitService;
  let mockCache: MockCache;
  let mockEphemerisService: jest.Mocked<EphemerisService>;

  const mockUserId = new Types.ObjectId('507f1f77bcf86cd799439011').toString();
  const mockBirthChartId = new Types.ObjectId('507f1f77bcf86cd799439012').toString();

  const mockDateTime: DateTime = {
    year: 1990,
    month: 1,
    day: 1,
    hour: 12,
    minute: 0,
    second: 0,
    timezone: 'UTC'
  };

  const mockLocation: GeoPosition = {
    latitude: 40.7128,
    longitude: -74.0060
  };

  beforeEach(() => {
    mockCache = new MockCache();
    mockEphemerisService = {
      getBirthChartById: jest.fn(),
      getBirthChartsByUserId: jest.fn(),
      calculateBirthChart: jest.fn().mockResolvedValue({
        bodies: [{
          id: 0,
          name: 'Sun',
          longitude: 0,
          latitude: 0,
          speed: 1,
          house: 1,
          sign: 'Aries',
          signLongitude: 0
        }],
        houses: { cusps: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330], system: 'PLACIDUS' },
        angles: { ascendant: 0, mc: 90, ic: 270, descendant: 180 }
      }),
      analyzeTransits: jest.fn().mockResolvedValue({
        date: mockDateTime,
        transits: [{
          transitPlanet: 'Sun',
          natalPlanet: 'Moon',
          aspectType: 'conjunction',
          angle: 0,
          orb: 1,
          isApplying: true,
          strength: 'high'
        }],
        windows: [{
          transitPlanet: 'Sun',
          aspectType: 'conjunction',
          natalPlanet: 'Moon',
          startDate: mockDateTime,
          endDate: mockDateTime,
          description: 'Test transit',
          strength: 'high',
          recommendations: ['Test recommendation']
        }]
      }),
      calculateTransits: jest.fn(),
      calculatePlanetaryPositions: jest.fn(),
      healthCheck: jest.fn(),
      client: {} as any
    } as unknown as jest.Mocked<EphemerisService>;

    birthChartService = new BirthChartService(mockCache, mockEphemerisService);
    transitService = new TransitService(mockCache, mockEphemerisService);
  });

  describe('Birth Chart Creation and Transit Analysis', () => {
    it('should create birth chart and analyze transits', async () => {
      // Create birth chart
      const birthChart = await birthChartService.createBirthChart(
        mockUserId,
        mockDateTime,
        mockLocation
      ) as ExtendedBirthChart;

      expect(birthChart).toBeDefined();
      expect(birthChart.userId.toString()).toBe(mockUserId);
      expect(birthChart.datetime).toEqual(mockDateTime);
      expect(birthChart.location).toEqual(mockLocation);
      expect(birthChart.bodies).toBeDefined();
      expect(birthChart.houses).toBeDefined();
      expect(birthChart.angles).toBeDefined();

      // Analyze transits for current date
      const currentDate: DateTime = {
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        day: new Date().getDate(),
        hour: new Date().getHours(),
        minute: new Date().getMinutes(),
        second: new Date().getSeconds(),
        timezone: 'UTC'
      };

      const transitAnalysis = await transitService.analyzeTransits(
        birthChart._id.toString(),
        currentDate
      );

      expect(transitAnalysis).toBeDefined();
      expect(transitAnalysis.date).toBeDefined();
      expect(transitAnalysis.transits).toBeDefined();
      expect(transitAnalysis.windows).toBeDefined();
      expect(Array.isArray(transitAnalysis.transits)).toBe(true);
      expect(Array.isArray(transitAnalysis.windows)).toBe(true);
      
      if (transitAnalysis.transits.length > 0) {
        const transit = transitAnalysis.transits[0];
        expect(transit.transitPlanet).toBeDefined();
        expect(transit.natalPlanet).toBeDefined();
        expect(transit.aspectType).toBeDefined();
        expect(transit.strength).toBeDefined();
      }

      if (transitAnalysis.windows.length > 0) {
        const window = transitAnalysis.windows[0];
        expect(window.transitPlanet).toBeDefined();
        expect(window.natalPlanet).toBeDefined();
        expect(window.aspectType).toBeDefined();
        expect(window.startDate).toBeDefined();
        expect(window.endDate).toBeDefined();
        expect(window.description).toBeDefined();
        expect(window.strength).toBeDefined();
        expect(window.recommendations).toBeDefined();
      }
    });

    it('should handle transit analysis for date range', async () => {
      // Create birth chart
      const birthChart = await birthChartService.createBirthChart(
        mockUserId,
        mockDateTime,
        mockLocation
      ) as IBirthChart & { _id: Types.ObjectId };

      // Define date range
      const startDate: DateTime = {
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        day: new Date().getDate(),
        hour: 0,
        minute: 0,
        second: 0,
        timezone: 'UTC'
      };

      const endDate: DateTime = {
        ...startDate,
        day: startDate.day + 7 // Analyze for 7 days
      };

      const transitAnalyses = await transitService.getTransitsByDateRange(
        birthChart._id.toString(),
        startDate,
        endDate
      );

      expect(transitAnalyses).toBeDefined();
      expect(transitAnalyses.length).toBe(8); // 7 days + start date
      transitAnalyses.forEach(analysis => {
        expect(analysis.date).toBeDefined();
        expect(analysis.transits).toBeDefined();
        expect(analysis.windows).toBeDefined();
        expect(Array.isArray(analysis.transits)).toBe(true);
        expect(Array.isArray(analysis.windows)).toBe(true);
      });
    });

    it('should handle invalid birth chart ID', async () => {
      const invalidId = new Types.ObjectId().toString();

      await expect(transitService.analyzeTransits(invalidId, mockDateTime))
        .rejects
        .toThrow(NotFoundError);
    });

    it('should handle invalid dates', async () => {
      // Create birth chart
      const birthChart = await birthChartService.createBirthChart(
        mockUserId,
        mockDateTime,
        mockLocation
      ) as IBirthChart & { _id: Types.ObjectId };

      const invalidDate: DateTime = {
        year: 1990,
        month: 13, // Invalid month
        day: 1,
        hour: 0,
        minute: 0,
        second: 0,
        timezone: 'UTC'
      };

      await expect(transitService.analyzeTransits(birthChart._id.toString(), invalidDate))
        .rejects
        .toThrow(ValidationError);
    });

    it('should cache transit analysis results', async () => {
      // Create birth chart
      const birthChart = await birthChartService.createBirthChart(
        mockUserId,
        mockDateTime,
        mockLocation
      ) as IBirthChart & { _id: Types.ObjectId };

      // First analysis (should calculate)
      const firstAnalysis = await transitService.analyzeTransits(
        birthChart._id.toString(),
        mockDateTime
      );

      // Second analysis (should use cache)
      const secondAnalysis = await transitService.analyzeTransits(
        birthChart._id.toString(),
        mockDateTime
      );

      expect(firstAnalysis).toEqual(secondAnalysis);
      expect(mockCache.get).toHaveBeenCalledTimes(2);
    });

    it('should handle concurrent transit calculations', async () => {
      // Create birth chart
      const birthChart = await birthChartService.createBirthChart(
        mockUserId,
        mockDateTime,
        mockLocation
      ) as IBirthChart & { _id: Types.ObjectId };

      // Perform multiple concurrent transit analyses
      const analyses = await Promise.all(
        Array(5).fill(null).map(() => 
          transitService.analyzeTransits(birthChart._id.toString(), mockDateTime)
        )
      );

      expect(analyses.length).toBe(5);
      analyses.forEach(analysis => {
        expect(analysis.date).toBeDefined();
        expect(analysis.transits).toBeDefined();
        expect(analysis.windows).toBeDefined();
        expect(Array.isArray(analysis.transits)).toBe(true);
        expect(Array.isArray(analysis.windows)).toBe(true);
      });

      // Verify all analyses are identical (cached)
      const firstAnalysis = analyses[0];
      analyses.slice(1).forEach(analysis => {
        expect(analysis).toEqual(firstAnalysis);
      });
    });
  });
}); 