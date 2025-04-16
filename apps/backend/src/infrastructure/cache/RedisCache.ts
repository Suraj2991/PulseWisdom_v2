import { createClient, RedisClientType } from 'redis';
import { ICache } from './ICache';
import { ServiceError } from '../../domain/errors';
import { CelestialBody } from '../../domain/types/ephemeris.types';
import { CacheError } from '../../domain/errors';
import { logger } from '../../shared/logger';

export class RedisCache implements ICache {
  private client: RedisClientType;
  private isConnected: boolean = false;
  private readonly PLANETARY_POSITIONS_KEY = 'planetary:positions';
  private readonly BIRTH_CHART_KEY_PREFIX = 'birthchart:';
  private readonly INSIGHT_KEY_PREFIX = 'insight:';
  private readonly DEFAULT_TTL = 3600; // 1 hour

  constructor(url: string) {
    this.client = createClient({ 
      url,
      socket: {
        reconnectStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          logger.warn(`Redis reconnecting in ${delay}ms...`);
          return delay;
        }
      }
    });

    this.client.on('error', (err) => logger.error('Redis client error:', err));
    this.client.on('connect', () => {
      this.isConnected = true;
      logger.info('Redis client connected');
    });
    this.client.on('disconnect', () => {
      this.isConnected = false;
      logger.warn('Redis client disconnected');
    });
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.quit();
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis get error:', { error, key });
      throw error;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.client.setEx(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (error) {
      logger.error('Redis set error:', { error, key });
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      logger.error('Redis delete error:', { error, key });
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      await this.client.flushAll();
    } catch (error) {
      logger.error('Redis clear error:', { error });
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis exists error:', { error, key });
      throw error;
    }
  }

  async getPlanetaryPositions(): Promise<CelestialBody[] | null> {
    try {
      const data = await this.client.get(this.PLANETARY_POSITIONS_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting planetary positions from cache:', error);
      throw new ServiceError('Failed to retrieve planetary positions from cache');
    }
  }

  async setPlanetaryPositions(positions: CelestialBody[]): Promise<void> {
    try {
      await this.client.setEx(
        this.PLANETARY_POSITIONS_KEY,
        this.DEFAULT_TTL,
        JSON.stringify(positions)
      );
    } catch (error) {
      console.error('Error setting planetary positions in cache:', error);
      throw new ServiceError('Failed to cache planetary positions');
    }
  }

  async getBirthChart(id: string): Promise<any | null> {
    try {
      const data = await this.client.get(`${this.BIRTH_CHART_KEY_PREFIX}${id}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting birth chart from cache:', error);
      throw new ServiceError('Failed to retrieve birth chart from cache');
    }
  }

  async setBirthChart(id: string, data: any): Promise<void> {
    try {
      await this.client.setEx(
        `${this.BIRTH_CHART_KEY_PREFIX}${id}`,
        this.DEFAULT_TTL,
        JSON.stringify(data)
      );
    } catch (error) {
      console.error('Error setting birth chart in cache:', error);
      throw new ServiceError('Failed to cache birth chart');
    }
  }

  async deleteBirthChart(id: string): Promise<void> {
    try {
      await this.client.del(`${this.BIRTH_CHART_KEY_PREFIX}${id}`);
    } catch (error) {
      console.error('Error deleting birth chart from cache:', error);
      throw new ServiceError('Failed to delete birth chart from cache');
    }
  }

  async getInsight(id: string): Promise<any | null> {
    try {
      const data = await this.client.get(`${this.INSIGHT_KEY_PREFIX}${id}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting insight from cache:', error);
      throw new ServiceError('Failed to retrieve insight from cache');
    }
  }

  async setInsight(id: string, data: any): Promise<void> {
    try {
      await this.client.setEx(
        `${this.INSIGHT_KEY_PREFIX}${id}`,
        this.DEFAULT_TTL,
        JSON.stringify(data)
      );
    } catch (error) {
      console.error('Error setting insight in cache:', error);
      throw new ServiceError('Failed to cache insight');
    }
  }

  async deleteInsight(id: string): Promise<void> {
    try {
      await this.client.del(`${this.INSIGHT_KEY_PREFIX}${id}`);
    } catch (error) {
      console.error('Error deleting insight from cache:', error);
      throw new ServiceError('Failed to delete insight from cache');
    }
  }

  async clearCache(): Promise<void> {
    try {
      await this.client.flushAll();
    } catch (error) {
      console.error('Error clearing cache:', error);
      throw new ServiceError('Failed to clear cache');
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      logger.error('Redis keys error:', { error, pattern });
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch (error) {
      logger.error('Redis health check failed:', { error });
      return false;
    }
  }
} 