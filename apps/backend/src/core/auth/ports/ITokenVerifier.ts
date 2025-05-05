import { UserRole } from '../types/auth.types';

export interface ITokenVerifier {
  verifyToken(token: string): Promise<{ userId: string; role: UserRole } | null>;
} 