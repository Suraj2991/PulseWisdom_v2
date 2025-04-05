import Redis from 'ioredis';
import { ICache } from './ICache';
import { ServiceError } from '../../types/errors';
import { CelestialBody } from '../../types/ephemeris.types';

export class RedisCache implements ICache {
  private readonly client: Redis;
  private readonly PLANETARY_POSITIONS_KEY = 'planetary:positions';
  private readonly BIRTH_CHART_KEY_PREFIX = 'birthchart:';
  private readonly INSIGHT_KEY_PREFIX = 'insight:';
  private readonly DEFAULT_TTL = 3600; // 1 hour

  constructor(redisUrl: string) {
    this.client = new Redis(redisUrl);

    this.client.on('error', (error: Error) => {
      console.error('Redis connection error:', error);
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Error getting value from cache:', error);
      throw new ServiceError('Failed to retrieve value from cache');
    }
  }

  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (error) {
      console.error('Error setting value in cache:', error);
      throw new ServiceError('Failed to set value in cache');
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Error deleting key from cache:', error);
      throw new ServiceError('Failed to delete key from cache');
    }
  }

  async clear(): Promise<void> {
    try {
      await this.client.flushall();
    } catch (error) {
      console.error('Error clearing cache:', error);
      throw new ServiceError('Failed to clear cache');
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      return (await this.client.exists(key)) === 1;
    } catch (error) {
      console.error('Error checking key existence in cache:', error);
      throw new ServiceError('Failed to check key existence in cache');
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
      await this.client.setex(
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
      await this.client.setex(
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
      await this.client.setex(
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
      await this.client.flushall();
    } catch (error) {
      console.error('Error clearing cache:', error);
      throw new ServiceError('Failed to clear cache');
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.quit();
    } catch (error) {
      console.error('Error disconnecting from Redis:', error);
      throw new ServiceError('Failed to disconnect from Redis');
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      console.error('Error getting keys from cache:', error);
      throw new ServiceError('Failed to get keys from cache');
    }
  }
} 