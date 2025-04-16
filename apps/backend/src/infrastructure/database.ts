import { MongoClient, Db } from 'mongodb';
import { RedisClientType } from 'redis';
import { connectRedis, closeConnections } from '../shared/database';
import { logger } from '../shared/logger';
import { config } from '../shared/config';
import { ConfigurationError } from '../domain/errors';

type RedisClient = RedisClientType<Record<string, never>, Record<string, never>, Record<string, never>>;

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
      this.mongoClient = new MongoClient(config.mongoUri);
      await this.mongoClient.connect();
      this.mongoDb = this.mongoClient.db();
      this.redisClient = await connectRedis() as RedisClient;
      
      logger.info('Database connections established successfully');
    } catch (error) {
      logger.error('Failed to initialize database connections', { error });
      throw new ConfigurationError('Failed to initialize database connections');
    }
  }

  public getMongoDb(): Db {
    if (!this.mongoDb) {
      throw new ConfigurationError('MongoDB not initialized');
    }
    return this.mongoDb;
  }

  public getRedisClient(): RedisClient {
    if (!this.redisClient) {
      throw new ConfigurationError('Redis not initialized');
    }
    return this.redisClient;
  }

  public async shutdown(): Promise<void> {
    try {
      if (this.mongoClient) {
        await this.mongoClient.close();
        logger.info('MongoDB connection closed');
      }
      await closeConnections();
      logger.info('Redis connection closed');
    } catch (error) {
      logger.error('Error during database shutdown', { error });
      throw new ConfigurationError('Failed to close database connections');
    }
  }
}

export const databaseService = DatabaseService.getInstance(); 