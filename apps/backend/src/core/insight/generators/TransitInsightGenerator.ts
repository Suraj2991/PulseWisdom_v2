import { BaseInsightGenerator } from './BaseInsightGenerator';
import { InsightAnalysis, TransitInsight, InsightType, InsightCategory, InsightSeverity } from '../types/insight.types';
import { logger } from '../../../shared/logger';
import { v4 as uuidv4 } from 'uuid';

export class TransitInsightGenerator extends BaseInsightGenerator<TransitInsight> {
  constructor() {
    super(InsightType.TRANSIT);
  }

  generate(analysis: InsightAnalysis): TransitInsight[] {
    try {
      logger.info('Generating transit insights', { transitCount: analysis.transits?.length || 0 });

      if (!analysis.transits) {
        return [];
      }

      const insights = analysis.transits.map(transit => {
        const baseInsight = this.createBaseInsight(
          transit.description || 'Transit insight',
          InsightCategory.OPPORTUNITIES,
          InsightSeverity.MEDIUM
        );

        return {
          ...baseInsight,
          type: this.type,
          transitId: uuidv4(),
          aspects: [],
          houses: [],
          supportingFactors: [],
          challenges: [],
          recommendations: []
        };
      });

      this.logGeneration(analysis, insights.length);
      return insights;
    } catch (error) {
      logger.error('Failed to generate transit insights', { error });
      throw new Error(`Failed to generate transit insights: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 