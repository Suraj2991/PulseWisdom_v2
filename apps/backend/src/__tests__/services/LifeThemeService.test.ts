import { Types } from 'mongoose';
import { LifeThemeService } from '../../services/LifeThemeService';
import { ICache } from '../../infrastructure/cache/ICache';
import { EphemerisService } from '../../services/EphemerisService';
import { AIService } from '../../services/AIService';
import { LifeThemeAnalysis } from '../../types/lifeTheme.types';
import { IBirthChart } from '../../models/BirthChart';
import { HouseSystem, BirthChart } from '../../types/ephemeris.types';
import { NotFoundError } from '../../types/errors';
import { RedisCache } from '../../infrastructure/cache/RedisCache';
import { LifeTheme } from '../../types/lifeTheme.types';

jest.mock('../../services/EphemerisService');
jest.mock('../../services/AIService');
jest.mock('../../infrastructure/cache/RedisCache');

describe('LifeThemeService', () => {
  let lifeThemeService: LifeThemeService;
  let mockEphemerisService: jest.Mocked<EphemerisService>;
  let mockAIService: jest.Mocked<AIService>;
  let mockCache: jest.Mocked<ICache>;

  const mockBirthChartId = new Types.ObjectId().toString();
  const mockUserId = new Types.ObjectId().toString();

  const mockBirthChart = {
    _id: new Types.ObjectId(mockBirthChartId),
    userId: mockUserId,
    datetime: {
      year: 1990,
      month: 1,
      day: 1,
      hour: 12,
      minute: 0,
      second: 0,
      timezone: 'UTC'
    },
    location: {
      latitude: 0,
      longitude: 0
    },
    houseSystem: HouseSystem.PLACIDUS,
    bodies: [
      { 
        id: 0,
        name: 'Sun',
        longitude: 0,
        latitude: 0,
        speed: 1,
        house: 1,
        sign: 'Aries',
        signLongitude: 0
      },
      {
        id: 1,
        name: 'Moon',
        longitude: 90,
        latitude: 0,
        speed: 1,
        house: 4,
        sign: 'Cancer',
        signLongitude: 0
      }
    ],
    houses: {
      cusps: Array(12).fill(0),
      system: HouseSystem.PLACIDUS
    },
    angles: {
      ascendant: 0,
      mc: 90,
      ic: 270,
      descendant: 180
    },
    createdAt: new Date(),
    updatedAt: new Date()
  } as unknown as IBirthChart;

  const mockCalculatedBirthChart: BirthChart = {
    datetime: {
      year: 1990,
      month: 1,
      day: 1,
      hour: 12,
      minute: 0,
      second: 0,
      timezone: 'UTC'
    },
    location: {
      latitude: 0,
      longitude: 0
    },
    bodies: [
      { 
        id: 0,
        name: 'Sun',
        longitude: 0,
        latitude: 0,
        speed: 1,
        house: 1,
        sign: 'Aries',
        signLongitude: 0
      },
      {
        id: 1,
        name: 'Moon',
        longitude: 90,
        latitude: 0,
        speed: 1,
        house: 4,
        sign: 'Cancer',
        signLongitude: 0
      }
    ],
    houses: {
      cusps: Array(12).fill(0),
      system: HouseSystem.PLACIDUS
    },
    angles: {
      ascendant: 0,
      midheaven: 90,
      descendant: 180,
      imumCoeli: 270
    },
    aspects: [
      {
        body1: 'Sun',
        body2: 'Moon',
        aspect: 'trine',
        orb: 2
      }
    ]
  };

  const mockLifeThemes = {
    birthChartId: mockBirthChartId,
    userId: mockUserId,
    themes: {
      coreIdentity: {
        ascendant: 'Aries',
        sunSign: 'Aries',
        moonSign: 'Cancer',
        description: 'Test description'
      },
      strengths: [
        {
          area: 'Leadership',
          description: 'Natural leader'
        }
      ],
      challenges: [
        {
          area: 'Patience',
          description: 'Impatient',
          growthOpportunities: ['Meditation']
        }
      ],
      patterns: [
        {
          type: 'Cardinal',
          description: 'Initiative',
          planets: ['Sun', 'Moon'],
          houses: [1, 4]
        }
      ],
      lifeThemes: [
        {
          theme: 'Leadership',
          description: 'Natural leader'
        }
      ],
      houseLords: [
        {
          house: 1,
          lord: 'Mars',
          dignity: 'Ruler',
          influence: 'Strong',
          aspects: ['trine']
        }
      ],
      overallSummary: 'Test summary'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
      disconnect: jest.fn(),
      connect: jest.fn(),
      healthCheck: jest.fn()
    } as unknown as jest.Mocked<ICache>;

    mockEphemerisService = {
      getBirthChartById: jest.fn(),
      calculateBirthChart: jest.fn(),
      getBirthChartsByUserId: jest.fn(),
      healthCheck: jest.fn()
    } as unknown as jest.Mocked<EphemerisService>;

    mockAIService = {
      analyzeStrengths: jest.fn(),
      analyzeChallenges: jest.fn(),
      identifyPatterns: jest.fn(),
      analyzeHouseThemes: jest.fn(),
      analyzeHouseLords: jest.fn(),
      generateCoreIdentityDescription: jest.fn(),
      generateOverallSummary: jest.fn(),
      healthCheck: jest.fn()
    } as unknown as jest.Mocked<AIService>;

    lifeThemeService = new LifeThemeService(mockCache, mockEphemerisService, mockAIService);
  });

  describe('analyzeLifeThemes', () => {
    it('should return cached life themes if available', async () => {
      mockCache.get.mockResolvedValue(mockLifeThemes);

      const result = await lifeThemeService.analyzeLifeThemes(mockBirthChartId);

      expect(result).toEqual(mockLifeThemes);
      expect(mockCache.get).toHaveBeenCalledWith(`lifeTheme:${mockBirthChartId}`);
    });

    it('should generate new life themes if not cached', async () => {
      mockCache.get.mockResolvedValue(null);
      mockEphemerisService.getBirthChartById.mockResolvedValue(mockBirthChart);
      mockEphemerisService.calculateBirthChart.mockResolvedValue(mockCalculatedBirthChart);
      mockAIService.analyzeStrengths.mockResolvedValue(mockLifeThemes.themes.strengths);
      mockAIService.analyzeChallenges.mockResolvedValue(mockLifeThemes.themes.challenges);
      mockAIService.identifyPatterns.mockResolvedValue(mockLifeThemes.themes.patterns);
      mockAIService.analyzeHouseThemes.mockResolvedValue(mockLifeThemes.themes.lifeThemes);
      mockAIService.analyzeHouseLords.mockResolvedValue(mockLifeThemes.themes.houseLords);
      mockAIService.generateCoreIdentityDescription.mockResolvedValue(mockLifeThemes.themes.coreIdentity.description);
      mockAIService.generateOverallSummary.mockResolvedValue(mockLifeThemes.themes.overallSummary);

      const result = await lifeThemeService.analyzeLifeThemes(mockBirthChartId);

      expect(result).toBeDefined();
      expect(mockCache.set).toHaveBeenCalledWith(`lifeTheme:${mockBirthChartId}`, expect.any(Object), 3600);
    });

    it('should throw NotFoundError if birth chart not found', async () => {
      mockCache.get.mockResolvedValue(null);
      mockEphemerisService.getBirthChartById.mockResolvedValue(null);

      await expect(lifeThemeService.analyzeLifeThemes(mockBirthChartId))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe('getLifeThemesByUserId', () => {
    it('should return life themes for all user birth charts', async () => {
      mockEphemerisService.getBirthChartsByUserId.mockResolvedValue([mockBirthChart]);
      mockCache.get.mockResolvedValue(mockLifeThemes);

      const result = await lifeThemeService.getLifeThemesByUserId(mockUserId);

      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockLifeThemes);
    });

    it('should return empty array if no birth charts found', async () => {
      mockEphemerisService.getBirthChartsByUserId.mockResolvedValue([]);

      const result = await lifeThemeService.getLifeThemesByUserId(mockUserId);

      expect(result).toBeDefined();
      expect(result).toEqual([]);
    });
  });

  describe('updateLifeThemes', () => {
    const updates: Partial<LifeTheme> = {
      overallSummary: 'Updated summary'
    };

    it('should update life themes and cache', async () => {
      mockCache.get.mockResolvedValue(mockLifeThemes);

      const result = await lifeThemeService.updateLifeThemes(mockBirthChartId, updates);

      expect(result).toBeDefined();
      expect(mockCache.set).toHaveBeenCalledWith(`lifeTheme:${mockBirthChartId}`, expect.any(Object), 3600);
    });
  });
}); 