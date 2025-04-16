import { Collection, Db, ObjectId, WithId } from 'mongodb';
import { IBirthChart, BirthChartDocument } from '../../../domain/models/BirthChart';
import { databaseService } from '../../database';

export class BirthChartModel {
  private static collection: Collection<IBirthChart>;

  static async initialize(): Promise<void> {
    const db = databaseService.getMongoDb();
    this.collection = db.collection<IBirthChart>('birthCharts');
    await this.collection.createIndex({ userId: 1 });
    await this.collection.createIndex({ createdAt: 1 });
  }

  static async findById(id: string): Promise<BirthChartDocument | null> {
    return this.collection.findOne({ _id: new ObjectId(id) }) as Promise<BirthChartDocument | null>;
  }

  static async find(query: Partial<IBirthChart>): Promise<BirthChartDocument[]> {
    return this.collection.find(query).toArray() as Promise<BirthChartDocument[]>;
  }

  static async create(data: Omit<IBirthChart, 'createdAt' | 'updatedAt'>): Promise<BirthChartDocument> {
    const now = new Date();
    const document = {
      ...data,
      createdAt: now,
      updatedAt: now
    };
    const result = await this.collection.insertOne(document);
    return { ...document, _id: result.insertedId } as BirthChartDocument;
  }

  static async update(id: string, data: Partial<IBirthChart>): Promise<BirthChartDocument | null> {
    const update = {
      $set: {
        ...data,
        updatedAt: new Date()
      }
    };
    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      update,
      { returnDocument: 'after' }
    );
    return result as BirthChartDocument | null;
  }

  static async delete(id: string): Promise<boolean> {
    const result = await this.collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }
}

// Initialize the model when the database is ready
databaseService.initialize().then(() => {
  BirthChartModel.initialize();
}); 