import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../../application/services/AuthService';
import { ValidationError, AuthError, NotFoundError } from '../../domain/errors';
import { ChangePasswordData } from '../../domain/types/auth.types';

export class AuthController {
  constructor(private authService: AuthService) {}

  private handleError(error: any, res: Response) {
    if (error instanceof ValidationError) {
      res.status(400).json({
        status: 'error',
        message: error.message,
        details: error.details
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
    if (error instanceof NotFoundError) {
      res.status(404).json({
        status: 'error',
        message: error.message
      });
      return;
    }
    res.status(500).json({
      status: 'error',
      message: 'Database error'
    });
  }

  /**
   * Register a new user
   */
  public register = async (req: Request, res: Response) => {
    try {
      const result = await this.authService.register(req.body);
      res.status(201).json({
        message: 'User registered successfully',
        user: result.user,
        tokens: result.tokens
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Login user
   */
  public login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login({ email, password });
      res.status(200).json({
        message: 'Login successful',
        user: result.user,
        tokens: result.tokens
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Change user password
   */
  public changePassword = async (req: Request, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const changePasswordData: ChangePasswordData = {
        userId,
        currentPassword,
        newPassword
      };

      await this.authService.changePassword(changePasswordData);
      res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Logout user
   */
  public logout = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('User ID is required');
      }
      await this.authService.logout(userId);
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Generate password reset token
   */
  public generatePasswordResetToken = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const token = await this.authService.generatePasswordResetToken(email);
      res.status(200).json({
        message: 'Password reset email sent',
        token
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Reset password using token
   */
  public resetPassword = async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const { newPassword } = req.body;
      await this.authService.resetPassword(token, newPassword);
      res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Verify email
   */
  public verifyEmail = async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      await this.authService.verifyEmail(token);
      res.status(200).json({ message: 'Email verified successfully' });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Refresh access token
   */
  public refreshToken = async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;
      const tokens = await this.authService.refreshToken(refreshToken);
      res.status(200).json(tokens);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Get active sessions
   */
  public getActiveSessions = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const sessions = await this.authService.getActiveSessions(userId);
      res.status(200).json(sessions);
    } catch (error) {
      this.handleError(error, res);
    }
  };
} 