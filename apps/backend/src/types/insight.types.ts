import { Types } from 'mongoose';

export enum InsightType {
  BIRTH_CHART = 'BIRTH_CHART',
  TRANSIT = 'TRANSIT',
  LIFE_THEME = 'LIFE_THEME',
  PLANETARY_POSITION = 'PLANETARY_POSITION',
  HOUSE_POSITION = 'HOUSE_POSITION'
}

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

export type InsightSeverity = 'high' | 'medium' | 'low';

export interface Dignity {
  ruler: boolean;
  exaltation: boolean;
  detriment: boolean;
  fall: boolean;
  score: number;
}

export interface Insight {
  id: string;
  type: InsightType;
  description: string;
  category: InsightCategory;
  title: string;
  severity: InsightSeverity;
  aspects: any[];
  houses: any[];
  supportingFactors: string[];
  challenges: string[];
  recommendations: string[];
  date: Date;
  dateRange?: {
    start: any;
    end: any;
  };
  createdAt: Date;
  updatedAt: Date;
  bodyId?: number;
  dignity?: Dignity;
}

export interface InsightAnalysis {
  birthChartId: string;
  userId: string;
  insights: Insight[];
  overallSummary: string;
  createdAt: Date;
  updatedAt: Date;
} 