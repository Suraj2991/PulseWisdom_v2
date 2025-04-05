import { MongoClient, MongoClientOptions } from 'mongodb';
import { createClient, RedisClientType } from 'redis';

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
export async function connectMongoDB() {
  try {
    await mongoClient.connect();
    const db = mongoClient.db(mongoConfig.dbName);
    // Test the connection
    await db.command({ ping: 1 });
    console.log('Connected to MongoDB');
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

export async function connectRedis() {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      // Test the connection
      await redisClient.ping();
    }
    console.log('Connected to Redis');
    return redisClient;
  } catch (error) {
    console.error('Redis connection error:', error);
    throw error;
  }
}

// Graceful shutdown
export async function closeConnections() {
  try {
    await Promise.allSettled([
      mongoClient.close(true),
      redisClient.isOpen ? redisClient.quit() : Promise.resolve()
    ]);
    console.log('Database connections closed');
  } catch (error) {
    console.error('Error closing database connections:', error);
    throw error;
  }
} 