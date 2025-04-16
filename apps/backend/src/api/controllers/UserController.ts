import { Request, Response, NextFunction } from 'express';
import { UserService } from '../../application/services/UserService';
import { ValidationError, NotFoundError, AuthError } from '../../domain/errors';
import { IUser } from '../../domain/models/User';

export class UserController {
  constructor(private userService: UserService) {}

  /**
   * Create a new user
   */
  public createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.userService.createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get user by ID
   */
  public getUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const user = await this.userService.getUserById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }
      res.json(user);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get user by email
   */
  public getUserByEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.params;
      
      if (!email) {
        throw new ValidationError('Email is required');
      }

      const user = await this.userService.getUserByEmail(email);
      if (!user) {
        throw new NotFoundError('User not found');
      }
      res.json(user);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update user profile
   */
  public updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const updateData = req.body;

      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const user = await this.userService.updateUser(userId, updateData);
      res.json(user);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update user preferences
   */
  public updatePreferences = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const preferences = req.body;

      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const user = await this.userService.updateUserPreferences(userId, preferences);
      res.json(user);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete user account
   */
  public deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;

      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      await this.userService.deleteUser(userId);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get user's birth charts
   */
  public getUserBirthCharts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;

      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const birthCharts = await this.userService.getUserBirthCharts(userId);
      res.json(birthCharts);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Search users
   */
  public searchUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { query, limit } = req.query;
      const users = await this.userService.searchUsers(query as string, limit as number | undefined);
      res.json(users);
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ 
          status: 'error',
          message: error.message 
        });
        return;
      }
      next(error);
    }
  };

  /**
   * Validate user password
   */
  public validatePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const { password } = req.body;

      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const user = await this.userService.getUserById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      const isValid = await this.userService.validatePassword(user, password);
      res.json({ isValid });
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ 
          status: 'error',
          message: error.message 
        });
        return;
      }
      if (error instanceof NotFoundError) {
        res.status(404).json({ 
          status: 'error',
          message: error.message 
        });
        return;
      }
      next(error);
    }
  };
} 