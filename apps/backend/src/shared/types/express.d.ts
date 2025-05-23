import { IUser } from '../domain/models/User';

declare global {
  namespace Express {
    interface Request {
      id?: string;
      user?: {
        id: string;
        role: 'user' | 'admin';
      };
    }
  }
} 