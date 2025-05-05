import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { ValidationError, AuthError, NotFoundError } from '../../../domain/errors';
import { ChangePasswordData, LoginData, RegisterData, TokenResponse, AuthRequest } from '../types/auth.types';

// Define specific validation error details type
type ValidationErrorDetails = {
  [key: string]: string[] | undefined;
} | string[];

interface ErrorResponse {
  status: 'error';
  message: string;
  details?: ValidationErrorDetails;
}

interface SuccessResponse<T> {
  status: 'success';
  message: string;
  data?: T;
}

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private handleError(error: unknown, res: Response): void {
    if (error instanceof ValidationError) {
      const details = error.details as ValidationErrorDetails;
      const safeDetails = Array.isArray(details) ? details :
        (details && typeof details === 'object') ? details :
        undefined;

      const response: ErrorResponse = {
        status: 'error',
        message: String(error.message),
        ...(safeDetails && { details: safeDetails })
      };

      res.status(400).json(response);
      return;
    }

    if (error instanceof AuthError) {
      const response: ErrorResponse = {
        status: 'error',
        message: String(error.message)
      };

      res.status(401).json(response);
      return;
    }

    if (error instanceof NotFoundError) {
      const response: ErrorResponse = {
        status: 'error',
        message: String(error.message)
      };

      res.status(404).json(response);
      return;
    }

    // Log unexpected errors
    const errorMessage = error instanceof Error ? String(error.message) : String(error);
    console.error('Unexpected error:', errorMessage);

    const response: ErrorResponse = {
      status: 'error',
      message: 'Internal server error'
    };

    res.status(500).json(response);
  }

  /**
   * Register a new user
   */
  public register = async (req: Request<unknown, unknown, RegisterData>, res: Response): Promise<void> => {
    try {
      const registerData = req.body;
      const result = await this.authService.register(registerData);
      const response: SuccessResponse<typeof result> = {
        status: 'success',
        message: 'User registered successfully',
        data: result
      };
      res.status(201).json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Login user
   */
  public login = async (req: Request<unknown, unknown, LoginData>, res: Response): Promise<void> => {
    try {
      const loginData = req.body;
      const result = await this.authService.login(loginData);
      const response: SuccessResponse<typeof result> = {
        status: 'success',
        message: 'Login successful',
        data: result
      };
      res.status(200).json(response);
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
        email: req.user?.email ?? '',
        currentPassword,
        newPassword
      };

      await this.authService.changePassword(changePasswordData);
      const response: SuccessResponse<void> = {
        status: 'success',
        message: 'Password changed successfully'
      };
      res.status(200).json(response);
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
      const response: SuccessResponse<void> = {
        status: 'success',
        message: 'Logged out successfully'
      };
      res.status(200).json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Generate password reset token
   */
  public generatePasswordResetToken = async (req: Request<unknown, unknown, { email: string }>, res: Response): Promise<void> => {
    try {
      const { email } = req.body;
      if (!email) {
        throw new ValidationError('Email is required');
      }

      const token = await this.authService.generatePasswordResetToken(email);
      const response: SuccessResponse<{ token: string }> = {
        status: 'success',
        message: 'Password reset email sent',
        data: { token }
      };
      res.status(200).json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Reset password using token
   */
  public resetPassword = async (
    req: Request<{ token: string }, unknown, { newPassword: string }>,
    res: Response
  ): Promise<void> => {
    try {
      const { token } = req.params;
      const { newPassword } = req.body;

      if (!token || !newPassword) {
        throw new ValidationError('Token and new password are required');
      }

      await this.authService.resetPassword(token, newPassword);
      const response: SuccessResponse<void> = {
        status: 'success',
        message: 'Password reset successful'
      };
      res.status(200).json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Verify email
   */
  public verifyEmail = async (req: Request<{ token: string }>, res: Response): Promise<void> => {
    try {
      const { token } = req.params;
      if (!token) {
        throw new ValidationError('Verification token is required');
      }

      await this.authService.verifyEmail(token);
      const response: SuccessResponse<void> = {
        status: 'success',
        message: 'Email verified successfully'
      };
      res.status(200).json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Refresh access token
   */
  public refreshToken = async (req: Request<unknown, unknown, { refreshToken: string }>, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        throw new ValidationError('Refresh token is required');
      }

      const tokens = await this.authService.refreshToken(refreshToken);
      const response: SuccessResponse<TokenResponse> = {
        status: 'success',
        message: 'Token refreshed successfully',
        data: tokens
      };
      res.status(200).json(response);
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
      const response: SuccessResponse<typeof sessions> = {
        status: 'success',
        message: 'Active sessions retrieved successfully',
        data: sessions
      };
      res.status(200).json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  };
} 