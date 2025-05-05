export interface TimingWindow {
  startDate: Date;
  endDate: Date;
  type: 'Opportunity' | 'Integration' | 'Challenge' | 'Growth';
  title: string;
  description: string;
  involvedPlanets: string[];
  aspectType: string;
  keywords: string[];
  transits: Transit[];
  strength: number; // 0-1 scale indicating the strength of the timing window
}

export interface Transit {
  planet: string;
  sign: string;
  house: number;
  aspect: string;
  orb: number;
  startDate: Date;
  endDate: Date;
  description: string;
  strength?: number; // Optional strength of the transit
  type?: string; // Optional type of transit
  isRetrograde?: boolean; // Optional flag for retrograde motion
}

export interface InsightLog {
  type: string;
  content: string;
  metadata: {
    date: Date;
    focusArea?: string;
    planet?: string;
    sign?: string;
    house?: number;
    lifeThemeKey?: string;
    triggeredBy?: string;
    northNode?: {
      sign: string;
      house: number;
    };
    southNode?: {
      sign: string;
      house: number;
    };
  };
} 