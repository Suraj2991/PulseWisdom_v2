import { BaseInsightGenerator } from './BaseInsightGenerator';
import { InsightAnalysis, DailyInsight, InsightType, InsightCategory, InsightSeverity } from '../types/insight.types';
import { AIService, PromptBuilder } from '../../ai';
import { logger } from '../../../shared/logger';
import { ServiceError } from '../../../domain/errors';

export class DailyInsightGenerator extends BaseInsightGenerator<DailyInsight> {
  constructor(
    private readonly aiService: AIService,
    private readonly promptBuilder: PromptBuilder
  ) {
    super(InsightType.DAILY);
  }

  async generate(analysis: InsightAnalysis): Promise<DailyInsight[]> {
    try {
      const insights: DailyInsight[] = [];
      
      if (!analysis.content) {
        return insights;
      }

      const baseInsight = this.createBaseInsight(
        analysis.content,
        InsightCategory.DAILY_GUIDANCE,
        InsightSeverity.MEDIUM
      );

      const insight: DailyInsight = {
        ...baseInsight,
        type: this.type,
        date: new Date(),
        transits: analysis.transits || [],
        focusArea: analysis.focusArea,
        transitAspect: analysis.transitAspect,
        triggeredBy: analysis.triggeredBy
      };

      insights.push(insight);
      this.logGeneration(analysis, insights.length);
      return insights;
    } catch (error) {
      logger.error('Failed to generate daily insight', { error });
      throw new ServiceError(`Failed to generate daily insight: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 