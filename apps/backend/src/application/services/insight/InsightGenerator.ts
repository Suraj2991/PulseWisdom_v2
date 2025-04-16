import { AIService } from '../AIService';
import { logger } from '../../../shared/logger';
import { AppError } from '../../../domain/errors';
import { InsightAnalysis, Insight, InsightType, InsightCategory, InsightSeverity, CoreIdentityInsight, AspectInsight, PatternInsight, LifeThemeInsight, TransitInsight } from '../../../domain/types/insight.types';
import { LifeTheme } from '../../../domain/types/lifeTheme.types';
import { TransitAnalysis } from '../../../domain/types/transit.types';
import { Planet } from '../../../shared/types/ephemeris.types';
import { v4 as uuidv4 } from 'uuid';
import { ICache } from '../../../infrastructure/cache/ICache';

export class InsightGenerator {
  constructor(
    private readonly cache: ICache,
    private readonly aiService: AIService
  ) {}

  async generateInsights(analysis: InsightAnalysis): Promise<Insight[]> {
    try {
      logger.info('Generating insights from analysis');
      const insights: Insight[] = [];

      // Generate core identity insights
      insights.push(...this.generateCoreIdentityInsights(analysis));

      // Generate strength and challenge insights
      insights.push(...this.generateStrengthAndChallengeInsights(analysis));

      // Generate pattern insights
      insights.push(...this.generatePatternInsights(analysis));

      // Generate life theme insights
      if (analysis.lifeThemes) {
        insights.push(...this.generateLifeThemeInsights(analysis.lifeThemes));
      }

      // Generate transit insights
      if (analysis.transits) {
        insights.push(...this.generateTransitInsights(analysis.transits));
      }

      return insights;
    } catch (error) {
      logger.error('Failed to generate insights', { error });
      throw new AppError('Failed to generate insights: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async generateDailyInsight(birthChartId: string): Promise<string> {
    try {
      logger.info('Generating daily insight', { birthChartId });
      const prompt = `Generate a daily insight for birth chart ${birthChartId}`;
      const insight = await this.aiService.generateText(prompt);
      return insight;
    } catch (error) {
      logger.error('Failed to generate daily insight', { error, birthChartId });
      throw new AppError('Failed to generate daily insight: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  private generateCoreIdentityInsights(analysis: InsightAnalysis): CoreIdentityInsight[] {
    const insights: CoreIdentityInsight[] = [];
    
    if (analysis.planets) {
      const sun = analysis.planets.find(p => p.id === 0);
      const moon = analysis.planets.find(p => p.id === 1);
      const ascendant = analysis.planets.find(p => p.id === 10);

      if (sun && moon && ascendant) {
        insights.push({
          id: uuidv4(),
          type: InsightType.CORE_IDENTITY,
          category: InsightCategory.STRENGTHS,
          severity: InsightSeverity.HIGH,
          title: 'Core Identity',
          description: `Your Sun in ${sun.sign} with Moon in ${moon.sign} and Ascendant in ${ascendant.sign} suggests a strong sense of self and emotional depth.`,
          date: new Date(),
          sunSign: sun.sign,
          moonSign: moon.sign,
          ascendantSign: ascendant.sign,
          aspects: analysis.aspects,
          houses: [sun.house, moon.house, ascendant.house],
          supportingFactors: ['Strong sense of self', 'Emotional depth'],
          challenges: ['Potential for self-absorption'],
          recommendations: ['Focus on balancing personal needs with others']
        });
      }
    }

    return insights;
  }

  private generateStrengthAndChallengeInsights(analysis: InsightAnalysis): AspectInsight[] {
    const insights: AspectInsight[] = [];
    
    if (analysis.aspects) {
      const majorAspects = analysis.aspects.filter(a => ['conjunction', 'opposition', 'square', 'trine', 'sextile'].includes(a.type));
      
      for (const aspect of majorAspects) {
        const severity = ['opposition', 'square'].includes(aspect.type) ? InsightSeverity.HIGH : InsightSeverity.MEDIUM;
        const category = ['trine', 'sextile'].includes(aspect.type) ? InsightCategory.STRENGTHS : InsightCategory.CHALLENGES;
        
        insights.push({
          id: uuidv4(),
          type: InsightType.ASPECT,
          category,
          severity,
          title: `${aspect.type} between planets ${aspect.body1Id} and ${aspect.body2Id}`,
          description: `This ${aspect.type} aspect indicates ${category === InsightCategory.STRENGTHS ? 'a natural talent' : 'a potential challenge'} in integrating these planetary energies.`,
          date: new Date(),
          aspectType: aspect.type,
          planet1Id: aspect.body1Id,
          planet2Id: aspect.body2Id,
          aspects: [aspect],
          houses: [],
          supportingFactors: [],
          challenges: [],
          recommendations: []
        });
      }
    }

    return insights;
  }

  private generatePatternInsights(analysis: InsightAnalysis): PatternInsight[] {
    const insights: PatternInsight[] = [];
    
    if (analysis.planets) {
      const stellium = this.findStellium(analysis.planets);
      if (stellium) {
        const stelliumPlanets = analysis.planets.filter(p => p.sign === stellium.sign);
        insights.push({
          id: uuidv4(),
          type: InsightType.PATTERN,
          category: InsightCategory.OPPORTUNITIES,
          severity: InsightSeverity.HIGH,
          title: 'Stellium Pattern',
          description: `A concentration of planets in ${stellium.sign} suggests a strong focus and potential mastery in this area of life.`,
          date: new Date(),
          patternType: 'STELLIUM',
          planets: stelliumPlanets,
          aspects: analysis.aspects?.filter(a => 
            stelliumPlanets.some(p => p.id === a.body1Id) && 
            stelliumPlanets.some(p => p.id === a.body2Id)
          ),
          houses: stelliumPlanets.map(p => p.house),
          supportingFactors: ['Concentrated energy', 'Focused potential'],
          challenges: ['Potential for imbalance'],
          recommendations: ['Channel this concentrated energy constructively']
        });
      }
    }

    return insights;
  }

  private generateLifeThemeInsights(lifeThemes: LifeTheme[]): LifeThemeInsight[] {
    return lifeThemes.map(theme => ({
      id: uuidv4(),
      type: InsightType.LIFE_THEME,
      category: theme.category,
      severity: theme.severity,
      title: theme.title,
      description: theme.description,
      date: new Date(),
      themeId: theme.id,
      aspects: [],
      houses: [],
      supportingFactors: theme.supportingFactors,
      challenges: theme.challenges,
      recommendations: theme.recommendations
    }));
  }

  private generateTransitInsights(transits: TransitAnalysis[]): TransitInsight[] {
    return transits.map(transit => ({
      id: uuidv4(),
      type: InsightType.TRANSIT,
      category: InsightCategory.OPPORTUNITIES,
      severity: InsightSeverity.MEDIUM,
      title: 'Transit Analysis',
      description: transit.majorThemes.join(', '),
      date: new Date(),
      transitId: uuidv4(),
      aspects: [],
      houses: [],
      supportingFactors: [],
      challenges: [],
      recommendations: transit.recommendations
    }));
  }

  private findStellium(planets: Planet[]): { sign: string; count: number } | null {
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

  public generateOverallSummary(insights: Insight[]): string {
    const highSeverityInsights = insights.filter(i => i.severity === InsightSeverity.HIGH);
    const opportunities = insights.filter(i => i.category === InsightCategory.OPPORTUNITIES);
    const challenges = insights.filter(i => i.category === InsightCategory.CHALLENGES);

    return `Analysis reveals ${highSeverityInsights.length} significant insights, with ${opportunities.length} opportunities and ${challenges.length} challenges.`;
  }
} 