import { ConfigurationError } from '../domain/errors';
import { logger } from './logger';

// Define the shape of our configuration
interface Config {
  // Authentication
  jwtSecret: string;
  jwtRefreshSecret: string;
  jwtExpiresIn: string;
  jwtRefreshExpiresIn: string;

  // Database
  mongoUri: string;

  // Cache
  redisUrl: string;

  // External APIs
  ephemerisApiUrl: string;
  ephemerisApiKey: string;
  ephemerisTimeoutMs: number;
  openaiApiKey: string;

  // Server
  port: number;
  environment: 'development' | 'production' | 'test';
  corsOrigin: string;

  // Rate Limiting
  rateLimitWindowMs: number;
  rateLimitMax: number;

  // Cache
  cacheTtl: number;

  // Logging
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  enableRequestLogging: boolean;
  enableErrorLogging: boolean;
  enablePerformanceLogging: boolean;

  // Features
  enableSwagger: boolean;
  enableMetrics: boolean;
  enableHealthCheck: boolean;
  enableSecurityHeaders: boolean;
  enableCompression: boolean;
  enableCors: boolean;
  enableRateLimit: boolean;
  enableCache: boolean;

  // AI Configuration
  ai: {
    model: string;
    temperature: number;
    timeoutMs: number;
    maxRetries: number;
    retryDelayMs: number;
    promptTags: {
      daily: string;
      weekly: string;
      nodePath: string;
      lifeTheme: string;
    };
  };
}

