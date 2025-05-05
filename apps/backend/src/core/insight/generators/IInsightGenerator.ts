import { Insight, InsightAnalysis } from '../types/insight.types';

export interface IInsightGenerator<T extends Insight = Insight> {
  /**
   * Generate insights based on the provided analysis
   * @param analysis The analysis data to generate insights from
   * @returns Array of generated insights
   */
  generate(analysis: InsightAnalysis): Promise<T[]> | T[];
  
  /**
   * Get the type of insights this generator produces
   */
  readonly type: T['type'];
} 