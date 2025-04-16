import { DateTime, GeoPosition, CelestialBody } from '../types/ephemeris.types';
import { HouseSystem, HOUSE_SYSTEMS } from '../../shared/constants/astrology';
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
  /** Document creation timestamp */
  createdAt: Date;
  /** Document last update timestamp */
  updatedAt: Date;
}

export type BirthChartDocument = IBirthChart & { _id: ObjectId }; 