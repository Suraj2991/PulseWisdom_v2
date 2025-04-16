import { IInsight } from '../models/Insight';

export interface InsightRepositoryInterface {
  createInsight(insightData: Omit<IInsight, '_id' | 'createdAt' | 'updatedAt'>): Promise<IInsight>;
  findById(id: string): Promise<IInsight | null>;
  findByUserId(userId: string): Promise<IInsight[]>;
  findByBirthChartId(birthChartId: string): Promise<IInsight[]>;
  updateInsight(id: string, insightData: Partial<IInsight>): Promise<IInsight | null>;
  deleteInsight(id: string): Promise<boolean>;
  searchInsights(query: string): Promise<IInsight[]>;
} 