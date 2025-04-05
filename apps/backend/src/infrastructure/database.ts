import mongoose from 'mongoose';
import { Db } from 'mongodb';
import { RedisClientType } from 'redis';
import { connectRedis, closeConnections } from '../config/database';

type RedisClient = RedisClientType<Record<string, never>, Record<string, never>, Record<string, never>>;

export class DatabaseService {
  private static instance: DatabaseService;
  private mongoDb: Db | null = null;
  private redisClient: RedisClient | null = null;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async initialize(): Promise<void> {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    if (!mongoose.connection.db) {
      throw new Error('Failed to get MongoDB database instance');
    }
    this.mongoDb = mongoose.connection.db;
    this.redisClient = await connectRedis() as RedisClient;
    console.log('Database service initialized');
  }

  public getMongoDb(): Db {
    if (!this.mongoDb) {
      throw new Error('MongoDB not initialized');
    }
    return this.mongoDb;
  }

  public getRedisClient(): RedisClient {
    if (!this.redisClient) {
      throw new Error('Redis not initialized');
    }
    return this.redisClient;
  }

  public async shutdown(): Promise<void> {
    await mongoose.connection.close();
    this.mongoDb = null;
    this.redisClient = null;
    await closeConnections();
    console.log('Database service shut down');
  }
}

export const databaseService = DatabaseService.getInstance(); 