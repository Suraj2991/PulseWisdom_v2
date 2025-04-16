import { ICache } from '../../infrastructure/cache/ICache';
import { logger } from '../../shared/logger';

export abstract class BaseService {
  protected constructor(protected readonly cache: ICache) {}

  protected async getFromCache<T>(key: string): Promise<T | null> {
    return this.cache.get<T>(key);
  }

  protected async setInCache<T>(key: string, value: T, ttl: number): Promise<void> {
    await this.cache.set(key, value, ttl);
  }

  protected async deleteFromCache(key: string): Promise<void> {
    await this.cache.delete(key);
  }

  protected logError(error: unknown, context: Record<string, unknown>): void {
    logger.error('Service error', { error, ...context });
  }

  protected logInfo(message: string, context: Record<string, unknown>): void {
    logger.info(message, context);
  }

  protected logDebug(message: string, context: Record<string, unknown>): void {
    logger.debug(message, context);
  }
} 