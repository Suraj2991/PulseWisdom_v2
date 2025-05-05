export enum LifeThemeKey {
  // Growth Themes
  SELF_DISCOVERY = 'SELF_DISCOVERY',
  PERSONAL_MASTERY = 'PERSONAL_MASTERY',
  RELATIONSHIP_GROWTH = 'RELATIONSHIP_GROWTH',
  CAREER_EVOLUTION = 'CAREER_EVOLUTION',
  
  // Karmic Lessons
  NORTH_NODE_PATH = 'NORTH_NODE_PATH',
  SOUTH_NODE_RELEASE = 'SOUTH_NODE_RELEASE',
  KARMIC_PATTERNS = 'KARMIC_PATTERNS',
  
  // Healing
  CHIRON_WOUND = 'CHIRON_WOUND',
  EMOTIONAL_HEALING = 'EMOTIONAL_HEALING',
  SPIRITUAL_HEALING = 'SPIRITUAL_HEALING',
  
  // Strengths & Gifts
  NATURAL_TALENTS = 'NATURAL_TALENTS',
  SPIRITUAL_GIFTS = 'SPIRITUAL_GIFTS',
  LIFE_PURPOSE = 'LIFE_PURPOSE',
  
  // New themes
  SPIRITUAL_AWAKENING = 'SPIRITUAL_AWAKENING',
  KARMIC_LESSONS = 'KARMIC_LESSONS',
  HEALING_JOURNEY = 'HEALING_JOURNEY',
  CREATIVE_EXPRESSION = 'CREATIVE_EXPRESSION'
}
// Consolidated enum for life areas
export enum LifeArea {
  CAREER = 'career',
  RELATIONSHIPS = 'relationships',
  HEALTH = 'health',
  SPIRITUALITY = 'spirituality',
  PERSONAL_GROWTH = 'personal_growth',
  FINANCES = 'finances',
  EMOTIONAL = 'emotional',
  CREATIVITY = 'creativity'
}

// For backward compatibility
export type FocusArea = LifeArea; 

export enum ThemeCategory {
  GROWTH = 'GROWTH',
  KARMIC = 'KARMIC',
  HEALING = 'HEALING',
  STRENGTHS = 'STRENGTHS'
}

export interface ThemeMetadata {
  requiresUserAction: boolean;
  associatedPlanets: string[];
  lifeAreas: LifeArea[];
  category: ThemeCategory;
  intensity: 'low' | 'medium' | 'high';
  duration: 'short' | 'medium' | 'long';
}

export interface LifeTheme {
  id: string;
  key: LifeThemeKey;
  title: string;
  description: string;
  metadata: ThemeMetadata;
  birthChartId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  insights: string[];
  supportingAspects: Array<{
    body1: string;
    body2: string;
    type: string;
    orb: number;
  }>;
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