import { IUser } from '../models/User';
import { Types } from 'mongoose';

export interface TokenPayload {
  userId: string;
  role?: string;
  deviceId?: string;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginAttempt {
  ip: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
}

export interface Session {
  token: string;
  refreshToken: string;
  userId: string;
  deviceId?: string;
  createdAt: Date;
  expiresAt: Date;
  lastActive: Date;
}

export interface AuthConfig {
  jwtSecret: string;
  jwtRefreshSecret: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
  maxLoginAttempts: number;
  loginTimeoutMinutes: number;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
}

export interface AuthResponse {
  user: any;
  tokens: AuthTokens;
}

export interface PasswordResetData {
  token: string;
  newPassword: string;
  userId: string;
  expires: Date;
}

export interface EmailVerificationData {
  token: string;
  userId: string;
  expires: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
  ip?: string;
  userAgent?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  birthDate?: Date;
  birthLocation?: {
    latitude: number;
    longitude: number;
    placeName: string;
  };
  role?: string;
}

export interface ChangePasswordData {
  userId: string;
  currentPassword: string;
  newPassword: string;
} 