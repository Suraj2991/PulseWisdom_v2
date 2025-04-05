import { CelestialBody, DateTime } from './ephemeris.types';

export enum TransitType {
  PLANETARY = 'PLANETARY',
  LUNAR = 'LUNAR',
  SOLAR = 'SOLAR',
  RETROGRADE = 'RETROGRADE',
  STATION = 'STATION',
  HELIACAL = 'HELIACAL'
}

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
  transitPlanet: string;
  aspectType: string;
  natalPlanet: string;
  startDate: DateTime;
  endDate: DateTime;
  description: string;
  strength: 'high' | 'medium' | 'low';
  recommendations: string[];
}

export interface TransitAnalysis {
  date: DateTime;
  transits: TransitAspect[];
  windows: TransitWindow[];
} 