import { createClient, RedisClientType } from 'redis';
import { logger } from './logger';
import { databaseService } from '../infrastructure/database';

type RedisClient = RedisClientType<Record<string, never>, Record<string, never>, Record<string, never>>;

export async function connectRedis(): Promise<RedisClient> {
  const client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  }) as RedisClient;
  
  await client.connect();
  logger.info('Connected to Redis');
  return client;
}

/**
 * Gracefully closes all database connections (MongoDB and Redis)
 * Used during application shutdown to ensure clean disconnection
 */
export async function closeConnections(): Promise<void> {
  try {
    // Close MongoDB connection
    await databaseService.shutdown();
    logger.info('MongoDB connection closed successfully');
  } catch (error) {
    logger.error('Error closing MongoDB connection:', error);
  }

  try {
    // Close Redis connection
    const redisClient = databaseService.getRedisClient();
    await redisClient.quit();
    logger.info('Redis connection closed successfully');
  } catch (error) {
    logger.error('Error closing Redis connection:', error);
  }
} 