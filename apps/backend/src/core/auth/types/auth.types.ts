import { Request } from 'express';
import { USER_ROLES } from '../../../shared/constants/user';

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export interface AuthUser {
  id: string;
  role: UserRole;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  };
}

export interface TokenPayload {
  userId: string;
  role: UserRole;
  type: 'access' | 'refresh';
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
  role?: UserRole;
}

export interface ChangePasswordData {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

export type LoginData = LoginCredentials;

export type TokenResponse = AuthTokens; 