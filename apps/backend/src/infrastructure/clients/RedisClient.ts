import { Redis } from 'ioredis';
import { ICache } from '../cache/ICache';
import { CelestialBody } from '../../domain/types/ephemeris.types';

export class RedisClient implements ICache {
  private redis: Redis;

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);
  }

  async connect(): Promise<void> {
    await this.redis.connect();
  }

  async disconnect(): Promise<void> {
    await this.redis.quit();
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.redis.get(key);
    try {
      return raw ? JSON.parse(raw) as T : null;
    } catch (e) {
      console.error(`Failed to parse cache value for key ${key}:`, e);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number = 3600): Promise<void> {
    const serialized = JSON.stringify(value);
    await this.redis.set(key, serialized, 'EX', ttlSeconds);
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async clear(): Promise<void> {
    await this.redis.flushdb();
  }

  async keys(pattern: string): Promise<string[]> {
    return await this.redis.keys(pattern);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return result === 1;
  }

  async getPlanetaryPositions(): Promise<CelestialBody[] | null> {
    return this.get<CelestialBody[]>('planetary_positions');
  }

  async setPlanetaryPositions(positions: CelestialBody[]): Promise<void> {
    await this.set('planetary_positions', positions);
  }

  async getBirthChart(id: string): Promise<any | null> {
    return this.get(`birth_chart:${id}`);
  }

  async setBirthChart(id: string, data: any): Promise<void> {
    await this.set(`birth_chart:${id}`, data);
  }

  async deleteBirthChart(id: string): Promise<void> {
    await this.delete(`birth_chart:${id}`);
  }

  async getInsight(id: string): Promise<any | null> {
    return this.get(`insight:${id}`);
  }

  async setInsight(id: string, data: any): Promise<void> {
    await this.set(`insight:${id}`, data);
  }

  async deleteInsight(id: string): Promise<void> {
    await this.delete(`insight:${id}`);
  }

  async clearCache(): Promise<void> {
    await this.clear();
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch {
      return false;
    }
  }
} 