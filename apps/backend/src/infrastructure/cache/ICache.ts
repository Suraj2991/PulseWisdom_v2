import { CelestialBody } from '../../types/ephemeris.types';

export interface ICache {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: any, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  keys(pattern: string): Promise<string[]>;
  clear(): Promise<void>;
  exists(key: string): Promise<boolean>;
  getPlanetaryPositions(): Promise<CelestialBody[] | null>;
  setPlanetaryPositions(positions: CelestialBody[]): Promise<void>;
  getBirthChart(id: string): Promise<any | null>;
  setBirthChart(id: string, data: any): Promise<void>;
  deleteBirthChart(id: string): Promise<void>;
  getInsight(id: string): Promise<any | null>;
  setInsight(id: string, data: any): Promise<void>;
  deleteInsight(id: string): Promise<void>;
  clearCache(): Promise<void>;
  disconnect(): Promise<void>;
} 