export enum InsightType {
  PLANETARY_POSITION = 'PLANETARY_POSITION',
  HOUSE_POSITION = 'HOUSE_POSITION',
  ASPECT = 'ASPECT',
  RETROGRADE = 'RETROGRADE',
  LUNAR_PHASE = 'LUNAR_PHASE',
  SOLAR_ECLIPSE = 'SOLAR_ECLIPSE',
  LUNAR_ECLIPSE = 'LUNAR_ECLIPSE',
  STATION = 'STATION',
  HELIACAL = 'HELIACAL',
  COSMIC = 'COSMIC'
}

export interface Dignity {
  ruler: boolean;
  exaltation: boolean;
  detriment: boolean;
  fall: boolean;
  score: number;
} 