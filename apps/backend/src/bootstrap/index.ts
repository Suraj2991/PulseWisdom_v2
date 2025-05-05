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
  private cache!: ICache;
  private database!: DatabaseService;
  private services!: {
    ephemerisService: EphemerisService;
    birthChartService: BirthChartService;
    userService: UserService;
    authService: AuthService;
    aiService: AIService;
    lifeThemeService: LifeThemeService;
    transitService: TransitService;
    insightService: InsightService;
  };

  private constructor() {
    logger.info('Initializing container');
  }

  public static async initialize(): Promise<Container> {
    const container = new Container();
    await container.initializeServices();
    return container;
  }

  public getCacheClient(): ICache {
    return this.cache;
  }

  private async initializeServices(): Promise<void> {
    // Initialize infrastructure
    this.cache = new RedisCache(config.redisUrl);
    await this.cache.connect();
    this.database = DatabaseService.getInstance();
    await this.database.initialize();

    // Initialize clients
    const ephemerisClient = new EphemerisClient(config.ephemerisApiUrl, config.ephemerisApiKey);
    const llmClient = new LLMClient(this.cache, config.openaiApiKey);

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
    const rateLimiter = new RateLimiter();
    const authService = new AuthService(this.cache, userRepository, rateLimiter);
    const aiService = new AIService(llmClient, this.cache);

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
      aiService
    );

    const insightAnalyzer = new InsightAnalyzer(
      this.cache,
      lifeThemeService,
      transitService,
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
      insightRepository,
      llmClient
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
const container = Container.initialize().catch(error => {
  logger.error('Failed to initialize container', { error: error instanceof Error ? error.message : String(error) });
  process.exit(1);
});

// Register shutdown handlers
const handleShutdown = async (signal: string) => {
  logger.info(`Received ${signal} signal. Shutting down gracefully...`);
  try {
    const instance = await container;
    await instance.shutdown();
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
};

process.on('SIGTERM', () => { void handleShutdown('SIGTERM'); });
process.on('SIGINT', () => { void handleShutdown('SIGINT'); });

// Export container and initialization function
export { container };

export const initializeServices = async () => {
  const instance = await container;
  return instance.getServices();
};

export const initializeInfrastructure = async () => {
  const instance = await container;
  return { cacheClient: instance.getCacheClient() };
}; 