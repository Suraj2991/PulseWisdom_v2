import mongoose, { Document } from 'mongoose';
import { DateTime, GeoPosition, HouseSystem, CelestialBody } from '../types/ephemeris.types';

export interface IBirthChart extends Document {
  userId: string;
  datetime: DateTime;
  location: GeoPosition;
  houseSystem: HouseSystem;
  bodies: CelestialBody[];
  angles: {
    ascendant: number;
    mc: number;
    ic: number;
    descendant: number;
  };
  houses: {
    cusps: number[];
    system: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const birthChartSchema = new mongoose.Schema<IBirthChart>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  datetime: {
    type: Object,
    required: true
  },
  location: {
    type: Object,
    required: true
  },
  houseSystem: {
    type: String,
    enum: Object.values(HouseSystem),
    default: HouseSystem.PLACIDUS
  },
  bodies: [{
    id: { type: Number, required: true },
    name: { type: String },
    longitude: { type: Number, required: true },
    latitude: { type: Number, required: true },
    speed: { type: Number, required: true },
    house: { type: Number },
    sign: { type: String },
    signLongitude: { type: Number },
    isRetrograde: { type: Boolean }
  }],
  angles: {
    ascendant: { type: Number, required: true },
    mc: { type: Number, required: true },
    ic: { type: Number, required: true },
    descendant: { type: Number, required: true }
  },
  houses: {
    cusps: [{ type: Number, required: true }],
    system: { type: String, required: true }
  }
}, {
  timestamps: true
});

// Indexes
birthChartSchema.index({ userId: 1, datetime: 1 });
birthChartSchema.index({ 'bodies.id': 1 });
birthChartSchema.index({ 'bodies.sign': 1 });

export const BirthChartModel = mongoose.model<IBirthChart>('BirthChart', birthChartSchema); 