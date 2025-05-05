export interface DateTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second?: number;
  timezone?: string;
}

export interface GeoPosition {
  latitude: number;
  longitude: number;
  altitude?: number;
  placeName?: string;
}

export type HouseSystem = 'Placidus' | 'Koch' | 'Porphyrius' | 'Regiomontanus' | 'Campanus' | 'Equal' | 'Whole Sign';

export interface CelestialBody {
  id: number;
  name: string;
  sign: string;
  house: number;
  longitude: number;
  latitude: number;
  speed: number;
  retrograde: boolean;
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

export interface Aspect {
  body1: string;
  body2: string;
  type: string;
  orb: number;
  isApplying: boolean;
}

export interface Planet {
  id: number;
  name: string;
  sign: string;
  house: number;
  degree: number;
  retrograde: boolean;
}

export interface BirthChart {
  datetime: DateTime;
  location: GeoPosition;
  bodies: CelestialBody[];
  houses: Houses;
  aspects: Aspect[];
  angles: Angles;
  sun: string;
  moon: string;
  ascendant: number;
  planets: {
    name: string;
    sign: string;
    house: number;
    degree: number;
  }[];
  housePlacements: {
    house: number;
    sign: string;
  }[];
  chiron: {
    sign: string;
    house: number;
    degree: number;
  };
  northNode: NodePlacement;
  southNode: NodePlacement;
}

export interface NodePlacement {
  sign: string;
  house: number;
  degree: number;
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

export interface CelestialPosition {
  id?: number;
  longitude: number;
  latitude: number;
  speed: number;
  house?: number;
}
