import { Types } from 'mongoose';

export interface IBodyPosition {
  bodyId: string;
  longitude: number;
  latitude: number;
  distance: number;
  speed: number;
  retrograde: boolean;
  house: number;
  sign: number;
  degree: number;
}

export interface IAspect {
  body1Id: string;
  body2Id: string;
  type: string;
  angle: number;
  orb: number;
  isApplying: boolean;
}

export interface IHouse {
  number: number;
  cusp: number;
  nextCusp: number;
  size: number;
  rulerId: string;
}

export interface IAngles {
  ascendant: number;
  midheaven: number;
  descendant: number;
  imumCoeli: number;
}

export interface IBirthChart {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  datetime: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
    timezone: number;
  };
  location: {
    latitude: number;
    longitude: number;
  };
  bodies: IBodyPosition[];
  houses: IHouse[];
  aspects: IAspect[];
  angles: IAngles;
  createdAt: Date;
  updatedAt: Date;
}

export interface LifeThemeAnalysis {
  birthChartId: string;
  userId: string;
  themes: {
    coreIdentity: {
      ascendant: string;
      sunSign: string;
      moonSign: string;
      description: string;
    };
    strengths: Array<{
      area: string;
      description: string;
    }>;
    challenges: Array<{
      area: string;
      description: string;
      growthOpportunities: string[];
    }>;
    lifeThemes: Array<{
      theme: string;
      description: string;
    }>;
    patterns: Array<{
      type: string;
      description: string;
      planets: string[];
      houses: number[];
    }>;
    houseLords: Array<{
      house: number;
      lord: string;
      dignity: string;
      influence: string;
      aspects: string[];
    }>;
    overallSummary: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface TransitAnalysis {
  birthChartId: string;
  userId: string;
  date: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
    timezone: number;
  };
  transits: Array<{
    planet: string;
    position: IBodyPosition;
    aspects: IAspect[];
  }>;
  windows: Array<{
    startDate: Date;
    endDate: Date;
    interpretation: string;
    actions: string[];
  }>;
  significantEvents: Array<{
    date: Date;
    description: string;
    impact: string;
  }>;
  overallStrength: 'high' | 'medium' | 'low';
  summary: string;
  createdAt: Date;
  updatedAt: Date;
} 