import { IInsightGenerator } from './IInsightGenerator';
import { Insight, InsightCategory, InsightSeverity, InsightAnalysis } from '../types/insight.types';
import { logger } from '../../../shared/logger';

export abstract class BaseInsightGenerator<T extends Insight> implements IInsightGenerator<T> {
  constructor(public readonly type: T['type']) {}

  abstract generate(analysis: InsightAnalysis): Promise<T[]> | T[];

  protected createBaseInsight(
    content: string,
    category: InsightCategory,
    severity: InsightSeverity
  ): Omit<T, 'type'> {
    const baseInsight = {
      content,
      category,
      severity,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return baseInsight as unknown as Omit<T, 'type'>;
  }

  protected logGeneration(analysis: InsightAnalysis, insightCount: number): void {
    logger.info('Generated insights', {
      type: this.type,
      birthChartId: analysis.birthChartId,
      insightCount
    });
  }
} 