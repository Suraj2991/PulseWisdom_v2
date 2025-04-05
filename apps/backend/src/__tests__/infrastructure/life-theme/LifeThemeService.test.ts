import { LifeThemeService } from '../../../infrastructure/life-theme/LifeThemeService';
import { RedisCache } from '../../../infrastructure/cache/RedisCache';
import { BirthChartService } from '../../../infrastructure/birth-chart/BirthChartService';
import { ServiceError } from '../../../types/errors';
import { LifeTheme } from '../../../types/life-theme.types';

jest.mock('../../../infrastructure/cache/RedisCache');
jest.mock('../../../infrastructure/birth-chart/BirthChartService');

describe('LifeThemeService', () => {
  let lifeThemeService: LifeThemeService;
  let mockCache: jest.Mocked<RedisCache>;
  let mockBirthChartService: jest.Mocked<BirthChartService>;

  const mockLifeTheme: LifeTheme = {
    id: 'test-life-theme',
    birthChartId: 'test-birth-chart',
    themes: [
      {
        name: 'Personal Growth',
        description: 'Focus on self-improvement and development',
        strength: 0.8,
        aspects: []
      }
    ],
    dominantPlanets: [
      {
        planet: 'Sun',
        influence: 0.9,
        aspects: []
      }
    ],
    challenges: [
      {
        name: 'Communication',
        description: 'Difficulty expressing thoughts clearly',
        severity: 0.6,
        aspects: []
      }
    ],
    opportunities: [
      {
        name: 'Leadership',
        description: 'Natural ability to guide others',
        potential: 0.7,
        aspects: []
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCache = new RedisCache('redis://localhost:6379') as jest.Mocked<RedisCache>;
    mockBirthChartService = new BirthChartService(mockCache, {} as any) as jest.Mocked<BirthChartService>;
    lifeThemeService = new LifeThemeService(mockCache, mockBirthChartService);
  });

  describe('Life Theme Generation', () => {
    it('should generate life themes from birth chart', async () => {
      mockBirthChartService.getBirthChart.mockResolvedValue({
        id: 'test-birth-chart',
        datetime: new Date('1990-01-01T00:00:00Z'),
        location: { latitude: 0, longitude: 0 },
        planets: [
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
        ],
        houses: [],
        aspects: []
      });
      
      const lifeTheme = await lifeThemeService.generateLifeTheme('test-birth-chart');
      
      expect(lifeTheme).toBeDefined();
      expect(lifeTheme.birthChartId).toBe('test-birth-chart');
      expect(lifeTheme.themes).toBeDefined();
      expect(lifeTheme.dominantPlanets).toBeDefined();
      expect(lifeTheme.challenges).toBeDefined();
      expect(lifeTheme.opportunities).toBeDefined();
      expect(mockBirthChartService.getBirthChart).toHaveBeenCalledWith('test-birth-chart');
    });

    it('should handle non-existent birth chart', async () => {
      mockBirthChartService.getBirthChart.mockRejectedValue(new ServiceError('Birth chart not found'));
      
      await expect(lifeThemeService.generateLifeTheme('non-existent'))
        .rejects
        .toThrow(ServiceError);
    });
  });

  describe('Life Theme Retrieval', () => {
    it('should get life theme from cache if available', async () => {
      mockCache.get.mockResolvedValue(JSON.stringify(mockLifeTheme));
      
      const lifeTheme = await lifeThemeService.getLifeTheme('test-life-theme');
      
      expect(lifeTheme).toEqual(mockLifeTheme);
      expect(mockCache.get).toHaveBeenCalledWith('life-theme:test-life-theme');
    });

    it('should handle cache misses', async () => {
      mockCache.get.mockResolvedValue(null);
      
      await expect(lifeThemeService.getLifeTheme('non-existent'))
        .rejects
        .toThrow(ServiceError);
    });

    it('should handle cache errors', async () => {
      mockCache.get.mockRejectedValue(new Error('Cache error'));
      
      await expect(lifeThemeService.getLifeTheme('test-life-theme'))
        .rejects
        .toThrow(ServiceError);
    });
  });

  describe('Life Theme Storage', () => {
    it('should store life theme in cache', async () => {
      await lifeThemeService.storeLifeTheme('test-life-theme', mockLifeTheme);
      
      expect(mockCache.set).toHaveBeenCalledWith(
        'life-theme:test-life-theme',
        JSON.stringify(mockLifeTheme),
        'EX',
        3600
      );
    });

    it('should handle storage errors', async () => {
      mockCache.set.mockRejectedValue(new Error('Cache error'));
      
      await expect(lifeThemeService.storeLifeTheme('test-life-theme', mockLifeTheme))
        .rejects
        .toThrow(ServiceError);
    });
  });

  describe('Life Theme Deletion', () => {
    it('should delete life theme from cache', async () => {
      await lifeThemeService.deleteLifeTheme('test-life-theme');
      
      expect(mockCache.delete).toHaveBeenCalledWith('life-theme:test-life-theme');
    });

    it('should handle deletion errors', async () => {
      mockCache.delete.mockRejectedValue(new Error('Cache error'));
      
      await expect(lifeThemeService.deleteLifeTheme('test-life-theme'))
        .rejects
        .toThrow(ServiceError);
    });
  });

  describe('Theme Analysis', () => {
    it('should analyze dominant themes', async () => {
      const birthChart = {
        id: 'test-birth-chart',
        datetime: new Date('1990-01-01T00:00:00Z'),
        location: { latitude: 0, longitude: 0 },
        planets: [
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
        ],
        houses: [],
        aspects: []
      };
      
      const themes = await lifeThemeService.analyzeDominantThemes(birthChart);
      
      expect(themes).toBeDefined();
      expect(themes.length).toBeGreaterThan(0);
      themes.forEach(theme => {
        expect(theme).toHaveProperty('name');
        expect(theme).toHaveProperty('description');
        expect(theme).toHaveProperty('strength');
      });
    });

    it('should analyze planetary influences', async () => {
      const birthChart = {
        id: 'test-birth-chart',
        datetime: new Date('1990-01-01T00:00:00Z'),
        location: { latitude: 0, longitude: 0 },
        planets: [
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
        ],
        houses: [],
        aspects: []
      };
      
      const influences = await lifeThemeService.analyzePlanetaryInfluences(birthChart);
      
      expect(influences).toBeDefined();
      expect(influences.length).toBeGreaterThan(0);
      influences.forEach(influence => {
        expect(influence).toHaveProperty('planet');
        expect(influence).toHaveProperty('influence');
      });
    });
  });
}); 