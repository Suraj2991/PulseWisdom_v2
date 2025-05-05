import { BaseInsightGenerator } from './BaseInsightGenerator';
import { InsightAnalysis, CoreIdentityInsight, InsightType, InsightCategory, InsightSeverity } from '../types/insight.types';
import { AIService } from '../../ai';
import { logger } from '../../../shared/logger';
import { ServiceError } from '../../../domain/errors';

export class CoreIdentityInsightGenerator extends BaseInsightGenerator<CoreIdentityInsight> {
  constructor(
    private readonly aiService: AIService
  ) {
    super(InsightType.CORE_IDENTITY);
  }

  async generate(analysis: InsightAnalysis): Promise<CoreIdentityInsight[]> {
    try {
      const insights: CoreIdentityInsight[] = [];

      if (!analysis.birthChart || !analysis.planets) {
        logger.warn('Missing required data for core identity insight generation', {
          hasBirthChart: !!analysis.birthChart,
          hasPlanets: !!analysis.planets
        });
        return insights;
      }

      const sun = analysis.planets.find(p => p.id === 0); // Sun
      const moon = analysis.planets.find(p => p.id === 1); // Moon
      const ascendant = analysis.planets.find(p => p.id === 2); // Ascendant

      if (sun && moon && ascendant) {
        // Generate core identity insight using AI service
        const description = await this.aiService.generateCoreIdentityDescription(analysis.birthChart);

        const baseInsight = this.createBaseInsight(
          description,
          InsightCategory.PERSONALITY,
          InsightSeverity.HIGH
        );

        insights.push({
          ...baseInsight,
          type: this.type,
          sunSign: sun.sign,
          moonSign: moon.sign,
          ascendantSign: ascendant.sign
        });
      }

      this.logGeneration(analysis, insights.length);
      return insights;
    } catch (error) {
      logger.error('Failed to generate core identity insight', { error });
      throw new ServiceError(`Failed to generate core identity insight: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
