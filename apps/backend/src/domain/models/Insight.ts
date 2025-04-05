import { Schema, model, Types } from 'mongoose';
import { InsightType } from '../types/insight';
import { CelestialBody } from '../types/ephemeris.types';

export interface IInsight {
  userId: Types.ObjectId;
  birthChartId: Types.ObjectId;
  insights: Array<{
    bodyId?: number;
    type: InsightType;
    aspects?: Array<{
      bodyId: number;
      type: string;
      orb: number;
    }>;
    description: string;
  }>;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const aspectSchema = new Schema({
  bodyId: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  orb: {
    type: Number,
    required: true
  }
}, { _id: false });

const insightSchema = new Schema<IInsight>({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  birthChartId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'BirthChart'
  },
  insights: [{
    bodyId: Number,
    type: {
      type: String,
      enum: Object.values(InsightType),
      required: true
    },
    aspects: [aspectSchema],
    description: {
      type: String,
      required: true
    }
  }],
  timestamp: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

insightSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const InsightModel = model<IInsight>('Insight', insightSchema);
export type Insight = IInsight; 