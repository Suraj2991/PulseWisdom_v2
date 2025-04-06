export interface BirthChart {
  sun: string;
  moon: string;
  ascendant: number;
  planets: {
    name: string;
    sign: string;
    house: number;
    degree: number;
  }[];
  aspects: {
    planet1: string;
    planet2: string;
    aspect: string;
    orb: number;
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
  // Add more fields as necessary
}

export interface NodePlacement {
  sign: string;
  house: number;
  degree: number;
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