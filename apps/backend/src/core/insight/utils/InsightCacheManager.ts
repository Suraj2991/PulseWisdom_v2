import { ICache } from '../../../infrastructure/cache/ICache';
import { InsightCacheKey, InsightType } from '../../insight';
import { logger } from '../../../shared/logger';

export class InsightCacheManager {
  private readonly CACHE_PREFIX = 'insight:';
  private readonly CACHE_KEYS: Record<InsightType, InsightCacheKey> = {
    [InsightType.DAILY]: InsightCacheKey.DAILY,
    [InsightType.WEEKLY]: InsightCacheKey.WEEKLY_DIGEST,
    [InsightType.WEEKLY_DIGEST]: InsightCacheKey.WEEKLY_DIGEST,
    [InsightType.MONTHLY]: InsightCacheKey.MONTHLY_DIGEST,
    [InsightType.YEARLY]: InsightCacheKey.YEARLY_DIGEST,
    [InsightType.LIFE_THEME]: InsightCacheKey.LIFE_THEME,
    [InsightType.TRANSIT]: InsightCacheKey.TRANSIT,
    [InsightType.CORE_IDENTITY]: InsightCacheKey.CORE_IDENTITY,
    [InsightType.ASPECT]: InsightCacheKey.ASPECT,
    [InsightType.PATTERN]: InsightCacheKey.PATTERN,
    [InsightType.BIRTH_CHART]: InsightCacheKey.BIRTH_CHART,
    [InsightType.NODE_PATH]: InsightCacheKey.NODE_PATH,
    [InsightType.HOUSE_THEMES]: InsightCacheKey.HOUSE_THEMES,
    [InsightType.HOUSE_LORDS]: InsightCacheKey.HOUSE_LORDS,
    [InsightType.THEME_FORECAST]: InsightCacheKey.THEME_FORECAST
  };

  constructor(private readonly cache: ICache) {}

  /**
   * Clears all cached insights for a birth chart
   * @param birthChartId The ID of the birth chart
   */
  async clearAllForChart(birthChartId: string): Promise<void> {
    try {
      logger.info(`[InsightCacheManager] Clearing cached insights for birth chart`, { birthChartId });
      
      // Get all insight types that need to be cleared
      const insightTypes = Object.keys(this.CACHE_KEYS) as InsightType[];
      
      // Clear each type of insight cache for this birth chart
      await Promise.all(
        insightTypes.map(async (type) => {
          const cacheKey = this.getCacheKey(this.CACHE_KEYS[type], birthChartId);
          await this.cache.delete(cacheKey);
        })
      );
      
      // Also clear any direct cache keys used in specific methods
      const directCacheKeys = [
        this.getInsightCacheKey(InsightType.DAILY, birthChartId),
        this.getInsightCacheKey(InsightType.WEEKLY, birthChartId),
        this.getInsightCacheKey(InsightType.THEME_FORECAST, birthChartId)
      ];
      
      await Promise.all(
        directCacheKeys.map(key => this.cache.delete(key))
      );
      
      logger.info(`[InsightCacheManager] Successfully cleared all cached insights for birth chart`, { birthChartId });
    } catch (error) {
      logger.error(`[InsightCacheManager] Failed to clear cached insights for birth chart`, { error, birthChartId });
      // Don't throw the error to avoid disrupting the update flow
    }
  }

  /**
   * Gets a cache key for an insight type and birth chart ID
   * @param insightType The type of insight
   * @param birthChartId The ID of the birth chart
   * @returns A formatted cache key string
   */
  getInsightCacheKey(insightType: InsightType, birthChartId: string): string {
    return `${this.CACHE_PREFIX}${insightType}:${birthChartId}`;
  }

  /**
   * Gets a cache key for an insight cache key type and ID
   * @param type The insight cache key type
   * @param id The ID to use in the cache key
   * @returns A formatted cache key string
   */
  getCacheKey(type: InsightCacheKey, id: string): string {
    return `${this.CACHE_PREFIX}${type}:${id}`;
  }

  /**
   * Gets a value from the cache
   * @param key The cache key
   * @returns The cached value or null if not found
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      return await this.cache.get<T>(key);
    } catch (error) {
      logger.error(`[InsightCacheManager] Failed to get value from cache`, { error, key });
      return null;
    }
  }

  /**
   * Sets a value in the cache
   * @param key The cache key
   * @param value The value to cache
   * @param ttl Time to live in seconds
   */
  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    try {
      await this.cache.set(key, value, ttl);
    } catch (error) {
      logger.error(`[InsightCacheManager] Failed to set value in cache`, { error, key });
      // Don't throw the error to avoid disrupting the flow
    }
  }
} 