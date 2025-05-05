import { IUser } from '../models/UserModel';

export interface UserRepositoryInterface {
  findByEmail(email: string): Promise<IUser | null>;
  createUser(userData: Omit<IUser, '_id' | 'createdAt' | 'updatedAt'>): Promise<IUser>;
  findById(id: string): Promise<IUser | null>;
  updateUser(id: string, userData: Partial<IUser>): Promise<IUser | null>;
  deleteUser(id: string): Promise<boolean>;
  searchUsers(query: string): Promise<IUser[]>;
  findByEmailVerificationToken(token: string): Promise<IUser | null>;
}