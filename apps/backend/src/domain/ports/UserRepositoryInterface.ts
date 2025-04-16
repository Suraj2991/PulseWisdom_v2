import { IUser } from '../models/User';

export interface UserRepositoryInterface {
  findByEmail(email: string): Promise<IUser | null>;
  createUser(userData: Omit<IUser, '_id' | 'createdAt' | 'updatedAt'>): Promise<IUser>;
  // Add other method signatures as needed
} 