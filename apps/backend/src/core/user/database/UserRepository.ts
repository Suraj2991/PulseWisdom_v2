import { ObjectId, WithId, Filter, UpdateFilter } from 'mongodb';
import { IUser, UserDocument } from '../models/UserModel';
import { UserRepositoryInterface } from '../ports/UserRepositoryInterface';
import { DatabaseError, ValidationError } from '../../../domain/errors';
import { logger } from '../../../shared/logger';
import { DatabaseService } from '../../../infrastructure/database/database';

export class UserRepository implements UserRepositoryInterface {
  private readonly collectionName = 'users';

  constructor(
    private readonly databaseService: DatabaseService
  ) {}

  private getCollection() {
    return this.databaseService.getMongoDb().collection<UserDocument>(this.collectionName);
  }

  private validateObjectId(id: string): ObjectId {
    try {
      return new ObjectId(id);
    } catch (error) {
      throw new ValidationError('Invalid user ID format');
    }
  }

  async findByEmail(email: string): Promise<IUser | null> {
    try {
      const collection = this.getCollection();
      const user = await collection.findOne({ email: email.toLowerCase() } as Filter<UserDocument>);
      return user ? this.convertToIUser(user) : null;
    } catch (error) {
      logger.error('Failed to find user by email', { error, email });
      throw new DatabaseError('Failed to find user by email', { originalError: error });
    }
  }

  async createUser(userData: Omit<IUser, '_id' | 'createdAt' | 'updatedAt'>): Promise<IUser> {
    try {
      const collection = this.getCollection();
      const now = new Date();
      const user: Omit<UserDocument, '_id'> = {
        ...userData,
        createdAt: now,
        updatedAt: now
      };
      const result = await collection.insertOne(user as UserDocument);
      const createdUser = await collection.findOne({ _id: result.insertedId } as Filter<UserDocument>);
      if (!createdUser) {
        throw new DatabaseError('Failed to retrieve created user');
      }
      return this.convertToIUser(createdUser);
    } catch (error) {
      logger.error('Failed to create user', { error, userData });
      throw new DatabaseError('Failed to create user', { originalError: error });
    }
  }

  async findById(id: string): Promise<IUser | null> {
    try {
      const collection = this.getCollection();
      const objectId = this.validateObjectId(id);
      const user = await collection.findOne({ _id: objectId } as Filter<UserDocument>);
      return user ? this.convertToIUser(user) : null;
    } catch (error) {
      logger.error('Failed to find user by ID', { error, id });
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError('Failed to find user by ID', { originalError: error });
    }
  }

  async updateUser(id: string, userData: Partial<IUser>): Promise<IUser | null> {
    try {
      const collection = this.getCollection();
      const objectId = this.validateObjectId(id);
      const update = {
        ...userData,
        updatedAt: new Date()
      };
      const result = await collection.findOneAndUpdate(
        { _id: objectId } as Filter<UserDocument>,
        { $set: update as UpdateFilter<UserDocument> },
        { returnDocument: 'after' }
      );
      return result ? this.convertToIUser(result) : null;
    } catch (error) {
      logger.error('Failed to update user', { error, id, userData });
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError('Failed to update user', { originalError: error });
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      const collection = this.getCollection();
      const objectId = this.validateObjectId(id);
      const result = await collection.deleteOne({ _id: objectId } as Filter<UserDocument>);
      return result.deletedCount === 1;
    } catch (error) {
      logger.error('Failed to delete user', { error, id });
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError('Failed to delete user', { originalError: error });
    }
  }

  async searchUsers(query: string): Promise<IUser[]> {
    try {
      const collection = this.getCollection();
      const users = await collection.find({
        $or: [
          { email: { $regex: query, $options: 'i' } },
          { firstName: { $regex: query, $options: 'i' } },
          { lastName: { $regex: query, $options: 'i' } }
        ]
      }).toArray();
      return users.map(user => this.convertToIUser(user));
    } catch (error) {
      logger.error('Failed to search users', { error, query });
      throw new DatabaseError('Failed to search users', { originalError: error });
    }
  }

  async findByEmailVerificationToken(token: string): Promise<IUser | null> {
    try {
      const collection = this.getCollection();
      const user = await collection.findOne({ emailVerificationToken: token } as Filter<UserDocument>);
      return user ? this.convertToIUser(user) : null;
    } catch (error) {
      logger.error('Failed to find user by email verification token', { error, token });
      throw new DatabaseError('Failed to find user by email verification token', { originalError: error });
    }
  }

  private convertToIUser(user: WithId<UserDocument>): IUser {
    const { _id, ...rest } = user;
    return {
      ...rest,
      _id
    };
  }
} 