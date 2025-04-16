import { MongoClient, ObjectId } from 'mongodb';
import { IInsight, InsightDocument } from '../../domain/models/Insight';
import { InsightRepositoryInterface } from '../../domain/ports/InsightRepositoryInterface';
import { DatabaseError } from '../../domain/errors';
import { logger } from '../../shared/logger';
import { ICache } from '../../infrastructure/cache/ICache';

export class InsightDatabaseRepository implements InsightRepositoryInterface {
  private readonly collectionName = 'insights';
  private readonly client: MongoClient;

  constructor(private readonly cache: ICache, mongoUri: string) {
    this.client = new MongoClient(mongoUri);
  }

  private getCollection() {
    return this.client.db().collection<InsightDocument>(this.collectionName);
  }

  async createInsight(insightData: Omit<IInsight, '_id' | 'createdAt' | 'updatedAt'>): Promise<IInsight> {
    try {
      const collection = this.getCollection();
      const now = new Date();
      const insight: InsightDocument = {
        ...insightData,
        _id: new ObjectId(),
        createdAt: now,
        updatedAt: now
      };
      await collection.insertOne(insight);
      return insight;
    } catch (error) {
      logger.error('Failed to create insight', { error, insightData });
      throw new DatabaseError('Failed to create insight', { originalError: error });
    }
  }

  async findById(id: string): Promise<IInsight | null> {
    try {
      const collection = this.getCollection();
      return await collection.findOne({ _id: new ObjectId(id) });
    } catch (error) {
      logger.error('Failed to find insight by ID', { error, id });
      throw new DatabaseError('Failed to find insight by ID', { originalError: error });
    }
  }

  async findByUserId(userId: string): Promise<IInsight[]> {
    try {
      const collection = this.getCollection();
      return await collection.find({ userId: new ObjectId(userId) }).toArray();
    } catch (error) {
      logger.error('Failed to find insights by user ID', { error, userId });
      throw new DatabaseError('Failed to find insights by user ID', { originalError: error });
    }
  }

  async findByBirthChartId(birthChartId: string): Promise<IInsight[]> {
    try {
      const collection = this.getCollection();
      return await collection.find({ birthChartId: new ObjectId(birthChartId) }).toArray();
    } catch (error) {
      logger.error('Failed to find insights by birth chart ID', { error, birthChartId });
      throw new DatabaseError('Failed to find insights by birth chart ID', { originalError: error });
    }
  }

  async updateInsight(id: string, insightData: Partial<IInsight>): Promise<IInsight | null> {
    try {
      const collection = this.getCollection();
      const update = {
        ...insightData,
        updatedAt: new Date()
      };
      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: update },
        { returnDocument: 'after' }
      );
      return result;
    } catch (error) {
      logger.error('Failed to update insight', { error, id, insightData });
      throw new DatabaseError('Failed to update insight', { originalError: error });
    }
  }

  async deleteInsight(id: string): Promise<boolean> {
    try {
      const collection = this.getCollection();
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount === 1;
    } catch (error) {
      logger.error('Failed to delete insight', { error, id });
      throw new DatabaseError('Failed to delete insight', { originalError: error });
    }
  }

  async searchInsights(query: string): Promise<IInsight[]> {
    try {
      const collection = this.getCollection();
      return await collection.find({
        $or: [
          { content: { $regex: query, $options: 'i' } },
          { tags: { $regex: query, $options: 'i' } }
        ]
      }).toArray();
    } catch (error) {
      logger.error('Failed to search insights', { error, query });
      throw new DatabaseError('Failed to search insights', { originalError: error });
    }
  }
} 