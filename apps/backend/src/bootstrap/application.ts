import { EphemerisService } from '../application/services/EphemerisService';
import { BirthChartService } from '../application/services/BirthChartService';
import { UserService } from '../application/services/UserService';
import { AuthService } from '../application/services/AuthService';
import { LifeThemeService } from '../application/services/LifeThemeService';
import { InsightService } from '../application/services/InsightService';
import { AIService } from '../application/services/AIService';
import { TransitService } from '../application/services/TransitService';
import { InfrastructureLayer } from './infrastructure';

export const createApplicationLayer = (infrastructure: InfrastructureLayer) => {
  const { cacheClient, aiClient, ephemerisClient } = infrastructure;

  // Core services
  const ephemerisService = new EphemerisService(cacheClient, ephemerisClient);
  const birthChartService = new BirthChartService(cacheClient, ephemerisService);
  const userService = new UserService(cacheClient, birthChartService);
  const authService = new AuthService(cacheClient, userService);

  // Analysis services
  const aiService = new AIService();
  const lifeThemeService = new LifeThemeService(cacheClient, ephemerisService, aiService);
  const transitService = new TransitService(cacheClient, ephemerisService);
  const insightService = new InsightService(cacheClient, ephemerisService, lifeThemeService);

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