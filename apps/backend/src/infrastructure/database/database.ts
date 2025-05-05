import { MongoClient, Db, MongoClientOptions } from 'mongodb';
import { createClient, RedisClientType, RedisClientOptions } from 'redis';
import { logger } from '../../shared/logger';
import { config } from '../../shared/config';
import { ConfigurationError } from '../../domain/errors';

type RedisClient = RedisClientType<Record<string, never>, Record<string, never>, Record<string, never>>;

// MongoDB Configuration
const mongoConfig: MongoClientOptions = {
  maxPoolSize: 10,
  minPoolSize: 1,
  connectTimeoutMS: 5000,
  socketTimeoutMS: 30000,
};

// Redis Configuration
const redisConfig: RedisClientOptions = {
  socket: {
    connectTimeout: 5000,
    reconnectStrategy: (retries: number) => {
      if (retries > 10) return new Error('Max retries reached');
      return Math.min(retries * 50, 2000);
    }
  }
};

export class DatabaseService {
  private static instance: DatabaseService;
  private mongoClient: MongoClient | null = null;
  private mongoDb: Db | null = null;
  private redisClient: RedisClient | null = null;

  private constructor() {
    logger.info('Database service initialized');
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async initialize(): Promise<void> {
    try {
      if (!config.mongoUri) {
        throw new ConfigurationError('MONGODB_URI environment variable is not set');
      }

      // Initialize MongoDB
      this.mongoClient = new MongoClient(config.mongoUri, mongoConfig);
      await this.mongoClient.connect();
      this.mongoDb = this.mongoClient.db();
      logger.info('Connected to MongoDB');

      // Initialize Redis
      await this.connectRedis();
      logger.info('Database connections established successfully');
    } catch (error) {
      logger.error('Failed to initialize database connections', { error });
      throw new ConfigurationError('Failed to initialize database connections');
    }
  }

  private async connectRedis(): Promise<void> {
    if (!config.redisUrl) {
      throw new ConfigurationError('REDIS_URL environment variable is not set');
    }

    this.redisClient = createClient({
      url: config.redisUrl,
      ...redisConfig
    }) as RedisClient;
    
    this.redisClient.on('error', (err) => {
      logger.error('Redis client error:', err);
    });

    await this.redisClient.connect();
    logger.info('Connected to Redis');
  }

  public getMongoDb(): Db {
    if (!this.mongoDb) {
      throw new ConfigurationError('MongoDB is not initialized');
    }
    return this.mongoDb;
  }

  public getRedisClient(): RedisClient {
    if (!this.redisClient) {
      throw new ConfigurationError('Redis client is not initialized');
    }
    return this.redisClient;
  }

  public async shutdown(): Promise<void> {
    try {
      if (this.mongoClient) {
        await this.mongoClient.close();
        logger.info('MongoDB connection closed');
      }

      if (this.redisClient) {
        await this.redisClient.quit();
        logger.info('Redis connection closed');
      }
    } catch (error) {
      logger.error('Error during database shutdown:', error);
      throw error;
    }
  }
}

export const databaseService = DatabaseService.getInstance(); 