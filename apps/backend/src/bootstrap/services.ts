/**
 * Service initialization and dependency injection
 * 
 * This file initializes all services and their dependencies.
 * We use the native MongoDB driver for database operations instead of Mongoose.
 * The native driver provides better performance and more direct control over MongoDB operations.
 * 
 * Key differences from Mongoose:
 * 1. No schema validation (handled by TypeScript interfaces)
 * 2. No middleware/hooks (implemented in services)
 * 3. Direct MongoDB operations
 * 4. Better performance for bulk operations
 * 5. More flexible query capabilities
 */

import { createInfrastructureLayer } from './infrastructure';
import { createApplicationLayer } from './application';
import { LifeThemeService } from '../application/services/LifeThemeService';
import { CelestialBodyService } from '../application/services/ephemeris/CelestialBodyService';
import { AspectService } from '../application/services/ephemeris/AspectService';
import { HouseService } from '../application/services/ephemeris/HouseService';
import { EphemerisErrorHandler } from '../application/services/ephemeris/EphemerisErrorHandler';
import { InsightGenerator } from '../application/services/insight/InsightGenerator';
import { InsightDatabaseRepository } from '../infrastructure/database/InsightRepository';
import { InsightAnalyzer } from '../application/services/insight/InsightAnalyzer';
import { UserRepository } from '../infrastructure/database/UserRepository';
import { PromptBuilder } from '../utils/PromptBuilder';
import { LLMClient } from '../infrastructure/ai/LLMClient';
import { TransitService } from '../application/services/TransitService';
import { InsightService } from '../application/services/InsightService';
import { UserService } from '../application/services/UserService';
import { AuthService } from '../application/services/AuthService';
import { FeedbackService } from '../application/services/FeedbackService';
import { AIService } from '../application/services/AIService';
import { EphemerisService } from '../application/services/EphemerisService';
import { ICache } from '../infrastructure/cache/ICache';
import { config } from '../shared/config';
import { InsightRepository } from '../application/services/insight/InsightRepository';
import { RedisCache } from '../infrastructure/cache/RedisCache';
import { logger } from '../shared/logger';
import { AppError } from '../domain/errors';
import { RateLimiter } from '../shared/utils/rateLimiter';
import { EphemerisClient } from '../infrastructure/clients/EphemerisClient';
import { BirthChartService } from '../application/services/BirthChartService';
import { MongoClient } from 'mongodb';

class Container {
  private cache: RedisCache;
  private services: {
    ephemerisService: EphemerisService;
    userService: UserService;
    authService: AuthService;
    aiService: AIService;
  };
  private application: {
    birthChartService: BirthChartService;
  };

  constructor() {
    // Initialize cache first
    this.cache = new RedisCache(config.redisUrl);
    
    const ephemerisClient = new EphemerisClient(config.ephemerisApiUrl, config.ephemerisApiKey);
    const celestialBodyService = new CelestialBodyService(this.cache);
    const aspectService = new AspectService(this.cache);
    const houseService = new HouseService(this.cache, ephemerisClient);
    const errorHandler = new EphemerisErrorHandler(this.cache, ephemerisClient);
    const ephemerisService = new EphemerisService(
      ephemerisClient,
      this.cache,
      celestialBodyService,
      aspectService,
      houseService,
      errorHandler
    );
    const birthChartService = new BirthChartService(this.cache, ephemerisService);
    const userRepository = new UserRepository(this.cache, config.mongoUri);
    const userService = new UserService(this.cache, birthChartService, userRepository);
    const rateLimiter = new RateLimiter(config.rateLimitWindowMs, config.rateLimitMax);
    const authService = new AuthService(this.cache, userRepository, rateLimiter);
    const aiService = new AIService(new LLMClient(this.cache, config.openaiApiKey), PromptBuilder, this.cache);

    this.services = {
      ephemerisService,
      userService,
      authService,
      aiService
    };

    this.application = {
      birthChartService
    };
  }

  async shutdown() {
    await this.cache.disconnect();
  }
}

const container = new Container();

// Register shutdown handlers
process.on('SIGTERM', async () => {
  await container.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await container.shutdown();
  process.exit(0);
});

export {
  container
};
