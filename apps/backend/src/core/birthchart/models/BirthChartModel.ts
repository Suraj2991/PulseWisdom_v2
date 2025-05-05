import { Collection, ObjectId } from 'mongodb';
import { IBirthChart, BirthChartDocument } from '../types/birthChart.types';
import { databaseService } from '../../../infrastructure/database/database';
import { NotFoundError } from '../../../domain/errors';

export class BirthChartModel {
  private static collection: Collection<IBirthChart>;

  static async initialize(): Promise<void> {
    const db = databaseService.getMongoDb();
    this.collection = db.collection<IBirthChart>('birthCharts');
    await this.collection.createIndex({ userId: 1 });
    await this.collection.createIndex({ createdAt: 1 });
  }

  static async findById(id: string): Promise<BirthChartDocument | null> {
    const result = await this.collection.findOne({ _id: new ObjectId(id) });
    return result as BirthChartDocument | null;
  }

  static async find(query: Partial<IBirthChart>): Promise<BirthChartDocument[]> {
    return this.collection.find(query).toArray() as Promise<BirthChartDocument[]>;
  }

  static async create(data: IBirthChart): Promise<BirthChartDocument> {
    const result = await this.collection.insertOne({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return this.findById(result.insertedId.toString()) as Promise<BirthChartDocument>;
  }

  static async update(id: string, data: Partial<IBirthChart>): Promise<BirthChartDocument> {
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
      throw new NotFoundError(`Birth chart with id ${id} not found`);
    }

    return result.value as BirthChartDocument;
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