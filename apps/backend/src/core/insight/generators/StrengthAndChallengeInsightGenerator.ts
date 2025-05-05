import { BaseInsightGenerator } from './BaseInsightGenerator';
import { InsightAnalysis, AspectInsight, InsightType, InsightCategory, InsightSeverity } from '../types/insight.types';
import { ChartAnalysisService } from '../../ai/services/ChartAnalysisService';
import { logger } from '../../../shared/logger';
import { ServiceError } from '../../../domain/errors';

export class StrengthAndChallengeInsightGenerator extends BaseInsightGenerator<AspectInsight> {
  constructor(
    private readonly chartAnalysisService: ChartAnalysisService
  ) {
    super(InsightType.ASPECT);
  }

  async generate(analysis: InsightAnalysis): Promise<AspectInsight[]> {
    try {
      const insights: AspectInsight[] = [];
      
      if (!analysis.birthChart || !analysis.aspects) {
        logger.warn('Missing required data for strength and challenge insight generation', {
          hasBirthChart: !!analysis.birthChart,
          hasAspects: !!analysis.aspects
        });
        return insights;
      }

      // Get strengths and challenges from AI service
      const [strengths, challenges] = await Promise.all([
        this.chartAnalysisService.analyzeStrengths(analysis.birthChart),
        this.chartAnalysisService.analyzeChallenges(analysis.birthChart)
      ]);

      // Convert strengths to insights
      for (const strength of strengths) {
        const baseInsight = this.createBaseInsight(
          strength.description,
          InsightCategory.STRENGTHS,
          InsightSeverity.MEDIUM
        );

        // Parse aspect strings into aspect objects
        const aspects = strength.supportingAspects.map(aspectStr => {
          const [body1, type, body2] = aspectStr.split(' ');
          return {
            body1,
            body2,
            type,
            orb: 0, // Default orb since it's not in the string format
            isApplying: false // Default since it's not in the string format
          };
        });

        insights.push({
          ...baseInsight,
          type: this.type,
          aspectType: 'strength',
          planet1Id: 0, // Default to Sun
          planet2Id: 0, // Default to Sun
          aspects,
          houses: [],
          supportingFactors: [strength.area],
          challenges: [],
          recommendations: []
        });
      }

      // Convert challenges to insights
      for (const challenge of challenges) {
        const baseInsight = this.createBaseInsight(
          challenge.description,
          InsightCategory.CHALLENGES,
          InsightSeverity.HIGH
        );

        // Parse aspect strings into aspect objects
        const aspects = challenge.supportingAspects.map(aspectStr => {
          const [body1, type, body2] = aspectStr.split(' ');
          return {
            body1,
            body2,
            type,
            orb: 0, // Default orb since it's not in the string format
            isApplying: false // Default since it's not in the string format
          };
        });

        insights.push({
          ...baseInsight,
          type: this.type,
          aspectType: 'challenge',
          planet1Id: 0, // Default to Sun
          planet2Id: 0, // Default to Sun
          aspects,
          houses: [],
          supportingFactors: [],
          challenges: [challenge.area],
          recommendations: []
        });
      }

      this.logGeneration(analysis, insights.length);
      return insights;
    } catch (error) {
      logger.error('Failed to generate strength and challenge insights', { error });
      throw new ServiceError(`Failed to generate strength and challenge insights: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 