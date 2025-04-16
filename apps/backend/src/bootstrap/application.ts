import { EphemerisService } from '../application/services/EphemerisService';
import { BirthChartService } from '../application/services/BirthChartService';
import { UserService } from '../application/services/UserService';
import { AuthService } from '../application/services/AuthService';
import { LifeThemeService } from '../application/services/LifeThemeService';
import { InsightService } from '../application/services/InsightService';
import { AIService } from '../application/services/AIService';
import { TransitService } from '../application/services/TransitService';
import { InfrastructureLayer } from './infrastructure';
import { UserRepository } from '../infrastructure/database/UserRepository';
import { LLMClient } from '../infrastructure/ai/LLMClient';
import { PromptBuilder } from '../utils/PromptBuilder';
import { InsightGenerator } from '../application/services/insight/InsightGenerator';
import { InsightRepository } from '../application/services/insight/InsightRepository';
import { InsightAnalyzer } from '../application/services/insight/InsightAnalyzer';
import { config } from '../shared/config';
import { logger } from '../shared/logger';
import { CelestialBodyService } from '../application/services/ephemeris/CelestialBodyService';
import { AspectService } from '../application/services/ephemeris/AspectService';
import { HouseService } from '../application/services/ephemeris/HouseService';
import { EphemerisErrorHandler } from '../application/services/ephemeris/EphemerisErrorHandler';
import { InsightDatabaseRepository } from '../infrastructure/database/InsightRepository';
import { RateLimiter } from '../shared/utils/rateLimiter';

/**
 * Validates application configuration before startup
 * Throws ConfigurationError if any required configuration is missing
 */
function validateConfiguration() {
  logger.info('Validating application configuration...');
  
  // Configuration validation is handled in config.ts
  // This function is a placeholder for any additional validation needed
}

export const createApplicationLayer = (infrastructure: InfrastructureLayer) => {
  // Validate configuration before proceeding
  validateConfiguration();

  const { cacheClient, aiClient, ephemerisClient } = infrastructure;

  // Initialize ephemeris services
  const celestialBodyService = new CelestialBodyService(cacheClient);
  const aspectService = new AspectService(cacheClient);
  const houseService = new HouseService(cacheClient, ephemerisClient);
  const ephemerisErrorHandler = new EphemerisErrorHandler(cacheClient, ephemerisClient);

  // Initialize repositories
  const userRepository = new UserRepository(cacheClient, config.mongoUri);
  const insightRepository = new InsightDatabaseRepository(cacheClient, config.mongoUri);

  // Initialize AI components
  const llmClient = new LLMClient(cacheClient, config.openaiApiKey);
  const promptBuilder = PromptBuilder;

  // Core services
  const ephemerisService = new EphemerisService(
    ephemerisClient,
    cacheClient,
    celestialBodyService,
    aspectService,
    houseService,
    ephemerisErrorHandler
  );
  const birthChartService = new BirthChartService(cacheClient, ephemerisService);
  const userService = new UserService(cacheClient, birthChartService, userRepository);
  const rateLimiter = new RateLimiter(config.rateLimitMax);
  const authService = new AuthService(cacheClient, userRepository, rateLimiter);

  // Analysis services
  const aiService = new AIService(llmClient, promptBuilder, cacheClient);
  const lifeThemeService = new LifeThemeService(
    cacheClient,
    birthChartService,
    aiService
  );
  const transitService = new TransitService(
    ephemerisClient,
    cacheClient,
    birthChartService,
    celestialBodyService,
    aspectService,
    houseService,
    ephemerisErrorHandler
  );
  const insightGenerator = new InsightGenerator(cacheClient, aiService);
  const insightAnalyzer = new InsightAnalyzer(
    cacheClient,
    lifeThemeService,
    transitService
  );
  const insightService = new InsightService(
    cacheClient,
    ephemerisService,
    lifeThemeService,
    birthChartService,
    transitService,
    aiService,
    insightGenerator,
    insightAnalyzer,
    insightRepository,
    new InsightRepository(cacheClient)
  );

  return {
    ephemerisService,
    birthChartService,
    userService,
    authService,
    aiService,
    lifeThemeService,
    transitService,
    insightService
  } as const;
};

export type ApplicationLayer = ReturnType<typeof createApplicationLayer>; 