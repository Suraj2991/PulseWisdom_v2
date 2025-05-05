import { ICache } from '../../../infrastructure/cache/ICache';
import { Transit } from '../../transit';

export class TransitCacheManager {
  private readonly CACHE_PREFIX = 'transits:';

  constructor(private readonly cache: ICache) {}

  private getCacheKey(date: Date): string {
    return `${this.CACHE_PREFIX}${date.toISOString().split('T')[0]}`;
  }

  async getTransitsForDate(date: Date): Promise<Transit[] | null> {
    const cached = await this.cache.get<string>(this.getCacheKey(date));
    return cached ? JSON.parse(cached) as Transit[] : null;
  }

  async cacheTransitsForDate(date: Date, transits: Transit[]): Promise<void> {
    await this.cache.set(this.getCacheKey(date), JSON.stringify(transits), 60 * 60 * 24); // 1-day TTL
  }

  async clearTransitsForDate(date: Date): Promise<void> {
    await this.cache.delete(this.getCacheKey(date));
  }
} 