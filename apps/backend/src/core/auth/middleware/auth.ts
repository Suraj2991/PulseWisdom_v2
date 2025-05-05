import { Request, Response, NextFunction } from 'express';
import { AuthError } from '../../../domain/errors';
import { UserRepository } from '../../user/database/UserRepository';
import { DatabaseService } from '../../../infrastructure/database/database';
import { AuthRequest } from '../types/auth.types';
import { UnauthorizedError } from '../../../shared/errors/UnauthorizedError';
import { ITokenVerifier } from '../ports/ITokenVerifier';
import { USER_ROLES } from '../../../shared/constants/user';

type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export const createAuthMiddleware = (tokenVerifier: ITokenVerifier) => {
  const databaseService = DatabaseService.getInstance();
  const userRepository = new UserRepository(databaseService);

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        throw new UnauthorizedError('No token provided');
      }

      const decoded = await tokenVerifier.verifyToken(token);
      if (!decoded) {
        throw new UnauthorizedError('Invalid token');
      }

      const user = await userRepository.findById(decoded.userId);
      if (!user || !user._id) {
        throw new UnauthorizedError('User not found');
      }

      (req as AuthRequest).user = {
        id: user._id.toString(),
        role: user.role as UserRole
      };

      next();
    } catch (error) {
      next(new UnauthorizedError('Authentication failed'));
    }
  };
};

export const requireRole = (role: UserRole) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthError('Authentication required'));
    }

    if (req.user.role !== role) {
      return next(new AuthError('Insufficient permissions'));
    }

    next();
  };
}; 