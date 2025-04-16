import { InsightCategory, InsightSeverity } from './insight.types';

export interface LifeTheme {
  id: string;
  title: string;
  description: string;
  category: InsightCategory;
  severity: InsightSeverity;
  aspects: string[];
  supportingFactors: string[];
  challenges: string[];
  recommendations: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Strength {
  area: string;
  description: string;
  supportingAspects: string[];
}

export interface Challenge {
  area: string;
  description: string;
  growthOpportunities: string[];
  supportingAspects: string[];
}

export interface Pattern {
  type: string;
  description: string;
  planets: string[];
  houses: number[];
}

export interface CelestialBody {
  longitude: number;
} 