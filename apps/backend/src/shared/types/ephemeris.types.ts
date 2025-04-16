export interface DateTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  timezone: string;
}

export interface GeoPosition {
  latitude: number;
  longitude: number;
}

export enum HouseSystem {
  PLACIDUS = 'PLACIDUS',
  KOCH = 'KOCH',
  CAMPANUS = 'CAMPANUS',
  REGIOMONTANUS = 'REGIOMONTANUS',
  WHOLE_SIGN = 'WHOLE_SIGN',
  EQUAL = 'EQUAL'
}

export interface CelestialBody {
  id: number;
  name: string;
  longitude: number;
  latitude: number;
  speed: number;
  house: number;
  sign: string;
  signLongitude: number;
}

export interface Houses {
  system: HouseSystem;
  cusps: number[];
}

export interface Angles {
  ascendant: number;
  midheaven: number;
  descendant: number;
  imumCoeli: number;
}

export interface BirthChart {
  datetime: DateTime;
  location: GeoPosition;
  bodies: CelestialBody[];
  houses: {
    system: HouseSystem;
    cusps: number[];
  };
  angles: {
    ascendant: number;
    midheaven: number;
    descendant: number;
    imumCoeli: number;
  };
  aspects: Array<{
    body1: string;
    body2: string;
    aspect: string;
    orb: number;
  }>;
}

export interface Planet {
  id: number;
  name: string;
  sign: string;
  house: number;
  degree: number;
  retrograde: boolean;
}

export interface Aspect {
  body1Id: number;
  body2Id: number;
  type: string;
  angle: number;
  orb: number;
  isApplying: boolean;
} 