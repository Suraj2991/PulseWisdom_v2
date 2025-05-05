import { BaseInsightGenerator } from './BaseInsightGenerator';
import { InsightAnalysis, CoreIdentityInsight, InsightType, InsightCategory, InsightSeverity } from '../types/insight.types';

export class CoreIdentityInsightGenerator extends BaseInsightGenerator<CoreIdentityInsight> {
  constructor() {
    super(InsightType.CORE_IDENTITY);
  }

  generate(analysis: InsightAnalysis): CoreIdentityInsight[] {
    const insights: CoreIdentityInsight[] = [];

    if (!analysis.planets) {
      return insights;
    }

    const sun = analysis.planets.find(p => p.id === 0); // Sun
    const moon = analysis.planets.find(p => p.id === 1); // Moon
    const ascendant = analysis.planets.find(p => p.id === 2); // Ascendant

    if (sun && moon && ascendant) {
      const baseInsight = this.createBaseInsight(
        `Your core identity is shaped by your Sun in ${sun.sign}, Moon in ${moon.sign}, and Ascendant in ${ascendant.sign}.`,
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
  }
}
