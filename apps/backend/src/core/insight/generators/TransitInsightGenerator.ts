import { BaseInsightGenerator } from './BaseInsightGenerator';
import { InsightAnalysis, TransitInsight, InsightType, InsightCategory, InsightSeverity } from '../types/insight.types';
import { logger } from '../../../shared/logger';
import { ServiceError } from '../../../domain/errors';
import { AIService, PromptBuilder } from '../../ai';
import { Transit } from '../../transit/types/transit.types';
import { v4 as uuidv4 } from 'uuid';

export class TransitInsightGenerator extends BaseInsightGenerator<TransitInsight> {
  constructor(
    private readonly aiService: AIService,
    private readonly promptBuilder: PromptBuilder
  ) {
    super(InsightType.TRANSIT);
  }

  async generate(analysis: InsightAnalysis): Promise<TransitInsight[]> {
    try {
      logger.info('Generating transit insights', { transitCount: analysis.transits?.length || 0 });

      if (!analysis.birthChart || !analysis.transits) {
        logger.warn('Missing required data for transit insight generation', {
          hasBirthChart: !!analysis.birthChart,
          hasTransits: !!analysis.transits
        });
        return [];
      }

      const insights: TransitInsight[] = [];

      for (const transit of analysis.transits) {
        // Generate transit insight using AI service
        const { insight: transitInsight, log: insightLog } = await this.aiService.generateTransitInsight(transit);

        const baseInsight = this.createBaseInsight(
          transitInsight,
          this.determineTransitCategory(transit),
          this.determineTransitSeverity(transit)
        );

        const insight: TransitInsight = {
          ...baseInsight,
          type: this.type,
          transitId: uuidv4(), // Generate unique ID for each transit insight
          generationMetadata: {
            promptTokens: insightLog.promptTokens || 0,
            completionTokens: insightLog.completionTokens || 0,
            totalTokens: insightLog.totalTokens || 0,
            generationTime: insightLog.generationTime || 0
          }
        };

        insights.push(insight);
      }

      this.logGeneration(analysis, insights.length);
      return insights;
    } catch (error) {
      logger.error('Failed to generate transit insights', { error });
      throw new ServiceError(`Failed to generate transit insights: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private determineTransitSeverity(transit: Transit): InsightSeverity {
    // Determine severity based on transit properties
    if (transit.strength >= 0.8) {
      return InsightSeverity.HIGH;
    } else if (transit.strength >= 0.5) {
      return InsightSeverity.MEDIUM;
    }
    return InsightSeverity.LOW;
  }

  private determineTransitCategory(transit: Transit): InsightCategory {
    // Map transit influence to insight category
    switch (transit.influence?.toLowerCase()) {
      case 'conjunction':
      case 'trine':
      case 'sextile':
        return InsightCategory.OPPORTUNITIES;
      case 'opposition':
      case 'square':
        return InsightCategory.CHALLENGES;
      case 'quincunx':
      case 'semisextile':
        return InsightCategory.GROWTH;
      default:
        // Check planet type for additional categorization
        switch (transit.planet?.toLowerCase()) {
          case 'sun':
          case 'moon':
          case 'ascendant':
            return InsightCategory.PERSONALITY;
          case 'mercury':
            return InsightCategory.GROWTH;
          case 'venus':
            return InsightCategory.RELATIONSHIPS;
          case 'mars':
            return InsightCategory.CAREER;
          case 'jupiter':
            return InsightCategory.OPPORTUNITIES;
          case 'saturn':
            return InsightCategory.CHALLENGES;
          case 'uranus':
            return InsightCategory.GROWTH;
          case 'neptune':
            return InsightCategory.SPIRITUALITY;
          case 'pluto':
            return InsightCategory.KARMIC;
          case 'chiron':
            return InsightCategory.HEALING;
          case 'north node':
          case 'south node':
            return InsightCategory.LIFE_PURPOSE;
          default:
            return InsightCategory.DAILY_GUIDANCE;
        }
    }
  }
} 