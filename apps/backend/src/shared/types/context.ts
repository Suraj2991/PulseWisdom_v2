import { BirthChartService } from '../services/BirthChartService';
import { EphemerisService } from '../services/EphemerisService';
import { TransitService } from '../services/TransitService';
import { LifeThemeService } from '../services/LifeThemeService';
import { AIService } from '../services/AIService';
import { InsightService } from '../services/InsightService';
import { RedisCache } from '../infrastructure/cache/RedisCache';

export interface Context {
  birthChartService: BirthChartService;
  ephemerisService: EphemerisService;
  transitService: TransitService;
  lifeThemeService: LifeThemeService;
  aiService: AIService;
  insightService: InsightService;
  cache: RedisCache;
} 