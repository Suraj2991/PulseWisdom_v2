import { CelestialBody, DateTime, GeoPosition } from '../types/ephemeris.types';

export interface CelestialPosition {
  longitude: number;
  latitude: number;
  distance: number;
  speed: number;
  declination: number;
  rightAscension: number;
  isRetrograde: boolean;
}

export interface EphemerisRequest {
  date: DateTime;
  position: GeoPosition;
}

export interface AspectResponse {
  aspectType: string;
  body1: string;
  body2: string;
  orb: number;
  exact: boolean;
}

export interface HouseResponse {
  number: number;
  cusp: number;
  sign: string;
}

export interface IEphemerisClient {
  calculatePositions(request: EphemerisRequest): Promise<CelestialBody[]>;
  calculateAspects(positions: CelestialBody[]): Promise<AspectResponse[]>;
  calculateHouses(request: EphemerisRequest): Promise<HouseResponse[]>;
} 