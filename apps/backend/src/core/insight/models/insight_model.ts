import { ObjectId } from 'mongodb';
import { InsightType } from '../types/insight.types';

export interface IInsight {
  /** MongoDB document ID */
  _id: ObjectId;
  /** Main content of the insight */
  content: string;
  /** Type of insight */
  type: InsightType;
  /** Relevance score of the insight (0-1) */
  relevance?: number;
  /** Tags associated with the insight */
  tags?: string[];
  /** ID of the user who owns this insight */
  userId: ObjectId;
  /** ID of the birth chart this insight is based on */
  birthChartId: ObjectId;
  /** Detailed insights about celestial bodies and aspects */
  insights: Array<{
    /** ID of the celestial body (if applicable) */
    bodyId?: number;
    /** Type of insight for this body */
    type: string;
    /** Aspects involving this body (if applicable) */
    aspects?: Array<{
      /** ID of the other body in the aspect */
      bodyId: number;
      /** Type of aspect */
      type: string;
      /** Orb of the aspect in degrees */
      orb: number;
    }>;
    /** Description of the insight */
    description: string;
  }>;
  /** Timestamp of when the insight was generated */
  timestamp: Date;
  /** Document creation timestamp */
  createdAt: Date;
  /** Document last update timestamp */
  updatedAt: Date;
}

export type InsightDocument = IInsight & { _id: ObjectId }; 