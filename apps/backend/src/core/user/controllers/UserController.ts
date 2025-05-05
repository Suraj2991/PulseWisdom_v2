import { Request, Response, NextFunction } from 'express';
import { UserService } from '../../user';
import { AuthService } from '../../auth';
import { ValidationError, NotFoundError, AuthError } from '../../../domain/errors';

export class UserController {
  constructor(
    private userService: UserService,
    private authService: AuthService
  ) {}

  private handleError(error: unknown, res: Response, next: NextFunction): void {
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
    if (error instanceof AuthError) {
      res.status(401).json({ 
        status: 'error',
        message: error.message 
      });
      return;
    }
    next(error);
  }

  /**
   * Create a new user
   */
  public createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.userService.createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      this.handleError(error, res, next);
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
      this.handleError(error, res, next);
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
      this.handleError(error, res, next);
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
      this.handleError(error, res, next);
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
      this.handleError(error, res, next);
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
      this.handleError(error, res, next);
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
      this.handleError(error, res, next);
    }
  };

  /**
   * Search users
   */
  public searchUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { query } = req.query;
      const users = await this.userService.searchUsers(query as string);
      res.json(users);
    } catch (error) {
      this.handleError(error, res, next);
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

      const isValid = await this.authService.validateRefreshToken(userId, password);
      res.json({ isValid });
    } catch (error) {
      this.handleError(error, res, next);
    }
  };
} 