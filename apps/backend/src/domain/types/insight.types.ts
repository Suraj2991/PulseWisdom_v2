import { DateTime, CelestialBody } from '../../shared/types/ephemeris.types';
import { LifeTheme } from './lifeTheme.types';
import { TransitAnalysis } from './transit.types';
import { Planet } from '../../shared/types/ephemeris.types';
import { Aspect } from '../../shared/types/ephemeris.types';

export enum InsightSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export enum InsightCategory {
  STRENGTHS = 'STRENGTHS',
  CHALLENGES = 'CHALLENGES',
  OPPORTUNITIES = 'OPPORTUNITIES',
  GROWTH = 'GROWTH',
  FINANCES = 'FINANCES',
  PERSONAL_GROWTH = 'PERSONAL_GROWTH'
}

export enum InsightType {
  CORE_IDENTITY = 'CORE_IDENTITY',
  ASPECT = 'ASPECT',
  PATTERN = 'PATTERN',
  LIFE_THEME = 'LIFE_THEME',
  TRANSIT = 'TRANSIT',
  BIRTH_CHART = 'BIRTH_CHART',
  PLANETARY_POSITION = 'PLANETARY_POSITION',
  HOUSE_POSITION = 'HOUSE_POSITION',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
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

export interface BaseInsight {
  id: string;
  type: InsightType;
  category: InsightCategory;
  severity: InsightSeverity;
  title: string;
  description: string;
  date: Date;
  aspects?: Aspect[];
  houses?: number[];
  supportingFactors?: string[];
  challenges?: string[];
  recommendations?: string[];
}

export interface CoreIdentityInsight extends BaseInsight {
  type: InsightType.CORE_IDENTITY;
  sunSign: string;
  moonSign: string;
  ascendantSign: string;
}

export interface AspectInsight extends BaseInsight {
  type: InsightType.ASPECT;
  aspectType: string;
  planet1Id: number;
  planet2Id: number;
}

export interface PatternInsight extends BaseInsight {
  type: InsightType.PATTERN;
  patternType: string;
  planets: Planet[];
}

export interface LifeThemeInsight extends BaseInsight {
  type: InsightType.LIFE_THEME;
  themeId: string;
}

export interface TransitInsight extends BaseInsight {
  type: InsightType.TRANSIT;
  transitId: string;
}

export interface BirthChartInsight extends BaseInsight {
  type: InsightType.BIRTH_CHART;
  chartId: string;
}

export type Insight = CoreIdentityInsight | AspectInsight | PatternInsight | LifeThemeInsight | TransitInsight | BirthChartInsight;

export interface InsightAnalysis {
  birthChartId: string;
  userId: string;
  content: string;
  type: string;
  relevance?: number;
  tags?: string[];
  status?: 'pending' | 'reviewed' | 'addressed';
  insights: Insight[];
  overallSummary: string;
  createdAt: Date;
  updatedAt: Date;
  planets?: Array<{
    id: number;
    name: string;
    sign: string;
    house: number;
    degree: number;
    retrograde: boolean;
  }>;
  aspects?: InsightAspect[];
  lifeThemes?: LifeTheme[];
  transits?: TransitAnalysis[];
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