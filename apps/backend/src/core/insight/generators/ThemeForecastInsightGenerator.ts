import { BaseInsightGenerator } from './BaseInsightGenerator';
import { InsightAnalysis, ThemeForecastInsight, InsightType, InsightCategory, InsightSeverity } from '../types/insight.types';
import { AIService, PromptBuilder } from '../../ai';
import { logger } from '../../../shared/logger';
import { ServiceError } from '../../../domain/errors';

export class ThemeForecastInsightGenerator extends BaseInsightGenerator<ThemeForecastInsight> {
  constructor(
    private readonly aiService: AIService,
    private readonly promptBuilder: PromptBuilder
  ) {
    super(InsightType.THEME_FORECAST);
  }

  async generate(analysis: InsightAnalysis): Promise<ThemeForecastInsight[]> {
    try {
      const insights: ThemeForecastInsight[] = [];
      
      if (!analysis.content) {
        return insights;
      }

      const baseInsight = this.createBaseInsight(
        analysis.content,
        InsightCategory.THEME_GUIDANCE,
        InsightSeverity.MEDIUM
      );

      const insight: ThemeForecastInsight = {
        ...baseInsight,
        type: this.type,
        forecastPeriod: {
          start: new Date(),
          end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        },
        themes: analysis.themes?.map(theme => ({
          id: theme.id,
          title: theme.title,
          description: theme.description,
          probability: theme.probability || 0.5,
          impact: theme.impact || InsightSeverity.MEDIUM
        })) || [],
        supportingFactors: analysis.supportingFactors || [],
        challenges: analysis.challenges || [],
        recommendations: analysis.recommendations || []
      };

      insights.push(insight);
      this.logGeneration(analysis, insights.length);
      return insights;
    } catch (error) {
      logger.error('Failed to generate theme forecast', { error });
      throw new ServiceError(`Failed to generate theme forecast: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 