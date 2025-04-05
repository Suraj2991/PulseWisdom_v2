import { InsightService } from '../../services/InsightService';
import { ICache } from '../../infrastructure/cache/ICache';
import { EphemerisService } from '../../services/EphemerisService';
import { LifeThemeService } from '../../services/LifeThemeService';
import { InsightAnalysis, InsightType, InsightCategory } from '../../types/insight.types';
import { Types } from 'mongoose';
import { IBirthChart } from '../../models/BirthChart';
import { LifeThemeAnalysis } from '../../types/lifeTheme.types';
import { HouseSystem } from '../../types/ephemeris.types';
import { TransitAnalysis } from '../../types/transit.types';

jest.mock('../../services/EphemerisService');
jest.mock('../../services/LifeThemeService');

describe('InsightService', () => {
  let service: InsightService;
  let mockCache: jest.Mocked<ICache>;
  let mockEphemerisService: jest.Mocked<EphemerisService>;
  let mockLifeThemeService: jest.Mocked<LifeThemeService>;
  const mockBirthChartId = new Types.ObjectId().toString();

  const mockBirthChart = {
    _id: new Types.ObjectId(mockBirthChartId),
    id: new Types.ObjectId(mockBirthChartId),
    userId: new Types.ObjectId(),
    datetime: {
      year: 1990,
      month: 1,
      day: 1,
      hour: 0,
      minute: 0,
      second: 0,
      timezone: 'UTC'
    },
    location: { latitude: 0, longitude: 0 },
    houseSystem: HouseSystem.PLACIDUS,
    bodies: [
      { id: 0, name: 'Sun', longitude: 0, latitude: 0, speed: 1, house: 1, sign: 'Aries', signLongitude: 0 },
      { id: 1, name: 'Moon', longitude: 90, latitude: 0, speed: 1, house: 4, sign: 'Cancer', signLongitude: 0 }
    ],
    angles: {
      ascendant: 0,
      mc: 90,
      ic: 270,
      descendant: 180
    },
    houses: {
      cusps: Array(12).fill(0),
      system: HouseSystem.PLACIDUS
    },
    createdAt: new Date(),
    updatedAt: new Date()
  } as unknown as IBirthChart;

  const mockLifeThemes = {
    birthChartId: mockBirthChartId,
    userId: mockBirthChart.userId.toString(),
    themes: {
      coreIdentity: {
        description: 'Test core identity'
      },
      strengths: [
        {
          area: 'Leadership',
          description: 'Natural leadership abilities',
          supportingAspects: ['Strong Sun placement']
        }
      ],
      challenges: [
        {
          area: 'Emotional Balance',
          description: 'Need for emotional balance',
          growthOpportunities: ['Practice mindfulness']
        }
      ]
    },
    createdAt: new Date(),
    updatedAt: new Date()
  } as unknown as LifeThemeAnalysis;

  const mockTransits: TransitAnalysis = {
    transits: [{
      transitPlanet: 'Sun',
      natalPlanet: 'Moon',
      aspectType: 'conjunction',
      orb: 2,
      isApplying: true,
      strength: 'high',
      angle: 0
    }],
    windows: [],
    date: {
      year: 2024,
      month: 1,
      day: 1,
      hour: 0,
      minute: 0,
      second: 0,
      timezone: 'UTC'
    }
  };

  beforeEach(() => {
    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn()
    } as unknown as jest.Mocked<ICache>;

    mockEphemerisService = {
      getBirthChartById: jest.fn(),
      getBirthChartsByUserId: jest.fn(),
      analyzeTransits: jest.fn()
    } as unknown as jest.Mocked<EphemerisService>;

    mockLifeThemeService = {
      analyzeLifeThemes: jest.fn()
    } as unknown as jest.Mocked<LifeThemeService>;

    service = new InsightService(
      mockCache,
      mockEphemerisService,
      mockLifeThemeService
    );
  });

  describe('analyzeInsights', () => {
    it('should return cached insights if available', async () => {
      const mockAnalysis: InsightAnalysis = {
        birthChartId: mockBirthChartId,
        userId: mockBirthChart.userId.toString(),
        insights: [],
        overallSummary: 'Test summary',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockCache.get.mockResolvedValue(mockAnalysis);

      const result = await service.analyzeInsights(mockBirthChartId);

      expect(result).toEqual(mockAnalysis);
      expect(mockCache.get).toHaveBeenCalledWith(`insights:${mockBirthChartId}`);
    });

    it('should generate new insights if not in cache', async () => {
      mockCache.get.mockResolvedValue(null);
      mockEphemerisService.getBirthChartById.mockResolvedValue(mockBirthChart);
      mockLifeThemeService.analyzeLifeThemes.mockResolvedValue(mockLifeThemes);
      mockEphemerisService.analyzeTransits.mockResolvedValue(mockTransits);

      const result = await service.analyzeInsights(mockBirthChartId);

      expect(result).toBeDefined();
      expect(result.birthChartId).toBe(mockBirthChartId);
      expect(result.insights.length).toBeGreaterThan(0);
      expect(mockCache.set).toHaveBeenCalledWith(`insights:${mockBirthChartId}`, expect.any(Object), 3600);
    });

    it('should throw NotFoundError if birth chart not found', async () => {
      mockCache.get.mockResolvedValue(null);
      mockEphemerisService.getBirthChartById.mockResolvedValue(null);

      await expect(service.analyzeInsights(mockBirthChartId))
        .rejects.toThrow('Birth chart not found');
    });

    it('should handle cache errors gracefully', async () => {
      mockCache.get.mockRejectedValue(new Error('Cache error'));
      mockEphemerisService.getBirthChartById.mockResolvedValue(mockBirthChart);
      mockLifeThemeService.analyzeLifeThemes.mockResolvedValue(mockLifeThemes);
      mockEphemerisService.analyzeTransits.mockResolvedValue(mockTransits);

      const result = await service.analyzeInsights(mockBirthChartId);
      expect(result).toBeDefined();
      expect(result.insights).toBeDefined();
      expect(result.birthChartId).toBe(mockBirthChartId);
    });
  });

  describe('getInsightsByUserId', () => {
    it('should return insights for all birth charts of a user', async () => {
      const userId = mockBirthChart.userId.toString();
      mockEphemerisService.getBirthChartsByUserId.mockResolvedValue([mockBirthChart]);
      mockCache.get.mockResolvedValue(null);
      mockEphemerisService.getBirthChartById.mockResolvedValue(mockBirthChart);
      mockLifeThemeService.analyzeLifeThemes.mockResolvedValue(mockLifeThemes);
      mockEphemerisService.analyzeTransits.mockResolvedValue(mockTransits);

      const result = await service.getInsightsByUserId(userId);

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].userId).toBe(userId);
    });

    it('should handle empty birth charts list', async () => {
      const userId = mockBirthChart.userId.toString();
      mockEphemerisService.getBirthChartsByUserId.mockResolvedValue([]);

      const result = await service.getInsightsByUserId(userId);
      expect(result).toEqual([]);
    });
  });

  describe('getInsightsByCategory', () => {
    it('should return insights filtered by category', async () => {
      mockCache.get.mockResolvedValue(null);
      mockEphemerisService.getBirthChartById.mockResolvedValue(mockBirthChart);
      mockLifeThemeService.analyzeLifeThemes.mockResolvedValue(mockLifeThemes);
      mockEphemerisService.analyzeTransits.mockResolvedValue(mockTransits);

      const result = await service.getInsightsByCategory(mockBirthChartId, InsightCategory.PERSONALITY);

      expect(result).toBeDefined();
      expect(result.every(insight => insight.category === InsightCategory.PERSONALITY)).toBe(true);
    });
  });

  describe('updateInsights', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should update insights with new data', async () => {
      const mockAnalysis: InsightAnalysis = {
        birthChartId: mockBirthChartId,
        userId: mockBirthChart.userId.toString(),
        insights: [],
        overallSummary: 'Test summary',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockCache.get.mockResolvedValue(mockAnalysis);
      mockCache.set.mockResolvedValue(undefined);

      const updates = {
        overallSummary: 'Updated summary'
      };

      // Advance timer by 1 second
      jest.advanceTimersByTime(1000);

      const result = await service.updateInsights(mockBirthChartId, updates);

      expect(result.overallSummary).toBe('Updated summary');
      expect(result.updatedAt.getTime()).toBeGreaterThan(mockAnalysis.updatedAt.getTime());
      expect(mockCache.set).toHaveBeenCalledWith(
        `insights:${mockBirthChartId}`,
        expect.any(Object),
        3600
      );
    });
  });

  describe('getBirthChartInsights', () => {
    it('should return only birth chart insights', async () => {
      mockCache.get.mockResolvedValue(null);
      mockEphemerisService.getBirthChartById.mockResolvedValue(mockBirthChart);
      mockLifeThemeService.analyzeLifeThemes.mockResolvedValue(mockLifeThemes);
      mockEphemerisService.analyzeTransits.mockResolvedValue(mockTransits);

      const result = await service.getBirthChartInsights(mockBirthChartId);

      expect(result).toBeDefined();
      expect(result.every(insight => insight.type === InsightType.BIRTH_CHART)).toBe(true);
    });
  });

  describe('getInsightsByDateRange', () => {
    it('should return insights within the specified date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      mockCache.get.mockResolvedValue(null);
      mockEphemerisService.getBirthChartById.mockResolvedValue(mockBirthChart);
      mockLifeThemeService.analyzeLifeThemes.mockResolvedValue(mockLifeThemes);
      mockEphemerisService.analyzeTransits.mockResolvedValue(mockTransits);

      const result = await service.getInsightsByDateRange(mockBirthChartId, startDate, endDate);

      expect(result).toBeDefined();
      expect(result.every(insight => {
        const insightDate = insight.date;
        return insightDate >= startDate && insightDate <= endDate;
      })).toBe(true);
    });
  });

  describe('getTransitInsights', () => {
    it('should return only transit insights', async () => {
      mockCache.get.mockResolvedValue(null);
      mockEphemerisService.getBirthChartById.mockResolvedValue(mockBirthChart);
      mockLifeThemeService.analyzeLifeThemes.mockResolvedValue(mockLifeThemes);
      mockEphemerisService.analyzeTransits.mockResolvedValue(mockTransits);

      const result = await service.getTransitInsights(mockBirthChartId);

      expect(result).toBeDefined();
      expect(result.every(insight => insight.type === InsightType.TRANSIT)).toBe(true);
    });
  });
}); 