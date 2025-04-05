import { databaseService } from '../../infrastructure/database';

describe('DatabaseService', () => {
  it('should initialize MongoDB connection', () => {
    const db = databaseService.getMongoDb();
    expect(db).toBeDefined();
  });

  it('should initialize Redis connection', () => {
    const redis = databaseService.getRedisClient();
    expect(redis).toBeDefined();
  });

  it('should throw error when accessing uninitialized MongoDB', async () => {
    await databaseService.shutdown();
    expect(() => databaseService.getMongoDb()).toThrow('MongoDB not initialized');
  });

  it('should throw error when accessing uninitialized Redis', async () => {
    await databaseService.shutdown();
    expect(() => databaseService.getRedisClient()).toThrow('Redis not initialized');
  });

  it('should handle graceful shutdown', async () => {
    await databaseService.shutdown();
    expect(() => databaseService.getMongoDb()).toThrow('MongoDB not initialized');
    expect(() => databaseService.getRedisClient()).toThrow('Redis not initialized');
  });
}); 