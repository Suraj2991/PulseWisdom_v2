import { CelestialBody } from '../../ephemeris';
import { WindowType } from '../services/TransitClassifier';
import { AspectType } from '../../../shared/constants/astrology';

export interface Transit {
  planet: string;
  sign: string;
  house?: number;
  orb?: number;
  exactDate: Date;
  aspectingNatal?: {
    name: string;
    id: number;
  };
  type: AspectType;
  isRetrograde: boolean;
  influence: string;
  strength: number;
  windowType: WindowType;
  description?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface TransitFilter {
  minStrength?: number;
  personalPlanetsOnly?: boolean;
  aspectTypes?: string[];
  orb?: number;
}

export interface TransitWindow {
  type: WindowType;
  title: string;
  startDate: Date;
  endDate: Date;
  transits: Transit[];
  significance: number;
  description: string;
  involvedPlanets: string[];
  aspectType: string;
  keywords: string[];
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