import { Collection, ObjectId } from 'mongodb';
import { LifeTheme } from '../../life-theme';
import { databaseService } from '../../../infrastructure/database/database';
import { logger } from '../../../shared/logger';

export class LifeThemeModel {
  private static collection: Collection<LifeTheme>;

  static async initialize(): Promise<void> {
    const db = databaseService.getMongoDb();
    this.collection = db.collection<LifeTheme>('lifeThemes');
    await this.collection.createIndex({ userId: 1 });
    await this.collection.createIndex({ birthChartId: 1 });
    await this.collection.createIndex({ createdAt: 1 });
  }

  static async findById(id: string): Promise<LifeTheme | null> {
    return this.collection.findOne({ _id: new ObjectId(id) }) as Promise<LifeTheme | null>;
  }

  static async find(query: Partial<LifeTheme>): Promise<LifeTheme[]> {
    return this.collection.find(query).toArray() as Promise<LifeTheme[]>;
  }

  static async create(data: Omit<LifeTheme, 'createdAt' | 'updatedAt'>): Promise<LifeTheme> {
    const now = new Date();
    const document = {
      ...data,
      createdAt: now,
      updatedAt: now
    };
    const result = await this.collection.insertOne(document);
    return { ...document, _id: result.insertedId } as LifeTheme;
  }

  static async update(id: string, data: Partial<LifeTheme>): Promise<LifeTheme> {
    const update = {
      $set: {
        ...data,
        updatedAt: new Date()
      }
    };
    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      update,
      { 
        returnDocument: 'after',
        includeResultMetadata: true
      }
    );

    if (!result.value) {
      throw new Error(`Life theme with id ${id} not found`);
    }

    return result.value as LifeTheme;
  }

  static async delete(id: string): Promise<boolean> {
    const result = await this.collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }
}

// Initialize the model when the database is ready
void databaseService.initialize().then(() => {
  void LifeThemeModel.initialize().catch(error => {
    logger.error('Failed to initialize LifeThemeModel', { error });
  });
}); 