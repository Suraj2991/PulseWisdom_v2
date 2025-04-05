import { createClient, RedisClientType } from 'redis';
import { ICacheClient } from '../../domain/ports/ICacheClient';

export class RedisClient implements ICacheClient {
  private client: RedisClientType;

  constructor(url: string) {
    this.client = createClient({ url });
    
    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.setEx(key, ttlSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }

  async clear(): Promise<void> {
    const keys = await this.client.keys('*');
    if (keys.length > 0) {
      await this.client.del(keys);
    }
  }

  async keys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern);
  }

  async getPlanetaryPositions(): Promise<any> {
    // Placeholder for specific implementation
    return null;
  }

  async setPlanetaryPositions(positions: any): Promise<void> {
    // Placeholder for specific implementation
  }

  async getBirthChart(id: string): Promise<any> {
    // Placeholder for specific implementation
    return null;
  }

  async setBirthChart(id: string, data: any): Promise<void> {
    // Placeholder for specific implementation
  }

  async deleteBirthChart(id: string): Promise<void> {
    // Placeholder for specific implementation
  }

  async getInsight(id: string): Promise<any> {
    // Placeholder for specific implementation
    return null;
  }

  async setInsight(id: string, data: any): Promise<void> {
    // Placeholder for specific implementation
  }

  async deleteInsight(id: string): Promise<void> {
    // Placeholder for specific implementation
  }

  async clearCache(): Promise<void> {
    await this.clear();
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch {
      return false;
    }
  }
} 