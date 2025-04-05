// Jest setup file
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { RedisService } from '../infrastructure/redis';
import { Request, Response, NextFunction } from 'express';
import { IUser } from '../models/User';

// Mock Redis implementation
jest.mock('ioredis', () => require('ioredis-mock'));

// Mock authentication middleware
jest.mock('../shared/middleware/auth', () => ({
  authenticate: (req: Request, res: Response, next: NextFunction) => {
    req.user = {
      _id: '507f1f77bcf86cd799439012',
      email: 'test@example.com',
      role: 'user'
    } as IUser;
    next();
  },
  requireRole: (role: string) => (req: Request, res: Response, next: NextFunction) => next()
}));

let mongod: MongoMemoryServer;
let redisService: RedisService;

// Increase timeout for database setup
jest.setTimeout(60000);

beforeAll(async () => {
  try {
    // Start in-memory MongoDB
    mongod = await MongoMemoryServer.create();
    const mongoUri = mongod.getUri();
    
    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    console.log('Connected to in-memory MongoDB');

    // Initialize Redis service with mock configuration
    redisService = new RedisService({
      host: 'localhost',
      port: 6379,
      password: undefined,
      db: 0
    });
    console.log('Connected to mock Redis');

    console.log('Test database environment initialized');
  } catch (error) {
    console.error('Failed to initialize test environment:', error);
    throw error;
  }
});

afterEach(async () => {
  try {
    // Clear MongoDB collections
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
    console.log('MongoDB collections cleared');

    // Clear Redis
    await redisService.client.flushall();
    console.log('Redis cleared');

    console.log('Test databases cleared');
  } catch (error) {
    console.error('Failed to clear test databases:', error);
    throw error;
  }
});

afterAll(async () => {
  try {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');

    // Stop MongoDB memory server
    await mongod.stop();
    console.log('MongoDB memory server stopped');

    // Close Redis connection
    await redisService.disconnect();
    console.log('Redis connection closed');

    console.log('Test environment cleaned up');
  } catch (error) {
    console.error('Failed to cleanup test environment:', error);
    throw error;
  }
}); 