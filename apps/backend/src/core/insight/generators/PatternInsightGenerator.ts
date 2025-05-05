import { BaseInsightGenerator } from './BaseInsightGenerator';
import { InsightAnalysis, PatternInsight, InsightType, InsightCategory, InsightSeverity } from '../types/insight.types';

export class PatternInsightGenerator extends BaseInsightGenerator<PatternInsight> {
  constructor() {
    super(InsightType.PATTERN);
  }

  generate(analysis: InsightAnalysis): PatternInsight[] {
    const insights: PatternInsight[] = [];
    
    if (!analysis.planets) {
      return insights;
    }

    const stellium = this.findStellium(analysis.planets);
    if (stellium) {
      const stelliumPlanets = analysis.planets.filter(p => p.sign === stellium.sign);
      const baseInsight = this.createBaseInsight(
        `A concentration of planets in ${stellium.sign} suggests a strong focus and potential mastery in this area of life.`,
        InsightCategory.OPPORTUNITIES,
        InsightSeverity.HIGH
      );

      insights.push({
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
        supportingFactors: ['Concentrated energy', 'Focused potential'],
        challenges: ['Potential for imbalance'],
        recommendations: ['Channel this concentrated energy constructively']
      });
    }

    this.logGeneration(analysis, insights.length);
    return insights;
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
      if (count >= 3) {
        return { sign, count };
      }
    }

    return null;
  }
} 