import { Types } from 'mongoose';
import { InsightType } from '../types/insight.types';

export interface InsightDTO {
  id: string;
  content: string;
  type: InsightType;
  relevance?: number;
  tags?: string[];
  userId: string;
  birthChartId: string;
  insights: Array<{
    bodyId?: number;
    type: string;
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

export interface InsightAnalysisDTO {
  birthChartId: string;
  userId: string;
  content: string;
  type: string;
  relevance?: number;
  tags?: string[];
  status?: 'pending' | 'reviewed' | 'addressed';
  insights: InsightDTO[];
  overallSummary: string;
  createdAt: Date;
  updatedAt: Date;
} 