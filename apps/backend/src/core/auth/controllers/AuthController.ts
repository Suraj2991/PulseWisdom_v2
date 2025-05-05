import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { ValidationError, AuthError, NotFoundError } from '../../../domain/errors';
import { ChangePasswordData, LoginData, RegisterData, TokenResponse, AuthRequest } from '../types/auth.types';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private handleError(error: unknown, res: Response): void {
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
      message: 'Internal server error'
    });
  }

  /**
   * Register a new user
   */
  public register = async (req: Request, res: Response): Promise<void> => {
    try {
      const registerData: RegisterData = req.body;
      const result = await this.authService.register(registerData);
      res.status(201).json({
        status: 'success',
        message: 'User registered successfully',
        data: result
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Login user
   */
  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const loginData: LoginData = req.body;
      const result = await this.authService.login(loginData);
      res.status(200).json({
        status: 'success',
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Change user password
   */
  public changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AuthError('Authentication required');
      }

      const { currentPassword, newPassword } = req.body;
      const changePasswordData: ChangePasswordData = {
        userId,
        currentPassword,
        newPassword
      };

      await this.authService.changePassword(changePasswordData);
      res.status(200).json({
        status: 'success',
        message: 'Password changed successfully'
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Logout user
   */
  public logout = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        throw new AuthError('No token provided');
      }

      await this.authService.logout(token);
      res.status(200).json({
        status: 'success',
        message: 'Logged out successfully'
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Generate password reset token
   */
  public generatePasswordResetToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;
      if (!email) {
        throw new ValidationError('Email is required');
      }

      const token = await this.authService.generatePasswordResetToken(email);
      res.status(200).json({
        status: 'success',
        message: 'Password reset email sent',
        data: { token }
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Reset password using token
   */
  public resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.params;
      const { newPassword } = req.body;

      if (!token || !newPassword) {
        throw new ValidationError('Token and new password are required');
      }

      await this.authService.resetPassword(token, newPassword);
      res.status(200).json({
        status: 'success',
        message: 'Password reset successful'
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Verify email
   */
  public verifyEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.params;
      if (!token) {
        throw new ValidationError('Verification token is required');
      }

      await this.authService.verifyEmail(token);
      res.status(200).json({
        status: 'success',
        message: 'Email verified successfully'
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Refresh access token
   */
  public refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        throw new ValidationError('Refresh token is required');
      }

      const tokens: TokenResponse = await this.authService.refreshToken(refreshToken);
      res.status(200).json({
        status: 'success',
        data: tokens
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Get active sessions
   */
  public getActiveSessions = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AuthError('Authentication required');
      }

      const sessions = await this.authService.getActiveSessions(userId);
      res.status(200).json({
        status: 'success',
        data: sessions
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };
} 