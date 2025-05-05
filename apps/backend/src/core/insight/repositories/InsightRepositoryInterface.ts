import { IInsight } from '../models/insight_model';
import { InsightAnalysis, Insight, InsightType } from '../types/insight.types';

export interface InsightRepositoryInterface {
  // Analysis methods
  getAnalysis(birthChartId: string): Promise<InsightAnalysis | null>;
  saveAnalysis(analysis: InsightAnalysis): Promise<void>;
  getAnalysesByUserId(userId: string): Promise<InsightAnalysis[]>;
  getInsightsByCategory(birthChartId: string, category: string): Promise<Insight[]>;
  updateAnalysis(birthChartId: string, updates: Partial<InsightAnalysis>): Promise<InsightAnalysis>;

  // Insight methods
  findById(id: string): Promise<IInsight | null>;
  findByUserId(userId: string): Promise<IInsight[]>;
  findByBirthChartId(birthChartId: string): Promise<IInsight[]>;
  findByChartIdAndType(birthChartId: string, type: InsightType): Promise<IInsight | null>;
  createInsight(insightData: Omit<IInsight, '_id' | 'createdAt' | 'updatedAt'>): Promise<IInsight>;
  updateInsight(id: string, insightData: Partial<IInsight>): Promise<IInsight | null>;
  deleteInsight(id: string): Promise<boolean>;
} 