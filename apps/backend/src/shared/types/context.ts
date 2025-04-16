import { BirthChartService } from '../../application/services/BirthChartService';
import { EphemerisService } from '../../application/services/EphemerisService';
import { TransitService } from '../../application/services/TransitService';
import { LifeThemeService } from '../../application/services/LifeThemeService';
import { AIService } from '../../application/services/AIService';
import { InsightService } from '../../application/services/InsightService';
import { ICache } from '../../infrastructure/cache/ICache';
import { IUser } from '../../domain/models/User';

export interface AppContext {
  cache: ICache;
  user?: IUser;
}

export interface Context {
  birthChartService: BirthChartService;
  ephemerisService: EphemerisService;
  transitService: TransitService;
  lifeThemeService: LifeThemeService;
  aiService: AIService;
  insightService: InsightService;
} 