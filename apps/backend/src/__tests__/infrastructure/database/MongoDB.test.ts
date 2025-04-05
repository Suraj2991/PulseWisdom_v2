import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { DatabaseError } from '../../../types/errors';

describe('MongoDB Connection', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear all collections before each test
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  describe('Connection Management', () => {
    it('should connect to MongoDB successfully', async () => {
      expect(mongoose.connection.readyState).toBe(1); // 1 means connected
    });

    it('should handle connection errors', async () => {
      const invalidUri = 'mongodb://invalid:27017/test';
      await expect(mongoose.connect(invalidUri)).rejects.toThrow();
    });

    it('should handle disconnection', async () => {
      await mongoose.disconnect();
      expect(mongoose.connection.readyState).toBe(0); // 0 means disconnected
      await mongoose.connect(mongoServer.getUri()); // Reconnect for other tests
    });
  });

  describe('Collection Operations', () => {
    it('should create and read documents', async () => {
      const TestSchema = new mongoose.Schema({
        name: String,
        value: Number
      });
      const TestModel = mongoose.model('Test', TestSchema);

      const doc = await TestModel.create({ name: 'test', value: 123 });
      const found = await TestModel.findById(doc._id);
      
      expect(found).toBeTruthy();
      expect(found?.name).toBe('test');
      expect(found?.value).toBe(123);
    });

    it('should update documents', async () => {
      const TestSchema = new mongoose.Schema({
        name: String,
        value: Number
      });
      const TestModel = mongoose.model('Test', TestSchema);

      const doc = await TestModel.create({ name: 'test', value: 123 });
      await TestModel.findByIdAndUpdate(doc._id, { value: 456 });
      const updated = await TestModel.findById(doc._id);
      
      expect(updated?.value).toBe(456);
    });

    it('should delete documents', async () => {
      const TestSchema = new mongoose.Schema({
        name: String,
        value: Number
      });
      const TestModel = mongoose.model('Test', TestSchema);

      const doc = await TestModel.create({ name: 'test', value: 123 });
      await TestModel.findByIdAndDelete(doc._id);
      const deleted = await TestModel.findById(doc._id);
      
      expect(deleted).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors', async () => {
      const TestSchema = new mongoose.Schema({
        name: { type: String, required: true },
        value: { type: Number, min: 0 }
      });
      const TestModel = mongoose.model('Test', TestSchema);

      await expect(TestModel.create({ value: -1 })).rejects.toThrow();
    });

    it('should handle duplicate key errors', async () => {
      const TestSchema = new mongoose.Schema({
        name: { type: String, unique: true }
      });
      const TestModel = mongoose.model('Test', TestSchema);

      await TestModel.create({ name: 'test' });
      await expect(TestModel.create({ name: 'test' })).rejects.toThrow();
    });
  });

  describe('Transaction Support', () => {
    it('should support transactions', async () => {
      const TestSchema = new mongoose.Schema({
        name: String,
        value: Number
      });
      const TestModel = mongoose.model('Test', TestSchema);

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        await TestModel.create([{ name: 'test1', value: 1 }], { session });
        await TestModel.create([{ name: 'test2', value: 2 }], { session });
        await session.commitTransaction();
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }

      const count = await TestModel.countDocuments();
      expect(count).toBe(2);
    });

    it('should rollback transactions on error', async () => {
      const TestSchema = new mongoose.Schema({
        name: String,
        value: Number
      });
      const TestModel = mongoose.model('Test', TestSchema);

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        await TestModel.create([{ name: 'test1', value: 1 }], { session });
        throw new Error('Test error');
      } catch (error) {
        await session.abortTransaction();
      } finally {
        session.endSession();
      }

      const count = await TestModel.countDocuments();
      expect(count).toBe(0);
    });
  });
}); 