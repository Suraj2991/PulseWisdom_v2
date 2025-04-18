import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../../services/AuthService';
import { AppError, AuthError } from '../../types/errors';
import { IUser } from '../../models/User';
import { ICache } from '../../infrastructure/cache/ICache';
import { RedisCache } from '../../infrastructure/cache/RedisCache';
import { CelestialBody } from '../../types/ephemeris.types';
import { UserService } from '../../services/UserService';
import { BirthChartService } from '../../services/BirthChartService';
import { EphemerisService } from '../../services/EphemerisService';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

// Initialize services
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const cache = new RedisCache(redisUrl);
const ephemerisService = new EphemerisService(cache, 'http://localhost:8000');
const birthChartService = new BirthChartService(cache, ephemerisService);
const userService = new UserService(cache, birthChartService);
const authService = new AuthService(cache, userService);

// Mock cache implementation for testing
class MockCache implements ICache {
  private store = new Map<string, string>();
  private readonly PLANETARY_POSITIONS_KEY = 'planetary:positions';
  private readonly BIRTH_CHART_KEY_PREFIX = 'birthchart:';
  private readonly INSIGHT_KEY_PREFIX = 'insight:';

  async get<T>(key: string): Promise<T | null> {
    const value = this.store.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    this.store.set(key, JSON.stringify(value));
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  async exists(key: string): Promise<boolean> {
    return this.store.has(key);
  }

  async keys(pattern: string): Promise<string[]> {
    return Array.from(this.store.keys());
  }

  async getPlanetaryPositions(): Promise<CelestialBody[] | null> {
    return this.get<CelestialBody[]>(this.PLANETARY_POSITIONS_KEY);
  }

  async setPlanetaryPositions(positions: CelestialBody[]): Promise<void> {
    await this.set(this.PLANETARY_POSITIONS_KEY, positions);
  }

  async getBirthChart(id: string): Promise<any | null> {
    return this.get(`${this.BIRTH_CHART_KEY_PREFIX}${id}`);
  }

  async setBirthChart(id: string, data: any): Promise<void> {
    await this.set(`${this.BIRTH_CHART_KEY_PREFIX}${id}`, data);
  }

  async deleteBirthChart(id: string): Promise<void> {
    await this.delete(`${this.BIRTH_CHART_KEY_PREFIX}${id}`);
  }

  async getInsight(id: string): Promise<any | null> {
    return this.get(`${this.INSIGHT_KEY_PREFIX}${id}`);
  }

  async setInsight(id: string, data: any): Promise<void> {
    await this.set(`${this.INSIGHT_KEY_PREFIX}${id}`, data);
  }

  async deleteInsight(id: string): Promise<void> {
    await this.delete(`${this.INSIGHT_KEY_PREFIX}${id}`);
  }

  async clearCache(): Promise<void> {
    await this.clear();
  }

  async disconnect(): Promise<void> {
    // No-op for mock implementation
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next(new AuthError('Authentication required'));
    }

    const token = authHeader.split(' ')[1];
    const user = await authService.validateToken(token);
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof AuthError) {
      return next(error);
    }
    return next(new AuthError('Authentication required'));
  }
};

export const requireRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthError('Authentication required'));
    }

    if (req.user.role !== role) {
      return next(new AuthError('Insufficient permissions'));
    }

    next();
  };
}; 