import { Planet } from '../../../core/ephemeris/types/ephemeris.types';
import { Transit } from '../../transit/types/transit.types';
import { ObjectId } from 'mongodb';
import { LifeArea } from '../../life-theme';
import { WindowType } from '../../transit/services/TransitClassifier';
import { BirthChartDocument } from '../../birthchart';
import { LifeThemeKey } from '../../life-theme';

export enum InsightSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export enum InsightCategory {
  GROWTH = 'GROWTH',
  KARMIC = 'KARMIC',
  HEALING = 'HEALING',
  STRENGTHS = 'STRENGTHS',
  PERSONALITY = 'PERSONALITY',
  CAREER = 'CAREER',
  RELATIONSHIPS = 'RELATIONSHIPS',
  HEALTH = 'HEALTH',
  SPIRITUALITY = 'SPIRITUALITY',
  LIFE_PURPOSE = 'LIFE_PURPOSE',
  CHALLENGES = 'CHALLENGES',
  OPPORTUNITIES = 'OPPORTUNITIES',
  FINANCES = 'FINANCES',
  PERSONAL_GROWTH = 'PERSONAL_GROWTH',
  DAILY_GUIDANCE = 'DAILY_GUIDANCE',
  WEEKLY_GUIDANCE = 'WEEKLY_GUIDANCE',
  THEME_GUIDANCE = 'THEME_GUIDANCE'
} 

export enum InsightType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  WEEKLY_DIGEST = 'weekly_digest',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  LIFE_THEME = 'life_theme',
  TRANSIT = 'transit',
  CORE_IDENTITY = 'core_identity',
  ASPECT = 'aspect',
  PATTERN = 'pattern',
  BIRTH_CHART = 'birth_chart',
  NODE_PATH = 'node_path',
  HOUSE_THEMES = 'house_themes',
  HOUSE_LORDS = 'house_lords',
  THEME_FORECAST = 'theme_forecast'
}

export enum InsightCacheKey {
  DAILY = 'DAILY',
  WEEKLY_DIGEST = 'WEEKLY_DIGEST',
  MONTHLY_DIGEST = 'MONTHLY_DIGEST',
  YEARLY_DIGEST = 'YEARLY_DIGEST',
  LIFE_THEME = 'LIFE_THEME',
  TRANSIT = 'TRANSIT',
  CORE_IDENTITY = 'CORE_IDENTITY',
  ASPECT = 'ASPECT',
  PATTERN = 'PATTERN',
  THEME_FORECAST = 'THEME_FORECAST',
  BIRTH_CHART = 'BIRTH_CHART',
  NODE_PATH = 'NODE_PATH',
  HOUSE_THEMES = 'HOUSE_THEMES',
  HOUSE_LORDS = 'HOUSE_LORDS'
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
  content: string;
  category: InsightCategory;
  severity: InsightSeverity;
  createdAt: Date;
  updatedAt: Date;
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
  aspects: Array<{
    body1: string;
    body2: string;
    type: string;
    orb: number;
    isApplying: boolean;
  }>;
  houses: number[];
  supportingFactors: string[];
  challenges: string[];
  recommendations: string[];
}

export interface PatternInsight extends BaseInsight {
  type: InsightType.PATTERN;
  patternType: string;
  planets: Planet[];
  aspects: Array<{
    body1: string;
    body2: string;
    type: string;
    orb: number;
    isApplying: boolean;
  }>;
  houses: number[];
  supportingFactors: string[];
  challenges: string[];
  recommendations: string[];
  generationMetadata?: GenerationMetadata;
}

export interface LifeThemeInsight extends BaseInsight {
  type: InsightType.LIFE_THEME;
  themeId: string;
}

export interface TransitInsight extends BaseInsight {
  type: InsightType.TRANSIT;
  transitId: string;
  generationMetadata?: GenerationMetadata;
}

export interface BirthChartInsight extends BaseInsight {
  type: InsightType.BIRTH_CHART;
  chartId: string;
}

export interface GenerationMetadata {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  generationTime: number;
}

export interface DailyInsight extends BaseInsight {
  type: InsightType.DAILY;
  date: Date;
  transits: Transit[];
  lifeArea?: LifeArea;
  transitAspect?: string;
  triggeredBy?: string;
  generationMetadata?: GenerationMetadata;
}