// Helper function to validate required environment variables
function validateEnvVar(name: string, value: string | undefined): string {
  if (!value) {
    throw new ConfigurationError(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Helper function to validate numeric environment variables
function validateNumericEnvVar(name: string, value: string | undefined, defaultValue: number): number {
  if (!value) {
    return defaultValue;
  }
  const num = parseInt(value, 10);
  if (isNaN(num)) {
    throw new ConfigurationError(`Invalid numeric value for environment variable: ${name}`);
  }
  return num;
}

// Helper function to validate boolean environment variables
function validateBooleanEnvVar(name: string, value: string | undefined, defaultValue: boolean): boolean {
  if (!value) {
    return defaultValue;
  }
  return value.toLowerCase() === 'true';
}

// Create and validate the config object
export const config: Config = {
  // Authentication
  jwtSecret: validateEnvVar('JWT_SECRET', process.env.JWT_SECRET),
  jwtRefreshSecret: validateEnvVar('JWT_REFRESH_SECRET', process.env.JWT_REFRESH_SECRET),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // Database
  mongoUri: validateEnvVar('MONGO_URI', process.env.MONGO_URI),

  // Cache
  redisUrl: validateEnvVar('REDIS_URL', process.env.REDIS_URL),

  // External APIs
  ephemerisApiUrl: process.env.EPHEMERIS_API_URL || 'http://localhost:3001',
  ephemerisApiKey: validateEnvVar('EPHEMERIS_API_KEY', process.env.EPHEMERIS_API_KEY),
  ephemerisTimeoutMs: validateNumericEnvVar('EPHEMERIS_TIMEOUT_MS', process.env.EPHEMERIS_TIMEOUT_MS, 5000),
  openaiApiKey: validateEnvVar('OPENAI_API_KEY', process.env.OPENAI_API_KEY),

  // Server
  port: validateNumericEnvVar('PORT', process.env.PORT, 3000),
  environment: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
  corsOrigin: process.env.CORS_ORIGIN || '*',

  // Rate Limiting
  rateLimitWindowMs: validateNumericEnvVar('RATE_LIMIT_WINDOW_MS', process.env.RATE_LIMIT_WINDOW_MS, 900000),
  rateLimitMax: validateNumericEnvVar('RATE_LIMIT_MAX', process.env.RATE_LIMIT_MAX, 100),

  // Cache
  cacheTtl: validateNumericEnvVar('CACHE_TTL', process.env.CACHE_TTL, 3600),

  // Logging
  logLevel: (process.env.LOG_LEVEL || 'info') as 'error' | 'warn' | 'info' | 'debug',
  enableRequestLogging: validateBooleanEnvVar('ENABLE_REQUEST_LOGGING', process.env.ENABLE_REQUEST_LOGGING, false),
  enableErrorLogging: validateBooleanEnvVar('ENABLE_ERROR_LOGGING', process.env.ENABLE_ERROR_LOGGING, true),
  enablePerformanceLogging: validateBooleanEnvVar('ENABLE_PERFORMANCE_LOGGING', process.env.ENABLE_PERFORMANCE_LOGGING, false),

  // Features
  enableSwagger: validateBooleanEnvVar('ENABLE_SWAGGER', process.env.ENABLE_SWAGGER, false),
  enableMetrics: validateBooleanEnvVar('ENABLE_METRICS', process.env.ENABLE_METRICS, false),
  enableHealthCheck: validateBooleanEnvVar('ENABLE_HEALTH_CHECK', process.env.ENABLE_HEALTH_CHECK, true),
  enableSecurityHeaders: validateBooleanEnvVar('ENABLE_SECURITY_HEADERS', process.env.ENABLE_SECURITY_HEADERS, true),
  enableCompression: validateBooleanEnvVar('ENABLE_COMPRESSION', process.env.ENABLE_COMPRESSION, true),
  enableCors: validateBooleanEnvVar('ENABLE_CORS', process.env.ENABLE_CORS, true),
  enableRateLimit: validateBooleanEnvVar('ENABLE_RATE_LIMIT', process.env.ENABLE_RATE_LIMIT, true),
  enableCache: validateBooleanEnvVar('ENABLE_CACHE', process.env.ENABLE_CACHE, true),

  // AI Configuration
  ai: {
    model: process.env.AI_MODEL || 'gpt-4',
    temperature: validateNumericEnvVar('AI_TEMPERATURE', process.env.AI_TEMPERATURE, 0.7),
    timeoutMs: validateNumericEnvVar('AI_TIMEOUT_MS', process.env.AI_TIMEOUT_MS, 12000),
    maxRetries: validateNumericEnvVar('AI_MAX_RETRIES', process.env.AI_MAX_RETRIES, 3),
    retryDelayMs: validateNumericEnvVar('AI_RETRY_DELAY_MS', process.env.AI_RETRY_DELAY_MS, 1000),
    promptTags: {
      daily: '[Daily Insight]',
      weekly: '[Weekly Digest]',
      nodePath: '[Node Path Insight]',
      lifeTheme: '[Life Theme Forecast]'
    }
  }
};

// Helper function to mask sensitive values in logs
export function maskSensitiveValue(value: string): string {
  if (!value) return '';
  if (value.length <= 8) return '****';
  return `${value.substring(0, 4)}****${value.substring(value.length - 4)}`;
}

// Helper function to get a safe version of config for logging
export function getSafeConfig(): Omit<Config, 'jwtSecret' | 'jwtRefreshSecret' | 'ephemerisApiKey' | 'openaiApiKey'> & {
  jwtSecret: string;
  jwtRefreshSecret: string;
  ephemerisApiKey: string;
  openaiApiKey: string;
} {
  return {
    ...config,
    jwtSecret: maskSensitiveValue(config.jwtSecret),
    jwtRefreshSecret: maskSensitiveValue(config.jwtRefreshSecret),
    ephemerisApiKey: maskSensitiveValue(config.ephemerisApiKey),
    openaiApiKey: maskSensitiveValue(config.openaiApiKey)
  };
}

// Log non-sensitive config values at startup
logger.info('Application configuration loaded', {
  environment: config.environment,
  port: config.port,
  features: Object.keys(config).filter(key => 
    key.startsWith('enable') && config[key as keyof Config] === true
  )
}); 