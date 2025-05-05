import { BaseInsightGenerator } from './BaseInsightGenerator';
import { InsightAnalysis, PatternInsight, InsightType, InsightCategory, InsightSeverity } from '../types/insight.types';
import { AIService, PromptBuilder } from '../../ai';
import { logger } from '../../../shared/logger';
import { ServiceError } from '../../../domain/errors';

export class PatternInsightGenerator extends BaseInsightGenerator<PatternInsight> {
  constructor(
    private readonly aiService: AIService,
    private readonly promptBuilder: PromptBuilder
  ) {
    super(InsightType.PATTERN);
  }

  async generate(analysis: InsightAnalysis): Promise<PatternInsight[]> {
    try {
      const insights: PatternInsight[] = [];
      
      if (!analysis.birthChart || !analysis.planets) {
        logger.warn('Missing required data for pattern insight generation', {
          hasBirthChart: !!analysis.birthChart,
          hasPlanets: !!analysis.planets
        });
        return insights;
      }

      const stellium = this.findStellium(analysis.planets);
      if (stellium) {
        const stelliumPlanets = analysis.planets.filter(p => p.sign === stellium.sign);

        // Generate pattern insight using AI service
        const { insight: patternInsight, log: insightLog } = await this.aiService.generatePatternInsight({
          type: 'STELLIUM',
          sign: stellium.sign,
          count: stellium.count,
          planets: stelliumPlanets,
          birthChart: analysis.birthChart
        });

        const baseInsight = this.createBaseInsight(
          patternInsight,
          InsightCategory.OPPORTUNITIES,
          InsightSeverity.HIGH
        );

        const insight: PatternInsight = {
          ...baseInsight,
          type: this.type,
          patternType: 'STELLIUM',
          planets: stelliumPlanets.map(p => ({
            id: p.id,
            name: `Planet ${p.id}`,
            sign: p.sign,
            house: p.house,
            degree: p.degree,
            retrograde: p.retrograde
          })),
          aspects: analysis.aspects?.filter(a => 
            stelliumPlanets.some(p => p.id === a.body1Id) && 
            stelliumPlanets.some(p => p.id === a.body2Id)
          ).map(a => ({
            body1: a.body1Id.toString(),
            body2: a.body2Id.toString(),
            type: a.type,
            orb: a.orb,
            isApplying: a.isApplying
          })) || [],
          houses: stelliumPlanets.map(p => p.house),
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
      logger.error('Failed to generate pattern insights', { error });
      throw new ServiceError(`Failed to generate pattern insights: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private findStellium(planets: Array<{
    id: number;
    sign: string;
    house: number;
    degree: number;
    retrograde: boolean;
  }>): { sign: string; count: number } | null {
    const signCounts: Record<string, number> = {};
    
    for (const planet of planets) {
      if (planet.sign) {
        signCounts[planet.sign] = (signCounts[planet.sign] || 0) + 1;
      }
    }

    for (const [sign, count] of Object.entries(signCounts)) {
      if (count >= 3) {  // TODO: Move to configuration
        return { sign, count };
      }
    }

    return null;
  }
} 