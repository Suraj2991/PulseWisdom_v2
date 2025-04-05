import Redis from 'ioredis';

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
}

export class RedisService {
  public client: Redis;

  constructor(config: RedisConfig) {
    this.client = new Redis(config);
  }

  async disconnect(): Promise<void> {
    await this.client.disconnect();
  }
} 