export interface WeeklyDigestInsight extends BaseInsight {
  type: InsightType.WEEKLY_DIGEST;
  weekStart: Date;
  weekEnd: Date;
  majorThemes: string[];
  opportunities: string[];
  challenges: string[];
  recommendations: string[];
  generationMetadata?: GenerationMetadata;
}

export interface ThemeForecastInsight extends BaseInsight {
  type: InsightType.THEME_FORECAST;
  forecastPeriod: {
    start: Date;
    end: Date;
  };
  themes: {
    id: string;
    title: string;
    description: string;
    probability: number;
    impact: InsightSeverity;
  }[];
  supportingFactors: string[];
  challenges: string[];
  recommendations: string[];
  generationMetadata?: GenerationMetadata;
}

export interface NodePathInsight extends BaseInsight {
  type: InsightType.NODE_PATH;
  northNodeSign: string;
  northNodeHouse: number;
  southNodeSign: string;
  southNodeHouse: number;
}

export interface HouseThemesInsight extends BaseInsight {
  type: InsightType.HOUSE_THEMES;
  houseThemes: Array<{
    house: number;
    theme: string;
  }>;
}

export interface HouseLordsInsight extends BaseInsight {
  type: InsightType.HOUSE_LORDS;
  houseLords: Array<{
    house: number;
    ruler: string;
  }>;
}

export type Insight = CoreIdentityInsight | AspectInsight | PatternInsight | LifeThemeInsight | TransitInsight | BirthChartInsight | DailyInsight | WeeklyDigestInsight | ThemeForecastInsight | NodePathInsight | HouseThemesInsight | HouseLordsInsight;

export interface InsightAnalysis {
  birthChartId: string;
  userId: string;
  content: string;
  type: InsightType;
  insights: Insight[];
  overallSummary: string;
  createdAt: Date;
  updatedAt: Date;
  birthChart?: BirthChartDocument;
  planets?: Array<{
    id: number;
    sign: string;
    house: number;
    degree: number;
    retrograde: boolean;
  }>;
  aspects?: Array<{
    body1Id: number;
    body2Id: number;
    type: string;
    orb: number;
    isApplying: boolean;
  }>;
  lifeThemes?: Array<{
    id: string;
    title: string;
    description: string;
    supportingAspects: Array<{
      body1: string;
      body2: string;
      type: string;
      orb: number;
    }>;
  }>;
  transits?: Transit[];
  lifeArea?: LifeArea;
  transitAspect?: string;
  triggeredBy?: string;
  majorThemes?: string[];
  opportunities?: string[];
  challenges?: string[];
  recommendations?: string[];
  themes?: Array<{
    id: string;
    title: string;
    description: string;
    probability?: number;
    impact?: InsightSeverity;
    themeKey?: LifeThemeKey;
  }>;
  supportingFactors?: string[];
  relevance?: number;
  tags?: string[];
  status?: string;
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

export interface InsightMetadata {
  date?: Date;
  startDate?: Date;
  planet?: string;
  planets?: string[];
  activePlanets?: string[];
  sign?: string;
  house?: number;
  orb?: number;
  lifeThemeKey?: string;
  lifeArea?: LifeArea;
  transitAspect?: string;
  transitCount?: number;
  themeCount?: number;
  birthChartId?: string;
  triggeredBy?: 'chiron' | 'node' | 'return' | 'retrograde' | 'natal';
  dignity?: Dignity;
  keyTransits?: Array<{
    planet: string;
    sign: string;
    house: number;
    orb: number;
  }>;
  northNode?: {
    sign: string;
    house: number;
  };
  southNode?: {
    sign: string;
    house: number;
  };
  houseThemes?: Array<{
    house: number;
    theme: string;
  }>;
}

export interface InsightLog {
  id: string;
  userId: string;
  insightType: InsightType;
  content: string;
  generatedAt: Date;
  metadata?: InsightMetadata;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  generationTime?: number;
}

export interface TimingWindow {
  type: WindowType;
  title: string;
  startDate: Date;
  endDate: Date;
  transits: Transit[];
  strength: number;
  description: string;
  involvedPlanets: string[];
  aspectType: string;
  keywords: string[];
}

export interface IInsight {
  _id: ObjectId;
  content: string;
  type: string;
  userId: ObjectId;
  birthChartId: ObjectId;
  insights: Array<{
    type: string;
    description: string;
    bodyId: number;
    aspects?: Array<{
      bodyId: number;
      type: string;
      orb: number;
    }>;
  }>;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
  relevance?: number;
  tags?: string[];
} 