import { Types } from 'mongoose';
import { DateTime, GeoPosition } from '@pulsewisdom/astro';
import { InsightService } from '../../services/InsightService';
import { LifeThemeService } from '../../services/LifeThemeService';
import { BirthChartService } from '../../services/BirthChartService';
import { TransitService } from '../../services/TransitService';
import { ICache } from '../../types/cache';
import { NotFoundError } from '../../types/errors';
import { IBirthChart } from '../../models/BirthChart';
import { InsightType, InsightCategory } from '../../types/insight.types';

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

describe('Insight and LifeTheme Integration', () => {
  let insightService: InsightService;
  let lifeThemeService: LifeThemeService;
  let birthChartService: BirthChartService;
  let transitService: TransitService;
  let mockCache: MockCache;

  const mockUserId = new Types.ObjectId('507f1f77bcf86cd799439011').toString();
  const mockBirthChartId = new Types.ObjectId('507f1f77bcf86cd799439012').toString();

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
    lifeThemeService = new LifeThemeService(mockCache, birthChartService);
    insightService = new InsightService(mockCache, birthChartService, lifeThemeService, transitService);
  });

  describe('Life Theme Analysis and Insights', () => {
    it('should analyze life themes and generate insights', async () => {
      // Create birth chart
      const birthChart = await birthChartService.createBirthChart(
        mockUserId,
        mockDateTime,
        mockLocation
      ) as IBirthChart & { _id: Types.ObjectId };

      // Analyze life themes
      const lifeThemeAnalysis = await lifeThemeService.analyzeLifeThemes(birthChart._id.toString());

      expect(lifeThemeAnalysis).toBeDefined();
      expect(lifeThemeAnalysis.birthChartId).toBe(birthChart._id.toString());
      expect(lifeThemeAnalysis.userId).toBe(mockUserId);
      expect(lifeThemeAnalysis.themes).toBeDefined();
      expect(lifeThemeAnalysis.themes.coreIdentity).toBeDefined();
      expect(lifeThemeAnalysis.themes.strengths).toBeDefined();
      expect(lifeThemeAnalysis.themes.challenges).toBeDefined();

      // Generate insights
      const insightAnalysis = await insightService.analyzeInsights(birthChart._id.toString());

      expect(insightAnalysis).toBeDefined();
      expect(insightAnalysis.birthChartId).toBe(birthChart._id.toString());
      expect(insightAnalysis.userId).toBe(mockUserId);
      expect(insightAnalysis.insights).toBeDefined();
      expect(insightAnalysis.overallSummary).toBeDefined();

      // Verify life theme insights
      const lifeThemeInsights = insightAnalysis.insights.filter(
        insight => insight.type === InsightType.LIFE_THEME
      );

      expect(lifeThemeInsights.length).toBeGreaterThan(0);
      expect(lifeThemeInsights[0].category).toBe(InsightCategory.PERSONALITY);
      expect(lifeThemeInsights[0].severity).toBe('high');
    });

    it('should handle multiple birth charts for a user', async () => {
      // Create multiple birth charts
      const birthChart1 = await birthChartService.createBirthChart(
        mockUserId,
        mockDateTime,
        mockLocation
      ) as IBirthChart & { _id: Types.ObjectId };

      const birthChart2 = await birthChartService.createBirthChart(
        mockUserId,
        {
          ...mockDateTime,
          year: 1991
        },
        mockLocation
      ) as IBirthChart & { _id: Types.ObjectId };

      // Get life themes for all charts
      const lifeThemeAnalyses = await lifeThemeService.getLifeThemesByUserId(mockUserId);

      expect(lifeThemeAnalyses).toBeDefined();
      expect(lifeThemeAnalyses.length).toBe(2);
      lifeThemeAnalyses.forEach(analysis => {
        expect(analysis.userId).toBe(mockUserId);
        expect(analysis.themes).toBeDefined();
      });

      // Get insights for all charts
      const insightAnalyses = await insightService.getInsightsByUserId(mockUserId);

      expect(insightAnalyses).toBeDefined();
      expect(insightAnalyses.length).toBe(2);
      insightAnalyses.forEach(analysis => {
        expect(analysis.userId).toBe(mockUserId);
        expect(analysis.insights).toBeDefined();
      });
    });

    it('should handle invalid birth chart ID', async () => {
      const invalidId = new Types.ObjectId().toString();

      await expect(lifeThemeService.analyzeLifeThemes(invalidId))
        .rejects
        .toThrow(NotFoundError);

      await expect(insightService.analyzeInsights(invalidId))
        .rejects
        .toThrow(NotFoundError);
    });

    it('should cache analysis results', async () => {
      // Create birth chart
      const birthChart = await birthChartService.createBirthChart(
        mockUserId,
        mockDateTime,
        mockLocation
      ) as IBirthChart & { _id: Types.ObjectId };

      // First analysis (should calculate)
      const firstLifeThemeAnalysis = await lifeThemeService.analyzeLifeThemes(birthChart._id.toString());
      const firstInsightAnalysis = await insightService.analyzeInsights(birthChart._id.toString());

      // Second analysis (should use cache)
      const secondLifeThemeAnalysis = await lifeThemeService.analyzeLifeThemes(birthChart._id.toString());
      const secondInsightAnalysis = await insightService.analyzeInsights(birthChart._id.toString());

      expect(firstLifeThemeAnalysis).toEqual(secondLifeThemeAnalysis);
      expect(firstInsightAnalysis).toEqual(secondInsightAnalysis);
      expect(mockCache.get).toHaveBeenCalledTimes(4);
    });

    it('should handle concurrent analysis requests', async () => {
      // Create birth chart
      const birthChart = await birthChartService.createBirthChart(
        mockUserId,
        mockDateTime,
        mockLocation
      ) as IBirthChart & { _id: Types.ObjectId };

      // Perform multiple concurrent analyses
      const [lifeThemeAnalyses, insightAnalyses] = await Promise.all([
        Promise.all(
          Array(5).fill(null).map(() => 
            lifeThemeService.analyzeLifeThemes(birthChart._id.toString())
          )
        ),
        Promise.all(
          Array(5).fill(null).map(() => 
            insightService.analyzeInsights(birthChart._id.toString())
          )
        )
      ]);

      expect(lifeThemeAnalyses.length).toBe(5);
      expect(insightAnalyses.length).toBe(5);

      // Verify all analyses are identical (cached)
      const firstLifeThemeAnalysis = lifeThemeAnalyses[0];
      const firstInsightAnalysis = insightAnalyses[0];

      lifeThemeAnalyses.slice(1).forEach(analysis => {
        expect(analysis).toEqual(firstLifeThemeAnalysis);
      });

      insightAnalyses.slice(1).forEach(analysis => {
        expect(analysis).toEqual(firstInsightAnalysis);
      });
    });
  });
}); 