import { BaseInsightGenerator } from './BaseInsightGenerator';
import { InsightAnalysis, WeeklyDigestInsight, InsightType, InsightCategory, InsightSeverity } from '../types/insight.types';
import { AIService, PromptBuilder } from '../../ai';
import { logger } from '../../../shared/logger';
import { ServiceError } from '../../../domain/errors';

export class WeeklyDigestInsightGenerator extends BaseInsightGenerator<WeeklyDigestInsight> {
  constructor(
    private readonly aiService: AIService,
    private readonly promptBuilder: PromptBuilder
  ) {
    super(InsightType.WEEKLY_DIGEST);
  }

  async generate(analysis: InsightAnalysis): Promise<WeeklyDigestInsight[]> {
    try {
      const insights: WeeklyDigestInsight[] = [];
      
      if (!analysis.content) {
        return insights;
      }

      const baseInsight = this.createBaseInsight(
        analysis.content,
        InsightCategory.WEEKLY_GUIDANCE,
        InsightSeverity.MEDIUM
      );

      const insight: WeeklyDigestInsight = {
        ...baseInsight,
        type: this.type,
        weekStart: new Date(),
        weekEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        majorThemes: analysis.majorThemes || [],
        opportunities: analysis.opportunities || [],
        challenges: analysis.challenges || [],
        recommendations: analysis.recommendations || []
      };

      insights.push(insight);
      this.logGeneration(analysis, insights.length);
      return insights;
    } catch (error) {
      logger.error('Failed to generate weekly digest', { error });
      throw new ServiceError(`Failed to generate weekly digest: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 