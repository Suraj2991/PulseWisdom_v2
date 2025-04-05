export interface CelestialPosition {
  longitude: number;
  latitude: number;
  distance: number;
  speed: number;
  declination: number;
  rightAscension: number;
  isRetrograde: boolean;
}

export interface CelestialBody {
  sun: CelestialPosition;
  moon: CelestialPosition;
  mercury: CelestialPosition;
  venus: CelestialPosition;
  mars: CelestialPosition;
  jupiter: CelestialPosition;
  saturn: CelestialPosition;
  uranus: CelestialPosition;
  neptune: CelestialPosition;
  pluto: CelestialPosition;
  chiron?: CelestialPosition;
  northNode?: CelestialPosition;
  southNode?: CelestialPosition;
  name: string;
  longitude: number;
  latitude: number;
  speed: number;
  house?: number;
  sign?: string;
}

export interface EphemerisRequest {
  date: Date;
  latitude: number;
  longitude: number;
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
  calculatePositions(request: EphemerisRequest): Promise<CelestialBody>;
  calculateAspects(positions: CelestialBody): Promise<AspectResponse[]>;
  calculateHouses(request: EphemerisRequest): Promise<HouseResponse[]>;
} 