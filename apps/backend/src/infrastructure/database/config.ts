import { MongoClient, MongoClientOptions } from 'mongodb';
import { createClient, RedisClientType } from 'redis';
import { config } from '../../config';
import { logger } from '../../shared/logger';

// MongoDB Configuration
export const mongoConfig = {
  url: process.env.MONGODB_URI || 'mongodb://localhost:27017',
  dbName: process.env.MONGODB_DB_NAME || 'pulsewisdom',
  options: {
    maxPoolSize: 10,
    minPoolSize: 1,
    connectTimeoutMS: 5000,
    socketTimeoutMS: 30000,
  } as MongoClientOptions,
};

// Redis Configuration
export const redisConfig = {
  url: process.env.REDIS_URI || 'redis://localhost:6379',
  socket: {
    connectTimeout: 5000,
    reconnectStrategy: (retries: number) => {
      if (retries > 10) return new Error('Max retries reached');
      return Math.min(retries * 50, 2000);
    }
  }
};

// MongoDB Client
export const mongoClient = new MongoClient(mongoConfig.url, mongoConfig.options);

// Redis Client
export const redisClient = createClient(redisConfig) as RedisClientType;

// Database connection functions
export const connectMongoDB = async (): Promise<void> => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    await mongoClient.connect();
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    throw error;
  }
};

export const connectRedis = async (): Promise<ReturnType<typeof createClient>> => {
  try {
    if (!process.env.REDIS_URL) {
      throw new Error('REDIS_URL environment variable is not set');
    }

    const client = createClient({ url: process.env.REDIS_URL });
    await client.connect();
    logger.info('Connected to Redis');

    client.on('error', (err) => {
      logger.error('Redis client error:', err);
    });

    return client;
  } catch (error) {
    logger.error('Redis connection error:', error);
    throw error;
  }
};

// Graceful shutdown
export const closeConnections = async (): Promise<void> => {
  try {
    await mongoClient.close();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error('Error closing MongoDB connection:', error);
  }
}; 