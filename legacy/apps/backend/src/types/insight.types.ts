import { DateTime } from '@pulsewisdom/astro';

export type InsightSeverity = 'high' | 'medium' | 'low';

export enum InsightCategory {
  PERSONALITY = 'personality',
  CAREER = 'career',
  RELATIONSHIPS = 'relationships',
  HEALTH = 'health',
  SPIRITUALITY = 'spirituality',
  LIFE_PURPOSE = 'life_purpose',
  CHALLENGES = 'challenges',
  OPPORTUNITIES = 'opportunities',
  FINANCES = 'finances',
  PERSONAL_GROWTH = 'personal_growth'
}

// Base insight types
export enum InsightType {
  // Astrological insight types
  PLANETARY_POSITION = 'PLANETARY_POSITION',
  HOUSE_POSITION = 'HOUSE_POSITION',
  ASPECT = 'ASPECT',
  RETROGRADE = 'RETROGRADE',
  LUNAR_PHASE = 'LUNAR_PHASE',
  SOLAR_ECLIPSE = 'SOLAR_ECLIPSE',
  LUNAR_ECLIPSE = 'LUNAR_ECLIPSE',
  STATION = 'STATION',
  HELIACAL = 'HELIACAL',
  COSMIC = 'COSMIC',
  
  // Temporal insight types
  DAILY = 'DAILY',
  TRANSIT = 'TRANSIT',
  PROGRESSION = 'PROGRESSION',
  
  // Life theme types
  LIFE_THEME = 'LIFE_THEME',
  BIRTH_CHART = 'BIRTH_CHART'
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

export interface Dignity {
  ruler: boolean;
  exaltation: boolean;
  detriment: boolean;
  fall: boolean;
  score: number;
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

// Astrological insight interface
export interface AstrologicalInsight extends BaseInsight {
  type: InsightType.PLANETARY_POSITION | InsightType.HOUSE_POSITION | InsightType.ASPECT | 
        InsightType.RETROGRADE | InsightType.LUNAR_PHASE | InsightType.SOLAR_ECLIPSE | 
        InsightType.LUNAR_ECLIPSE | InsightType.STATION | InsightType.HELIACAL | InsightType.COSMIC;
  bodyId?: number;
  dignity?: Dignity;
}

// Temporal insight interface
export interface TemporalInsight extends BaseInsight {
  type: InsightType.DAILY | InsightType.TRANSIT | InsightType.PROGRESSION;
  dateRange?: {
    start: DateTime;
    end: DateTime;
  };
}

// Life theme insight interface
export interface LifeThemeInsight extends BaseInsight {
  type: InsightType.LIFE_THEME;
}

// Birth chart insight interface
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