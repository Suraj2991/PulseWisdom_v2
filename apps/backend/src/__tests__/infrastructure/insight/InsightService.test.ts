import { InsightService } from '../../../infrastructure/insight/InsightService';
import { RedisCache } from '../../../infrastructure/cache/RedisCache';
import { BirthChartService } from '../../../infrastructure/birth-chart/BirthChartService';
import { ServiceError } from '../../../types/errors';
import { Insight } from '../../../types/insight.types';

jest.mock('../../../infrastructure/cache/RedisCache');
jest.mock('../../../infrastructure/birth-chart/BirthChartService');

describe('InsightService', () => {
  let insightService: InsightService;
  let mockCache: jest.Mocked<RedisCache>;
  let mockBirthChartService: jest.Mocked<BirthChartService>;

  const mockInsight: Insight = {
    id: 'test-insight',
    type: 'daily',
    content: 'Test insight content',
    birthChartId: 'test-birth-chart',
    date: new Date('2024-01-01T00:00:00Z'),
    aspects: [],
    transits: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCache = new RedisCache('redis://localhost:6379') as jest.Mocked<RedisCache>;
    mockBirthChartService = new BirthChartService(mockCache, {} as any) as jest.Mocked<BirthChartService>;
    insightService = new InsightService(mockCache, mockBirthChartService);
  });

  describe('Insight Generation', () => {
    it('should generate daily insight', async () => {
      const date = new Date('2024-01-01T00:00:00Z');
      
      mockBirthChartService.getBirthChart.mockResolvedValue({
        id: 'test-birth-chart',
        datetime: new Date('1990-01-01T00:00:00Z'),
        location: { latitude: 0, longitude: 0 },
        planets: [],
        houses: [],
        aspects: []
      });
      
      mockBirthChartService.calculateTransits.mockResolvedValue({
        planets: [],
        aspects: []
      });
      
      const insight = await insightService.generateDailyInsight('test-birth-chart', date);
      
      expect(insight).toBeDefined();
      expect(insight.type).toBe('daily');
      expect(insight.birthChartId).toBe('test-birth-chart');
      expect(insight.date).toEqual(date);
      expect(mockBirthChartService.getBirthChart).toHaveBeenCalledWith('test-birth-chart');
      expect(mockBirthChartService.calculateTransits).toHaveBeenCalledWith('test-birth-chart', date);
    });

    it('should handle invalid dates', async () => {
      const invalidDate = new Date('invalid');
      
      await expect(insightService.generateDailyInsight('test-birth-chart', invalidDate))
        .rejects
        .toThrow(ServiceError);
    });
  });

  describe('Insight Retrieval', () => {
    it('should get insight from cache if available', async () => {
      mockCache.getInsight.mockResolvedValue(mockInsight);
      
      const insight = await insightService.getInsight('test-insight');
      
      expect(insight).toEqual(mockInsight);
      expect(mockCache.getInsight).toHaveBeenCalledWith('test-insight');
    });

    it('should handle cache misses', async () => {
      mockCache.getInsight.mockResolvedValue(null);
      
      await expect(insightService.getInsight('non-existent'))
        .rejects
        .toThrow(ServiceError);
    });

    it('should handle cache errors', async () => {
      mockCache.getInsight.mockRejectedValue(new Error('Cache error'));
      
      await expect(insightService.getInsight('test-insight'))
        .rejects
        .toThrow(ServiceError);
    });
  });

  describe('Insight Storage', () => {
    it('should store insight in cache', async () => {
      await insightService.storeInsight('test-insight', mockInsight);
      
      expect(mockCache.setInsight).toHaveBeenCalledWith('test-insight', mockInsight);
    });

    it('should handle storage errors', async () => {
      mockCache.setInsight.mockRejectedValue(new Error('Cache error'));
      
      await expect(insightService.storeInsight('test-insight', mockInsight))
        .rejects
        .toThrow(ServiceError);
    });
  });

  describe('Insight Deletion', () => {
    it('should delete insight from cache', async () => {
      await insightService.deleteInsight('test-insight');
      
      expect(mockCache.deleteInsight).toHaveBeenCalledWith('test-insight');
    });

    it('should handle deletion errors', async () => {
      mockCache.deleteInsight.mockRejectedValue(new Error('Cache error'));
      
      await expect(insightService.deleteInsight('test-insight'))
        .rejects
        .toThrow(ServiceError);
    });
  });

  describe('Batch Operations', () => {
    it('should generate insights for a date range', async () => {
      const startDate = new Date('2024-01-01T00:00:00Z');
      const endDate = new Date('2024-01-07T00:00:00Z');
      
      mockBirthChartService.getBirthChart.mockResolvedValue({
        id: 'test-birth-chart',
        datetime: new Date('1990-01-01T00:00:00Z'),
        location: { latitude: 0, longitude: 0 },
        planets: [],
        houses: [],
        aspects: []
      });
      
      mockBirthChartService.calculateTransits.mockResolvedValue({
        planets: [],
        aspects: []
      });
      
      const insights = await insightService.generateInsightsForDateRange('test-birth-chart', startDate, endDate);
      
      expect(insights).toBeDefined();
      expect(insights.length).toBe(7); // One insight per day
      insights.forEach(insight => {
        expect(insight.type).toBe('daily');
        expect(insight.birthChartId).toBe('test-birth-chart');
      });
    });

    it('should handle invalid date ranges', async () => {
      const startDate = new Date('2024-01-07T00:00:00Z');
      const endDate = new Date('2024-01-01T00:00:00Z');
      
      await expect(insightService.generateInsightsForDateRange('test-birth-chart', startDate, endDate))
        .rejects
        .toThrow(ServiceError);
    });
  });
}); 