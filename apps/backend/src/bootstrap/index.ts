import { config } from '../shared/config';
import { logger } from '../shared/logger';
import { RedisCache } from '../infrastructure/cache/RedisCache';
import { ICache } from '../infrastructure/cache/ICache';
import { DatabaseService } from '../infrastructure/database/database';
import { EphemerisClient } from '../core/ephemeris';
import { CelestialBodyService } from '../core/ephemeris/services/CelestialBodyService';
import { AspectService } from '../core/ephemeris/services/AspectService';
import { HouseService } from '../core/ephemeris/services/HouseService';
import { EphemerisErrorHandler } from '../core/ephemeris';
import { EphemerisService } from '../core/ephemeris';
import { BirthChartService } from '../core/birthchart';
import { UserRepository } from '../core/user/database/UserRepository';
import { UserService } from '../core/user';
import { AuthService } from '../core/auth';
import { AIService } from '../core/ai';
import { LLMClient } from '../core/ai';
import { PromptBuilder } from '../core/ai';
import { RateLimiter } from '../shared/utils/rateLimiter';
import { LifeThemeService } from '../core/life-theme';
import { TransitService } from '../core/transit';
import { InsightService } from '../core/insight';
import { InsightGenerator } from '../core/insight';
import { InsightAnalyzer } from '../core/insight';
import { InsightRepository } from '../core/insight';

/**
 * Application container that manages all service instances and their dependencies
 */
class Container {
  private cache: ICache;
  private database: DatabaseService;
  private services: {
    ephemerisService: EphemerisService;
    birthChartService: BirthChartService;
    userService: UserService;
    authService: AuthService;
    aiService: AIService;
    lifeThemeService: LifeThemeService;
    transitService: TransitService;
    insightService: InsightService;
  };

  constructor() {
    // Initialize infrastructure
    this.cache = new RedisCache(config.redisUrl);
    this.database = DatabaseService.getInstance();

    // Initialize clients
    const ephemerisClient = new EphemerisClient(config.ephemerisApiUrl, config.ephemerisApiKey);
    const llmClient = new LLMClient(this.cache, config.openaiApiKey);
    const promptBuilder = new PromptBuilder(this.cache);

    // Initialize repositories
    const userRepository = new UserRepository(this.database);
    const insightRepository = new InsightRepository(this.cache);

    // Initialize ephemeris services
    const celestialBodyService = new CelestialBodyService(this.cache);
    const aspectService = new AspectService(this.cache);
    const houseService = new HouseService(this.cache, ephemerisClient);
    const ephemerisErrorHandler = new EphemerisErrorHandler(this.cache, ephemerisClient);

    // Initialize core services
    const ephemerisService = new EphemerisService(
      ephemerisClient,
      this.cache,
      celestialBodyService,
      aspectService,
      houseService,
      ephemerisErrorHandler
    );

    const birthChartService = new BirthChartService(this.cache, ephemerisService);
    const userService = new UserService(this.cache, birthChartService, userRepository);
    const rateLimiter = new RateLimiter(config.rateLimitWindowMs, config.rateLimitMax);
    const authService = new AuthService(this.cache, userRepository, rateLimiter);
    const aiService = new AIService(llmClient,  this.cache);

    // Initialize transit service first since it's needed by other services
    const transitService = new TransitService(
      ephemerisClient,
      this.cache,
      birthChartService,
      celestialBodyService,
      aspectService,
      houseService,
      ephemerisErrorHandler
    );

    // Initialize analysis services
    const lifeThemeService = new LifeThemeService(
      this.cache,
      birthChartService,
      aiService,
      celestialBodyService,
      aspectService
    );

    const insightGenerator = new InsightGenerator(
      this.cache,
      aiService,
      promptBuilder,
      llmClient,
      insightRepository
    );

    const insightAnalyzer = new InsightAnalyzer(
      this.cache,
      lifeThemeService,
      transitService,
      PromptBuilder,
      llmClient
    );

    const insightService = new InsightService(
      this.cache,
      ephemerisService,
      lifeThemeService,
      birthChartService,
      transitService,
      aiService,
      insightGenerator,
      insightAnalyzer,
      insightRepository,
      insightRepository // Use the same repository instance for both parameters
    );

    this.services = {
      ephemerisService,
      birthChartService,
      userService,
      authService,
      aiService,
      lifeThemeService,
      transitService,
      insightService
    };
  }

  getServices() {
    return this.services;
  }

  async shutdown() {
    await this.cache.disconnect();
    // Database service doesn't have a disconnect method
    // await this.database.disconnect();
  }
}

// Create singleton container instance
const container = new Container();

// Register shutdown handlers
process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM signal. Shutting down gracefully...');
  await container.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('Received SIGINT signal. Shutting down gracefully...');
  await container.shutdown();
  process.exit(0);
});

// Export container and initialization function
export { container };

export const initializeServices = () => {
  return container.getServices();
}; 