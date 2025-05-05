import { CelestialBody } from '../../core/ephemeris';

export interface ICache {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(pattern: string): Promise<string[]>;
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
} 