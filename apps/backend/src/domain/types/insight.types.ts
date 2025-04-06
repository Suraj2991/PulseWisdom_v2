import { DateTime, CelestialBody } from '../../shared/types/ephemeris.types';

export type InsightSeverity = 'high' | 'medium' | 'low';

export enum InsightCategory {
  PERSONALITY = 'PERSONALITY',
  CAREER = 'CAREER',
  RELATIONSHIPS = 'RELATIONSHIPS',
  HEALTH = 'HEALTH',
  SPIRITUALITY = 'SPIRITUALITY',
  LIFE_PURPOSE = 'LIFE_PURPOSE',
  CHALLENGES = 'CHALLENGES',
  OPPORTUNITIES = 'OPPORTUNITIES',
  FINANCES = 'FINANCES',
  PERSONAL_GROWTH = 'PERSONAL_GROWTH'
}

export enum InsightType {
  // Core insight types
  BIRTH_CHART = 'BIRTH_CHART',
  TRANSIT = 'TRANSIT',
  LIFE_THEME = 'LIFE_THEME',
  PLANETARY_POSITION = 'PLANETARY_POSITION',
  HOUSE_POSITION = 'HOUSE_POSITION',
  
  // Additional insight types
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  THEME_FORECAST = 'THEME_FORECAST',
  
  // Technical insight types
  ASPECT = 'ASPECT',
  RETROGRADE = 'RETROGRADE',
  LUNAR_PHASE = 'LUNAR_PHASE',
  SOLAR_ECLIPSE = 'SOLAR_ECLIPSE',
  LUNAR_ECLIPSE = 'LUNAR_ECLIPSE',
  STATION = 'STATION',
  HELIACAL = 'HELIACAL',
  COSMIC = 'COSMIC'
}

export interface Dignity {
  ruler: boolean;
  exaltation: boolean;
  detriment: boolean;
  fall: boolean;
  score: number;
}

export interface InsightAspect {
  body1Id: number;
  body2Id: number;
  type: string;
  angle: number;
  orb: number;
  isApplying: boolean;
}

export interface InsightHouse {
  number: number;
  cusp: number;
  nextCusp: number;
  size: number;
  rulerId: number;
}

export interface HouseTheme {
  house: number;
  theme: string;
  description: string;
  planets: string[];
  aspects: InsightAspect[];
}

export interface HouseLord {
  house: number;
  lord: string;
  dignity: Dignity;
  influence: string;
  aspects: string[];
}

// Base insight interface
export interface BaseInsight {
  id: string;
  type: InsightType;
  description: string;
  category: InsightCategory;
  title: string;
  severity: InsightSeverity;
  aspects: InsightAspect[];
  houses: InsightHouse[];
  supportingFactors: string[];
  challenges: string[];
  recommendations: string[];
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Specialized insight interfaces
export interface AstrologicalInsight extends BaseInsight {
  type: InsightType.PLANETARY_POSITION | InsightType.HOUSE_POSITION | InsightType.ASPECT | 
        InsightType.RETROGRADE | InsightType.LUNAR_PHASE | InsightType.SOLAR_ECLIPSE | 
        InsightType.LUNAR_ECLIPSE | InsightType.STATION | InsightType.HELIACAL | InsightType.COSMIC;
  bodyId?: number;
  dignity?: Dignity;
}

export interface TemporalInsight extends BaseInsight {
  type: InsightType.DAILY | InsightType.WEEKLY | InsightType.TRANSIT | InsightType.THEME_FORECAST;
  dateRange?: {
    start: DateTime;
    end: DateTime;
  };
}

export interface LifeThemeInsight extends BaseInsight {
  type: InsightType.LIFE_THEME;
}

export interface BirthChartInsight extends BaseInsight {
  type: InsightType.BIRTH_CHART;
}

// Union type for all insights
export type Insight = AstrologicalInsight | TemporalInsight | LifeThemeInsight | BirthChartInsight;

export interface InsightAnalysis {
  birthChartId: string;
  userId: string;
  insights: Insight[];
  overallSummary: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsightOptions {
  filter?: {
    minStrength?: number;
    personalPlanetsOnly?: boolean;
    aspectTypes?: string[];
    orb?: number;
  };
  includeMetadata?: boolean;
  outputFormat?: 'text' | 'json' | 'html';
}

export interface InsightLog {
  id?: string;
  userId: string;
  insightType: 'daily' | 'weekly' | 'theme_forecast';
  content: string;
  generatedAt: Date;
  metadata?: {
    date?: Date;
    endDate?: Date;
    keyTransits?: any[];
    lifeThemes?: any[];
    birthChartId?: string;
  };
} 