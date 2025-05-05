import { DateTime, GeoPosition, CelestialBody, HouseSystem } from '../../ephemeris/types/ephemeris.types';
import { ObjectId } from 'mongodb';

export interface IBirthChart {
  /** ID of the user who owns this birth chart */
  userId: string;
  /** Date and time of birth */
  datetime: DateTime;
  /** Geographic location of birth */
  location: GeoPosition;
  /** House system used for calculations */
  houseSystem: HouseSystem;
  /** List of celestial bodies and their positions */
  bodies: CelestialBody[];
  /** List of aspects between celestial bodies */
  aspects: Array<{
    body1: string;
    body2: string;
    type: string;
    orb: number;
  }>;
  /** Important angles in the chart */
  angles: {
    /** Ascendant degree */
    ascendant: number;
    /** Midheaven degree */
    mc: number;
    /** Imum Coeli degree */
    ic: number;
    /** Descendant degree */
    descendant: number;
  };
  /** House system details */
  houses: {
    /** House cusps in degrees */
    cusps: number[];
    /** House system name */
    system: string;
  };
  /** Sun sign */
  sun: string;
  /** Moon sign */
  moon: string;
  /** List of planet positions */
  planets: Array<{
    name: string;
    sign: string;
    house: number;
    degree: number;
  }>;
  /** House placements */
  housePlacements: Array<{
    house: number;
    sign: string;
  }>;
  /** Chiron position */
  chiron: {
    sign: string;
    house: number;
    degree: number;
  };
  /** North Node position */
  northNode: {
    sign: string;
    house: number;
    degree: number;
  };
  /** South Node position */
  southNode: {
    sign: string;
    house: number;
    degree: number;
  };
  /** Document creation timestamp */
  createdAt: Date;
  /** Document last update timestamp */
  updatedAt: Date;
}

export type BirthChartDocument = IBirthChart & { _id: ObjectId }; 