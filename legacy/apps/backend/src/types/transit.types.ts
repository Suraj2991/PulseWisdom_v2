import { DateTime } from '@pulsewisdom/astro';

export interface TransitAspect {
  transitPlanet: string;
  natalPlanet: string;
  aspectType: string;
  angle: number;
  orb: number;
  isApplying: boolean;
  strength: 'high' | 'medium' | 'low';
}

export interface TransitWindow {
  startDate: DateTime;
  endDate: DateTime;
  transitPlanet: string;
  aspectType: string;
  natalPlanet: string;
  strength: 'high' | 'medium' | 'low';
  description: string;
  impact: string;
  recommendations: string[];
}

export interface TransitAnalysis {
  birthChartId: string;
  userId: string;
  date: DateTime;
  transits: TransitAspect[];
  windows: TransitWindow[];
  significantEvents: {
    type: 'retrograde' | 'cazimi' | 'star_point' | 'station';
    planet: string;
    date: DateTime;
    description: string;
  }[];
  overallStrength: 'high' | 'medium' | 'low';
  summary: string;
  createdAt: Date;
  updatedAt: Date;
} 