import { BaseInsightGenerator } from './BaseInsightGenerator';
import { InsightAnalysis, LifeThemeInsight, InsightType, InsightCategory, InsightSeverity } from '../types/insight.types';
import { AIService, PromptBuilder } from '../../ai';
import { logger } from '../../../shared/logger';
import { ServiceError } from '../../../domain/errors';
import { LifeTheme } from '../../life-theme';

export class LifeThemeInsightGenerator extends BaseInsightGenerator<LifeThemeInsight> {
  constructor(
    private readonly aiService: AIService,
    private readonly promptBuilder: PromptBuilder
  ) {
    super(InsightType.LIFE_THEME);
  }

  async generate(analysis: InsightAnalysis): Promise<LifeThemeInsight[]> {
    try {
      const insights: LifeThemeInsight[] = [];
      
      if (!analysis.lifeThemes || analysis.lifeThemes.length === 0) {
        return insights;
      }

      for (const theme of analysis.lifeThemes) {
        const { insight } = await this.aiService.generateLifeThemeInsight(theme as LifeTheme);
        
        const baseInsight = this.createBaseInsight(
          insight,
          InsightCategory.LIFE_PURPOSE,
          InsightSeverity.HIGH
        );

        insights.push({
          ...baseInsight,
          type: this.type,
          themeId: theme.id
        });
      }

      this.logGeneration(analysis, insights.length);
      return insights;
    } catch (error) {
      logger.error('Failed to generate life theme insights', { error });
      throw new ServiceError(`Failed to generate life theme insights: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 