import { CelestialBody } from './ephemeris.types';

export interface Transit {
  planet: string;
  sign: string;
  house: number;
  orb: number;
  aspectingNatal?: CelestialBody;
  exactDate: Date;
  influence: string;
  strength?: number;
  // Add more fields as necessary
}

export interface TransitFilter {
  minStrength?: number;
  personalPlanetsOnly?: boolean;
  aspectTypes?: string[];
  orb?: number;
}

export interface TransitWindow {
  startDate: Date;
  endDate: Date;
  transits: Transit[];
  significance: number;
  description: string;
}

export interface TransitAnalysis {
  windows: TransitWindow[];
  majorThemes: string[];
  recommendations: string[];
}

export interface TransitAspect {
  planet: string;
  sign: string;
  house: number;
  orb: number;
  aspectingNatal?: CelestialBody;
  exactDate: Date;
  influence: string;
  strength?: number;
  type: string;
  applying: boolean;
} 