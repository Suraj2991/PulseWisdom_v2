export interface LifeTheme {
  theme: string;
  description: string;
  influences: string[];
  planetaryAspects: {
    planet: string;
    aspect: string;
    influence: string;
  }[];
  // Add more fields as necessary
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

export interface CelestialBody {
  longitude: number;
} 