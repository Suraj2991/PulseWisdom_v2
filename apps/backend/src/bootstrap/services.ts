import { RedisCache } from '../infrastructure/cache/RedisCache';
import { EphemerisService } from '../application/services/EphemerisService';
import { BirthChartService } from '../application/services/BirthChartService';
import { UserService } from '../application/services/UserService';
import { AuthService } from '../application/services/AuthService';
import { config } from '../config';

// Initialize infrastructure layer
const cache = new RedisCache(config.redis.url);

// Initialize application services
const ephemerisService = new EphemerisService(cache, config.ephemeris.apiUrl);
const birthChartService = new BirthChartService(cache, ephemerisService);
const userService = new UserService(cache, birthChartService);
const authService = new AuthService(cache, userService);

export const services = {
  cache,
  ephemeris: ephemerisService,
  birthChart: birthChartService,
  user: userService,
  auth: authService
} as const;

// Type-safe service accessor
export type Services = typeof services; 