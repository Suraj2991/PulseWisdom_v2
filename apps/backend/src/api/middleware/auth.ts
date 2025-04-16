import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../../shared/middleware/errorHandler';
import { IUser } from '../../domain/models/User';
import { config } from '../../shared/config';
import { ICache } from '../../infrastructure/cache/ICache';

interface IUserWithRole extends IUser {
  role: 'user' | 'admin';
  id: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: 'user' | 'admin' };
    }
  }
}

export const createAuthMiddleware = (cache: ICache) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        throw new AppError(401, 'No token provided');
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, config.jwtSecret) as { _id: string; role: 'user' | 'admin' };
      req.user = { id: decoded._id, role: decoded.role };
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requireRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'Authentication required'));
    }

    if (req.user.role !== role) {
      return next(new AppError(403, 'Insufficient permissions'));
    }

    next();
  };
}; 