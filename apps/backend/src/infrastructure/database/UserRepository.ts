import { MongoClient, ObjectId } from 'mongodb';
import { IUser, UserDocument } from '../../domain/models/User';
import { UserRepositoryInterface } from '../../domain/ports/UserRepositoryInterface';
import { DatabaseError } from '../../domain/errors';
import { logger } from '../../shared/logger';
import { ICache } from '../../infrastructure/cache/ICache';

export class UserRepository implements UserRepositoryInterface {
  private readonly collectionName = 'users';
  private readonly client: MongoClient;

  constructor(private readonly cache: ICache, mongoUri: string) {
    this.client = new MongoClient(mongoUri);
  }

  private getCollection() {
    return this.client.db().collection<UserDocument>(this.collectionName);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    try {
      const collection = this.getCollection();
      return await collection.findOne({ email: email.toLowerCase() });
    } catch (error) {
      logger.error('Failed to find user by email', { error, email });
      throw new DatabaseError('Failed to find user by email', { originalError: error });
    }
  }

  async createUser(userData: Omit<IUser, '_id' | 'createdAt' | 'updatedAt'>): Promise<IUser> {
    try {
      const collection = this.getCollection();
      const now = new Date();
      const user: UserDocument = {
        ...userData,
        _id: new ObjectId(),
        createdAt: now,
        updatedAt: now
      };
      await collection.insertOne(user);
      return user;
    } catch (error) {
      logger.error('Failed to create user', { error, userData });
      throw new DatabaseError('Failed to create user', { originalError: error });
    }
  }

  async findById(id: string): Promise<IUser | null> {
    try {
      const collection = this.getCollection();
      return await collection.findOne({ _id: new ObjectId(id) });
    } catch (error) {
      logger.error('Failed to find user by ID', { error, id });
      throw new DatabaseError('Failed to find user by ID', { originalError: error });
    }
  }

  async updateUser(id: string, userData: Partial<IUser>): Promise<IUser | null> {
    try {
      const collection = this.getCollection();
      const update = {
        ...userData,
        updatedAt: new Date()
      };
      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: update },
        { returnDocument: 'after' }
      );
      return result;
    } catch (error) {
      logger.error('Failed to update user', { error, id, userData });
      throw new DatabaseError('Failed to update user', { originalError: error });
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      const collection = this.getCollection();
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount === 1;
    } catch (error) {
      logger.error('Failed to delete user', { error, id });
      throw new DatabaseError('Failed to delete user', { originalError: error });
    }
  }

  async searchUsers(query: string): Promise<IUser[]> {
    try {
      const collection = this.getCollection();
      return await collection.find({
        $or: [
          { email: { $regex: query, $options: 'i' } },
          { firstName: { $regex: query, $options: 'i' } },
          { lastName: { $regex: query, $options: 'i' } }
        ]
      }).toArray();
    } catch (error) {
      logger.error('Failed to search users', { error, query });
      throw new DatabaseError('Failed to search users', { originalError: error });
    }
  }
} 