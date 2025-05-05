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
      
      if (!analysis.birthChart || !analysis.transits) {
        logger.warn('Missing required data for weekly digest generation', {
          hasBirthChart: !!analysis.birthChart,
          hasTransits: !!analysis.transits
        });
        return insights;
      }

      const weekStart = new Date();
      const weekEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Generate weekly digest using AI service
      const { insight: weeklyInsight, log: insightLog } = await this.aiService.generateWeeklyDigest(
        analysis.birthChart,
        analysis.transits,
        weekStart,
        []  // Optional transit insights
      );

      const baseInsight = this.createBaseInsight(
        weeklyInsight,
        InsightCategory.WEEKLY_GUIDANCE,
        InsightSeverity.MEDIUM
      );

      const insight: WeeklyDigestInsight = {
        ...baseInsight,
        type: this.type,
        weekStart,
        weekEnd,
        majorThemes: analysis.majorThemes || [],
        opportunities: analysis.opportunities || [],
        challenges: analysis.challenges || [],
        recommendations: analysis.recommendations || [],
        generationMetadata: {
          promptTokens: insightLog.promptTokens || 0,
          completionTokens: insightLog.completionTokens || 0,
          totalTokens: insightLog.totalTokens || 0,
          generationTime: insightLog.generationTime || 0
        }
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