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
      
      if (!analysis.birthChart || !analysis.transits) {
        logger.warn('Missing required data for daily insight generation', {
          hasBirthChart: !!analysis.birthChart,
          hasTransits: !!analysis.transits
        });
        return insights;
      }

      // Generate AI insight using the transit analysis service
      const { insight: aiInsight, insightLog } = await this.aiService.getOrGenerateDailyInsight(
        analysis.birthChart,
        analysis.transits,
        new Date()
      );

      // Create base insight with AI-generated content
      const baseInsight = this.createBaseInsight(
        aiInsight,
        InsightCategory.DAILY_GUIDANCE,
        this.determineSeverity(analysis)
      );

      // Create daily insight with additional transit-specific data
      const dailyInsight: DailyInsight = {
        ...baseInsight,
        type: this.type,
        date: new Date(),
        transits: analysis.transits,
        lifeArea: analysis.lifeArea,
        transitAspect: analysis.transitAspect,
        triggeredBy: analysis.triggeredBy,
        generationMetadata: {
          promptTokens: insightLog.promptTokens || 0,
          completionTokens: insightLog.completionTokens || 0,
          totalTokens: insightLog.totalTokens || 0,
          generationTime: insightLog.generationTime || 0
        }
      };

      insights.push(dailyInsight);
      this.logGeneration(analysis, insights.length);
      
      return insights;
    } catch (error) {
      logger.error('Failed to generate daily insight', { error });
      throw new ServiceError(`Failed to generate daily insight: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private determineSeverity(analysis: InsightAnalysis): InsightSeverity {
    if (!analysis.transits || analysis.transits.length === 0) {
      return InsightSeverity.LOW;
    }

    // Check for challenging aspects
    const hasChallengingAspects = analysis.transits.some(transit => 
      ['opposition', 'square'].includes(transit.type)
    );

    // Check for outer planet involvement
    const hasOuterPlanets = analysis.transits.some(transit =>
      ['Uranus', 'Neptune', 'Pluto'].includes(transit.planet)
    );

    // Determine severity based on aspect types and planets involved
    if (hasChallengingAspects && hasOuterPlanets) {
      return InsightSeverity.HIGH;
    } else if (hasChallengingAspects || hasOuterPlanets) {
      return InsightSeverity.MEDIUM;
    }

    return InsightSeverity.LOW;
  }
} 