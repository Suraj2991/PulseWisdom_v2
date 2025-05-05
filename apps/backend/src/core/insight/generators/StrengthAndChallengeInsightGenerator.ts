import { BaseInsightGenerator } from './BaseInsightGenerator';
import { InsightAnalysis, AspectInsight, InsightType, InsightCategory, InsightSeverity } from '../types/insight.types';
import { v4 as uuidv4 } from 'uuid';

export class StrengthAndChallengeInsightGenerator extends BaseInsightGenerator<AspectInsight> {
  constructor() {
    super(InsightType.ASPECT);
  }

  generate(analysis: InsightAnalysis): AspectInsight[] {
    const insights: AspectInsight[] = [];
    
    if (analysis.aspects) {
      const majorAspects = analysis.aspects.filter(a => ['conjunction', 'opposition', 'square', 'trine', 'sextile'].includes(a.type));
      
      for (const aspect of majorAspects) {
        const severity = ['opposition', 'square'].includes(aspect.type) ? InsightSeverity.HIGH : InsightSeverity.MEDIUM;
        const category = ['trine', 'sextile'].includes(aspect.type) ? InsightCategory.STRENGTHS : InsightCategory.CHALLENGES;
        
        const baseInsight = this.createBaseInsight(
          `This ${aspect.type} aspect indicates ${category === InsightCategory.STRENGTHS ? 'a natural talent' : 'a potential challenge'} in integrating these planetary energies.`,
          category,
          severity
        );

        insights.push({
          ...baseInsight,
          type: this.type,
          aspectType: aspect.type,
          planet1Id: aspect.body1Id,
          planet2Id: aspect.body2Id,
          aspects: [{
            body1: aspect.body1Id.toString(),
            body2: aspect.body2Id.toString(),
            type: aspect.type,
            orb: aspect.orb,
            isApplying: aspect.isApplying
          }],
          houses: [],
          supportingFactors: [],
          challenges: [],
          recommendations: []
        });
      }
    }

    this.logGeneration(analysis, insights.length);
    return insights;
  }
} 