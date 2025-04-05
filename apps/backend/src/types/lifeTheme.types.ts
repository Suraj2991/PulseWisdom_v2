export interface CoreIdentity {
  ascendant: string;
  sunSign: string;
  moonSign: string;
  description: string;
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

export interface Theme {
  theme: string;
  description: string;
  supportingFactors: string[];
  manifestation: string;
}

export interface HouseLord {
  house: number;
  lord: string;
  dignity: string;
  influence: string;
  aspects: string[];
}

export interface LifeTheme {
  coreIdentity: CoreIdentity;
  strengths: Strength[];
  challenges: Challenge[];
  patterns: Pattern[];
  lifeThemes: Theme[];
  houseLords: HouseLord[];
  overallSummary: string;
}

export interface LifeThemeAnalysis {
  birthChartId: string;
  userId: string;
  themes: LifeTheme;
  createdAt: Date;
  updatedAt: Date;
} 