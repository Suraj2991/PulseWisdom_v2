import { LLMClient, PromptBuilder } from '..';

import { LifeTheme } from '../../life-theme';
import { BirthChart, NodePlacement, CelestialBody } from '../../ephemeris';
import { HouseTheme
  , HouseLord
  , InsightMetadata
  , getPrimaryTransit
  , createInsightLog
  , determineTransitFocusArea
  , determineTransitTrigger
  } from '../../insight';
import { logger } from '../../../shared/logger';
import { ServiceError, AppError } from '../../../domain/errors';
import { ICache } from '../../../infrastructure/cache/ICache';
import { BirthChartDocument, adaptBirthChartData } from '../../birthchart';
import { AstrologyUtils } from '../../../shared/utils/astrology';
import { ObjectId } from 'mongodb';
import { config } from '../../../shared/config'
import { sanitizeText } from '../../../shared/utils/aiUtils';
import { TimingWindow, InsightLog, InsightType } from '../../insight/types/insight.types';
import { Transit } from '../../transit/types/transit.types';
import { AspectType } from '../../../shared/constants/astrology';


interface Strength {
  area: string;
  description: string;
  supportingAspects: string[];
}

interface Challenge {
  area: string;
  description: string;
  growthOpportunities: string[];
  supportingAspects: string[];
}

interface Pattern {
  type: string;
  description: string;
  planets: string[];
  houses: number[];
}

export class AIService {
  private readonly CACHE_PREFIX = 'ai:insight:';
  private readonly CACHE_TTL = config.ai.timeoutMs / 1000; // Convert ms to seconds

  constructor(
    private readonly llmClient: LLMClient,
    private readonly cache: ICache
  ) {}

  private getCacheKey(type: string, id: string): string {
    return `${this.CACHE_PREFIX}${type}:${id}`;
  }

  async generateLifeThemeInsight(themeData: LifeTheme): Promise<{ insight: string; log: Partial<InsightLog> }> {
    try {
      this.logStartInsightGeneration('life theme', themeData.id);
      const prompt = PromptBuilder.buildLifeThemePrompt(themeData, true);
      const insight = await this.generateInsightWithRetry(prompt);
      const log = this.createInsightLog(InsightType.LIFE_THEME, themeData.id, insight, {
        lifeThemeKey: themeData.key,
        focusArea: themeData.metadata?.lifeAreas?.[0] ?? undefined,
        date: new Date()
      });
      this.logCompletion('life theme', themeData.id);
      return { insight, log };
    } catch (error) {
      this.handleInsightError(error, themeData.id, themeData.id);
      throw error;
    }
  }

  async generateTransitInsight(transitData: Transit): Promise<{ insight: string; log: Partial<InsightLog> }> {
    try {
      this.logStartInsightGeneration('transit', transitData.planet);
      const prompt = PromptBuilder.buildTransitPrompt(transitData, true);
      const insight = await this.generateInsightWithRetry(prompt);
      const log = this.createInsightLog(InsightType.TRANSIT, transitData.planet, insight, {
        planet: transitData.planet,
        sign: transitData.sign,
        house: transitData.house,
        orb: transitData.orb,
        date: transitData.exactDate,
        transitAspect: transitData.aspectingNatal ? `${transitData.planet} ${transitData.type} ${transitData.aspectingNatal.name}` : undefined,
        triggeredBy: determineTransitTrigger(transitData),
        focusArea: determineTransitFocusArea(transitData)
      });
      this.logCompletion('transit', transitData.planet);
      return { insight, log };
    } catch (error) {
      this.handleInsightError(error, transitData.planet, transitData.planet);
      throw error;
    }
  }

  async generateNatalChartInsight(birthChart: BirthChartDocument): Promise<{ insight: string; log: InsightLog }> {
    try {
      this.logStartInsightGeneration('natal chart', birthChart._id);
      
      // Extract key placements for metadata
      const sun = birthChart.bodies.find(b => b.name === 'Sun');
      const moon = birthChart.bodies.find(b => b.name === 'Moon');
      const ascendant = birthChart.bodies.find(b => b.name === 'Ascendant');
      
      // Get additional aspects for moon and ascendant
      const moonAspects = birthChart.aspects.filter(a => 
        a.body1 === 'Moon' || a.body2 === 'Moon'
      );
      const ascendantAspects = birthChart.aspects.filter(a => 
        a.body1 === 'Ascendant' || a.body2 === 'Ascendant'
      );

      const prompt = PromptBuilder.buildNatalChartPrompt(this.convertToBirthChart(birthChart), true);
      const insight = await this.generateInsightWithRetry(prompt);
      
      const log = this.createInsightLog(InsightType.BIRTH_CHART, birthChart._id.toString(), insight, {
        date: new Date(),
        focusArea: 'Core Identity',
        // Sun placement
        planet: sun?.name,
        sign: sun?.sign,
        house: sun?.house,
        // Additional planets array for moon and ascendant
        planets: ['Moon', 'Ascendant'],
        // Active planets array for aspects
        activePlanets: [
          ...moonAspects.map(a => a.body1 === 'Moon' ? a.body2 : a.body1),
          ...ascendantAspects.map(a => a.body1 === 'Ascendant' ? a.body2 : a.body1)
        ],
        // Key transits array to include moon and ascendant aspects
        keyTransits: [
          ...moonAspects.map(a => ({
            planet: a.body1 === 'Moon' ? a.body2 : a.body1,
            sign: moon?.sign || '',
            house: moon?.house || 0,
            orb: a.orb
          })),
          ...ascendantAspects.map(a => ({
            planet: a.body1 === 'Ascendant' ? a.body2 : a.body1,
            sign: ascendant?.sign || '',
            house: ascendant?.house || 0,
            orb: a.orb
          }))
        ],
        lifeThemeKey: 'core_identity',
        triggeredBy: 'natal'
      });

      this.logCompletion('natal chart', birthChart._id);
      return { insight, log };
    } catch (error) {
      this.handleInsightError(error, birthChart._id.toString(), birthChart._id.toString());
      throw error;
    }
  }

  private logStartInsightGeneration(type: string, id: unknown): void {
    logger.info(`Starting ${type} insight generation`, { 
      id: String(id),
      insightType: type
    });
  }

  private logCompletion(type: string, id: unknown): void {
    logger.info(`Completed ${type} insight generation`, { 
      id: String(id),
      insightType: type
    });
  }

  private async generateInsightWithRetry(prompt: string): Promise<string> {
    const sanitizedPrompt = sanitizeText(prompt);
    try {
        const insight = await this.llmClient.generateInsight(sanitizedPrompt);
        return sanitizeText(insight);
    } catch (error) {
        logger.warn('First attempt failed, retrying...', { error });
        const insight = await this.llmClient.generateInsight(sanitizedPrompt);
        return sanitizeText(insight);
    }
  }

  private createInsightLog(
    userId: string,
    chartId: string,
    type: string,
    metadata: InsightMetadata
  ): InsightLog {
    return {
      id: new ObjectId().toString(),
      userId,
      insightType: type as InsightType,
      content: '',
      generatedAt: new Date(),
      metadata
    };
  }

  private handleInsightError(error: unknown, userId: string, chartId: string): void {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Error generating insights:', { 
      error: errorMessage, 
      userId, 
      chartId,
      insightType: 'unknown'
    });
    
    const errorLog = createInsightLog(
      InsightType.DAILY,
      '',
      { date: new Date() },
      userId
    );
    
    logger.error('Insight error occurred', { 
      errorLog,
      userId,
      chartId,
      insightType: 'ERROR'
    });
  }

  private convertToBirthChart(birthChart: BirthChartDocument): BirthChart {
    return adaptBirthChartData(birthChart);
  }
  
  private getChironPlacement(birthChart: BirthChartDocument): NodePlacement {
    const chiron = birthChart.bodies.find(body => body.name === 'Chiron');
    return {
      sign: chiron ? chiron.sign : '',
      house: chiron ? chiron.house : 0,
      degree: chiron ? chiron.longitude % 30 : 0
    };
  }

  private getNodePlacement(node: CelestialBody | undefined, _nodeName: string): NodePlacement {
    return {
      sign: node ? node.sign : '',
      house: node ? node.house : 0,
      degree: node ? node.longitude % 30 : 0
    };
  }

  async analyzeStrengths(birthChart: BirthChartDocument): Promise<Strength[]> {
    try {
      this.logStartInsightGeneration('strengths', birthChart._id);
      
      const chart = this.convertToBirthChart(birthChart);
      const chironPlacement = this.getChironPlacement(birthChart);
      const northNode = this.getNodePlacement(
        birthChart.bodies.find(body => body.name === 'North Node'),
        'North Node'
      );
      const southNode = this.getNodePlacement(
        birthChart.bodies.find(body => body.name === 'South Node'),
        'South Node'
      );

      // Get mechanical analysis
      const mechanicalStrengths = this.extractStrengthsFromChart(chart);
      
      // Get AI insights
      const prompt = PromptBuilder.buildStrengthsPrompt(mechanicalStrengths, true);
      const insight = await this.generateInsightWithRetry(prompt);
      
      // Combine mechanical and AI analysis
      const enhancedStrengths = this.enhanceStrengthsWithAI(mechanicalStrengths, insight, {
        chironPlacement,
        northNode,
        southNode
      });

      this.logCompletion('strengths', birthChart._id);
      return enhancedStrengths;
    } catch (error) {
      this.handleInsightError(error, birthChart._id.toString(), birthChart._id.toString());
      throw error;
    }
  }

  async analyzeChallenges(birthChart: BirthChartDocument): Promise<Challenge[]> {
    try {
      this.logStartInsightGeneration('challenges', birthChart._id);
      
      const chart = this.convertToBirthChart(birthChart);
      const chironPlacement = this.getChironPlacement(birthChart);
      const northNode = this.getNodePlacement(
        birthChart.bodies.find(body => body.name === 'North Node'),
        'North Node'
      );
      const southNode = this.getNodePlacement(
        birthChart.bodies.find(body => body.name === 'South Node'),
        'South Node'
      );

      // Get mechanical analysis
      const mechanicalChallenges = this.extractChallengesFromChart(chart);
      
      // Get AI insights
      const prompt = PromptBuilder.buildChallengesPrompt(mechanicalChallenges, true);
      const insight = await this.generateInsightWithRetry(prompt);
      
      // Combine mechanical and AI analysis
      const enhancedChallenges = this.enhanceChallengesWithAI(mechanicalChallenges, insight, {
        chironPlacement,
        northNode,
        southNode
      });

      this.logCompletion('challenges', birthChart._id);
      return enhancedChallenges;
    } catch (error) {
      this.handleInsightError(error, birthChart._id.toString(), birthChart._id.toString());
      throw error;
    }
  }

  async analyzePatterns(birthChart: BirthChartDocument): Promise<Pattern[]> {
    try {
      this.logStartInsightGeneration('patterns', birthChart._id);
      
      const chart = this.convertToBirthChart(birthChart);
      const chironPlacement = this.getChironPlacement(birthChart);
      const northNode = this.getNodePlacement(
        birthChart.bodies.find(body => body.name === 'North Node'),
        'North Node'
      );
      const southNode = this.getNodePlacement(
        birthChart.bodies.find(body => body.name === 'South Node'),
        'South Node'
      );

      // Get mechanical analysis
      const mechanicalPatterns = this.extractPatternsFromChart(chart);
      
      // Get AI insights
      const prompt = PromptBuilder.buildPatternsPrompt(mechanicalPatterns, true);
      const insight = await this.generateInsightWithRetry(prompt);
      
      // Combine mechanical and AI analysis
      const enhancedPatterns = this.enhancePatternsWithAI(mechanicalPatterns, insight, {
        chironPlacement,
        northNode,
        southNode
      });

      this.logCompletion('patterns', birthChart._id);
      return enhancedPatterns;
    } catch (error) {
      this.handleInsightError(error, birthChart._id.toString(), birthChart._id.toString());
      throw error;
    }
  }

  private extractStrengthsFromChart(chart: BirthChart): Strength[] {
    const strengths: Strength[] = [];
    const harmoniousConnections = chart.aspects.filter(aspect => 
      ['trine', 'sextile'].includes(aspect.type.toLowerCase())
    );

    harmoniousConnections.forEach(aspect => {
      const body1 = chart.bodies.find(b => b.id === Number(aspect.body1));
      const body2 = chart.bodies.find(b => b.id === Number(aspect.body2));
      
      if (body1 && body2) {
        strengths.push({
          area: `${body1.name} ${aspect.type} ${body2.name}`,
          description: `Harmonious connection between ${body1.name} and ${body2.name}`,
          supportingAspects: [aspect.type]
        });
      }
    });

    return strengths;
  }

  private extractChallengesFromChart(chart: BirthChart): Challenge[] {
    const challenges: Challenge[] = [];
    const dynamicTensions = chart.aspects.filter(aspect => 
      ['square', 'opposition'].includes(aspect.type.toLowerCase())
    );

    dynamicTensions.forEach(aspect => {
      const body1 = chart.bodies.find(b => b.id === Number(aspect.body1));
      const body2 = chart.bodies.find(b => b.id === Number(aspect.body2));
      
      if (body1 && body2) {
        challenges.push({
          area: `${body1.name} ${aspect.type} ${body2.name}`,
          description: `Dynamic tension between ${body1.name} and ${body2.name}`,
          growthOpportunities: [aspect.type],
          supportingAspects: [aspect.type]
        });
      }
    });

    return challenges;
  }

  private extractPatternsFromChart(chart: BirthChart): Pattern[] {
    const patterns: Pattern[] = [];
    const planetCountsBySign = new Map<string, number>();
    
    chart.bodies.forEach(body => {
      const count = planetCountsBySign.get(body.sign) || 0;
      planetCountsBySign.set(body.sign, count + 1);
    });

    planetCountsBySign.forEach((count, sign) => {
      if (count >= 3) {
        const planets = chart.bodies
          .filter(body => body.sign === sign)
          .map(body => body.name);

        patterns.push({
          type: 'stellium',
          description: `Concentration of ${count} planets in ${sign}`,
          planets,
          houses: [chart.bodies.find(b => b.sign === sign)?.house || 1]
        });
      }
    });

    return patterns;
  }

  private enhanceStrengthsWithAI(
    mechanicalStrengths: Strength[],
    aiInsight: string,
    placements: {
      chironPlacement: NodePlacement;
      northNode: NodePlacement;
      southNode: NodePlacement;
    }
  ): Strength[] {
    // Add Chiron-related strengths
    if (placements.chironPlacement.sign) {
      mechanicalStrengths.push({
        area: 'Healing & Growth',
        description: `Strong potential for healing and growth through ${placements.chironPlacement.sign} energy`,
        supportingAspects: ['Chiron Placement']
      });
    }

    // Add Node-related strengths
    if (placements.northNode.sign) {
      mechanicalStrengths.push({
        area: 'Life Purpose',
        description: `Clear direction for growth and evolution through ${placements.northNode.sign} energy`,
        supportingAspects: ['North Node Placement']
      });
    }

    // Parse AI insight to extract additional strengths
    const aiStrengths = this.parseAIInsightForStrengths(aiInsight);
    return [...mechanicalStrengths, ...aiStrengths];
  }

  private enhanceChallengesWithAI(
    mechanicalChallenges: Challenge[],
    aiInsight: string,
    placements: {
      chironPlacement: NodePlacement;
      northNode: NodePlacement;
      southNode: NodePlacement;
    }
  ): Challenge[] {
    // Add Chiron-related challenges
    if (placements.chironPlacement.sign) {
      mechanicalChallenges.push({
        area: 'Healing Journey',
        description: `Opportunity for deep healing in ${placements.chironPlacement.sign} areas`,
        growthOpportunities: ['Emotional Healing', 'Personal Growth'],
        supportingAspects: ['Chiron Placement']
      });
    }

    // Add Node-related challenges
    if (placements.southNode.sign) {
      mechanicalChallenges.push({
        area: 'Karmic Patterns',
        description: `Release of old patterns associated with ${placements.southNode.sign} energy`,
        growthOpportunities: ['Letting Go', 'Transformation'],
        supportingAspects: ['South Node Placement']
      });
    }

    // Parse AI insight to extract additional challenges
    const aiChallenges = this.parseAIInsightForChallenges(aiInsight);
    return [...mechanicalChallenges, ...aiChallenges];
  }

  private enhancePatternsWithAI(
    mechanicalPatterns: Pattern[],
    aiInsight: string,
    placements: {
      chironPlacement: NodePlacement;
      northNode: NodePlacement;
      southNode: NodePlacement;
    }
  ): Pattern[] {
    // Add Chiron-related patterns
    if (placements.chironPlacement.sign) {
      mechanicalPatterns.push({
        type: 'Healing Pattern',
        description: `Recurring themes of healing and growth in ${placements.chironPlacement.sign}`,
        planets: ['Chiron'],
        houses: [placements.chironPlacement.house]
      });
    }

    // Add Node-related patterns
    if (placements.northNode.sign && placements.southNode.sign) {
      mechanicalPatterns.push({
        type: 'Karmic Pattern',
        description: `Balance between past (${placements.southNode.sign}) and future (${placements.northNode.sign})`,
        planets: ['North Node', 'South Node'],
        houses: [placements.northNode.house, placements.southNode.house]
      });
    }

    // Parse AI insight to extract additional patterns
    const aiPatterns = this.parseAIInsightForPatterns(aiInsight);
    return [...mechanicalPatterns, ...aiPatterns];
  }

  private parseAIInsightForStrengths(insight: string): Strength[] {
    // TODO: Implement AI insight parsing for strengths
    // This would use NLP to extract strength-related information from the AI insight
    return [];
  }

  private parseAIInsightForChallenges(insight: string): Challenge[] {
    // TODO: Implement AI insight parsing for challenges
    // This would use NLP to extract challenge-related information from the AI insight
    return [];
  }

  private parseAIInsightForPatterns(insight: string): Pattern[] {
    // TODO: Implement AI insight parsing for patterns
    // This would use NLP to extract pattern-related information from the AI insight
    return [];
  }

  async analyzeHouseThemes(birthChart: BirthChartDocument): Promise<HouseTheme[]> {
    try {
      return [
        {
          house: 1,
          theme: 'Self-Identity',
          description: 'Strong focus on personal identity and self-expression',
          planets: ['Sun', 'Mars'],
          aspects: [{
            body1Id: 0,
            body2Id: 4,
            type: 'Conjunction',
            angle: 0,
            orb: 1,
            isApplying: true
          }]
        },
        {
          house: 7,
          theme: 'Relationships',
          description: 'Emphasis on partnerships and one-on-one connections',
          planets: ['Venus', 'Jupiter'],
          aspects: [{
            body1Id: 0,
            body2Id: 4,
            type: 'Trine',
            angle: 0,
            orb: 1,
            isApplying: true
          }]
        }
      ];
    } catch (error) {
      logger.error('Failed to analyze house themes', { 
        error, 
        birthChartId: birthChart._id.toString(),
        userId: birthChart.userId.toString(),
        insightType: 'house_themes'
      });
      throw new ServiceError(`Failed to analyze house themes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async analyzeHouseLords(birthChart: BirthChartDocument): Promise<HouseLord[]> {
    try {
      const cacheKey = this.getCacheKey('houseLords', birthChart._id.toString());
      const cached = await this.cache.get<HouseLord[]>(cacheKey);
      if (cached) {
        logger.info('Retrieved house lords from cache', { 
          birthChartId: birthChart._id.toString(),
          userId: birthChart.userId.toString(),
          insightType: 'house_lords'
        });
        return cached;
      }

      const houseLords = [
        {
          house: 1,
          lord: 'Mars',
          dignity: {
            ruler: true,
            exaltation: false,
            detriment: false,
            fall: false,
            score: 0.8
          },
          influence: 'Strong',
          aspects: ['Conjunction with Sun', 'Trine with Jupiter']
        },
        {
          house: 7,
          lord: 'Venus',
          dignity: {
            ruler: false,
            exaltation: true,
            detriment: false,
            fall: false,
            score: 0.9
          },
          influence: 'Very Strong',
          aspects: ['Trine with Jupiter', 'Sextile with Moon']
        }
      ];

      await this.cache.set(cacheKey, houseLords, this.CACHE_TTL);
      logger.info('Cached house lords analysis', { 
        birthChartId: birthChart._id.toString(),
        userId: birthChart.userId.toString(),
        insightType: 'house_lords'
      });
      return houseLords;
    } catch (error) {
      logger.error('Failed to analyze house lords', { 
        error, 
        birthChartId: birthChart._id.toString(),
        userId: birthChart.userId.toString(),
        insightType: 'house_lords'
      });
      throw new ServiceError(`Failed to analyze house lords: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async analyzeTimingWindows(birthChart: BirthChartDocument): Promise<TimingWindow[]> {
    try {
      const cacheKey = this.getCacheKey('timingWindows', birthChart._id.toString());
      const cached = await this.cache.get<TimingWindow[]>(cacheKey);
      if (cached) {
        logger.info('Retrieved timing windows from cache', { 
          birthChartId: birthChart._id.toString(),
          userId: birthChart.userId.toString(),
          insightType: 'timing_windows'
        });
        return cached;
      }

      const timingWindows: TimingWindow[] = [
        {
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          type: 'Opportunity',
          title: 'Career Advancement',
          description: 'Favorable period for career growth',
          involvedPlanets: ['Jupiter', 'Saturn'],
          aspectType: 'Trine',
          keywords: ['career', 'growth', 'opportunity'],
          strength: 0.8,
          transits: [] // Empty array since these are hardcoded windows
        },
        {
          startDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          type: 'Integration',
          title: 'Relationship Growth',
          description: 'Good time for deepening relationships',
          involvedPlanets: ['Venus', 'Mars'],
          aspectType: 'Conjunction',
          keywords: ['relationships', 'connection', 'harmony'],
          strength: 0.7,
          transits: [] // Empty array since these are hardcoded windows
        }
      ];

      await this.cache.set(cacheKey, timingWindows, this.CACHE_TTL);
      logger.info('Cached timing windows analysis', { 
        birthChartId: birthChart._id.toString(),
        userId: birthChart.userId.toString(),
        insightType: 'timing_windows',
        windowCount: timingWindows.length
      });
      return timingWindows;
    } catch (error) {
      logger.error('Failed to analyze timing windows', { 
        error, 
        birthChartId: birthChart._id.toString(),
        userId: birthChart.userId.toString(),
        insightType: 'timing_windows'
      });
      throw new ServiceError(`Failed to analyze timing windows: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateCoreIdentityDescription(sun: CelestialBody, moon: CelestialBody, ascendant: number): Promise<string> {
    try {
      const cacheKey = this.getCacheKey('coreIdentity', `${sun.name}-${moon.name}-${ascendant}`);
      const cached = await this.cache.get<string>(cacheKey);
      if (cached) {
        logger.info('Retrieved core identity description from cache', { 
          sun: sun.name, 
          moon: moon.name, 
          ascendant,
          insightType: 'core_identity'
        });
        return cached;
      }

      const description = `Your core identity combines the creative energy of ${AstrologyUtils.getSignName(sun.longitude)} Sun with the emotional depth of ${AstrologyUtils.getSignName(moon.longitude)} Moon, rising in ${AstrologyUtils.getSignName(ascendant)}.`;
      
      await this.cache.set(cacheKey, description, this.CACHE_TTL);
      logger.info('Cached core identity description', { 
        sun: sun.name, 
        moon: moon.name, 
        ascendant,
        insightType: 'core_identity'
      });
      return description;
    } catch (error) {
      logger.error('Failed to generate core identity description', { 
        error,
        insightType: 'core_identity'
      });
      throw new ServiceError(`Failed to generate core identity description: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateOverallSummary(strengths: Strength[], challenges: Challenge[], patterns: Pattern[]): Promise<string> {
    try {
      const cacheKey = this.getCacheKey('overallSummary', `${strengths.length}-${challenges.length}-${patterns.length}`);
      const cached = await this.cache.get<string>(cacheKey);
      if (cached) {
        logger.info('Retrieved overall summary from cache', { 
          strengthsCount: strengths.length,
          challengesCount: challenges.length,
          patternsCount: patterns.length,
          insightType: 'overall_summary'
        });
        return cached;
      }

      const summary = `Your birth chart reveals ${strengths.length} key strengths, ${challenges.length} areas for growth, and ${patterns.length} significant patterns that shape your life journey.`;
      
      await this.cache.set(cacheKey, summary, this.CACHE_TTL);
      logger.info('Cached overall summary', { 
        strengthsCount: strengths.length,
        challengesCount: challenges.length,
        patternsCount: patterns.length,
        insightType: 'overall_summary'
      });
      return summary;
    } catch (error) {
      logger.error('Failed to generate overall summary', { 
        error,
        insightType: 'overall_summary'
      });
      throw new ServiceError(`Failed to generate overall summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateNodeInsight(birthChart: BirthChartDocument): Promise<{ insight: string; log: InsightLog }> {
    try {
      this.logStartInsightGeneration('node path', birthChart._id);
      
      // Find North and South Nodes
      const northNode = birthChart.bodies.find(body => body.name === 'North Node');
      const southNode = birthChart.bodies.find(body => body.name === 'South Node');
      
      const prompt = PromptBuilder.buildNodeInsightPrompt({
        northNode: northNode ? {
          sign: northNode.sign,
          house: northNode.house,
          degree: northNode.longitude % 30
        } : { sign: '', house: 0, degree: 0 },
        southNode: southNode ? {
          sign: southNode.sign,
          house: southNode.house,
          degree: southNode.longitude % 30
        } : { sign: '', house: 0, degree: 0 }
      }, true);
      const insight = await this.generateInsightWithRetry(prompt);
      
      const log = this.createInsightLog(InsightType.NODE_PATH, birthChart._id.toString(), insight, {
        date: new Date(),
        focusArea: 'Life Purpose',
        planet: 'North Node',
        sign: northNode?.sign,
        house: northNode?.house,
        lifeThemeKey: 'life_purpose',
        triggeredBy: 'natal',
        northNode: northNode ? {
          sign: northNode.sign,
          house: northNode.house
        } : undefined,
        southNode: southNode ? {
          sign: southNode.sign,
          house: southNode.house
        } : undefined
      });

      this.logCompletion('node path', birthChart._id);
      return { insight, log };
    } catch (error) {
      this.handleInsightError(error, birthChart._id.toString(), birthChart._id.toString());
      throw error;
    }
  }

  async generateHouseThemesInsight(houseThemes: HouseTheme[]): Promise<{ insight: string; log: InsightLog }> {
    try {
      this.logStartInsightGeneration('house themes', houseThemes[0]?.house.toString() || 'unknown');
      
      const prompt = PromptBuilder.buildHouseThemesPrompt(houseThemes, true);
      const insight = await this.generateInsightWithRetry(prompt);
      
      const primaryHouse = houseThemes[0]; // Assuming first house is most significant
      const log = this.createInsightLog(InsightType.BIRTH_CHART, primaryHouse.house.toString(), insight, {
        date: new Date(),
        focusArea: `House ${primaryHouse.house}`,
        house: primaryHouse.house,
        lifeThemeKey: `house_${primaryHouse.house}`,
        triggeredBy: 'natal',
        planet: primaryHouse.planets[0]
      });

      this.logCompletion('house themes', primaryHouse.house);
      return { insight, log };
    } catch (error) {
      this.handleInsightError(error, houseThemes[0]?.house.toString() || 'unknown', houseThemes[0]?.house.toString() || 'unknown');
      throw error;
    }
  }

  async generateHouseLordsInsight(houseLords: HouseLord[]): Promise<{ insight: string; log: InsightLog }> {
    try {
      this.logStartInsightGeneration('house lords', houseLords[0]?.house.toString() || 'unknown');
      
      const prompt = PromptBuilder.buildHouseLordsPrompt(houseLords, true);
      const insight = await this.generateInsightWithRetry(prompt);
      
      const primaryLord = houseLords[0]; // Assuming first lord is most significant
      const log = this.createInsightLog(InsightType.BIRTH_CHART, primaryLord.house.toString(), insight, {
        date: new Date(),
        focusArea: `House ${primaryLord.house}`,
        planet: primaryLord.lord,
        house: primaryLord.house,
        lifeThemeKey: `house_lord_${primaryLord.house}`,
        triggeredBy: 'natal',
        dignity: primaryLord.dignity
      });

      this.logCompletion('house lords', primaryLord.house);
      return { insight, log };
    } catch (error) {
      this.handleInsightError(error, houseLords[0]?.house.toString() || 'unknown', houseLords[0]?.house.toString() || 'unknown');
      throw error;
    }
  }

  async getOrGenerateDailyInsight(
    birthChart: BirthChartDocument,
    transits: Transit[],
    currentDate: Date
  ): Promise<{ insight: string; insightLog: InsightLog }> {
    try {
      this.logStartInsightGeneration('daily insight', birthChart._id);
      
      const prompt = PromptBuilder.buildDailyInsightPrompt(this.convertToBirthChart(birthChart), transits, currentDate, true);
      const insight = await this.generateInsightWithRetry(prompt);
      
      const primaryTransit = getPrimaryTransit(transits);
      const insightLog = createInsightLog(
        InsightType.DAILY,
        insight,
        {
          date: currentDate,
          focusArea: primaryTransit ? determineTransitFocusArea(primaryTransit) : undefined,
          transitAspect: primaryTransit ? `${primaryTransit.planet} ${primaryTransit.type} ${primaryTransit.aspectingNatal?.name}` : undefined,
          triggeredBy: primaryTransit ? determineTransitTrigger(primaryTransit) : undefined,
          transitCount: transits.length,
          activePlanets: [...new Set(transits.map(t => t.planet))]
        },
        birthChart.userId.toString()
      );

      this.logCompletion('daily insight', birthChart._id);
      return { insight, insightLog };
    } catch (error) {
      this.handleInsightError(error, birthChart._id.toString(), birthChart._id.toString());
      throw error;
    }
  }

  async analyzeSmartTimingWindows(
    birthChart: BirthChartDocument,
    transits: Transit[],
    _currentDate: Date
  ): Promise<TimingWindow[]> {
    try {
      const cacheKey = this.getCacheKey('smartTimingWindows', birthChart._id.toString());
      const cached = await this.cache.get<TimingWindow[]>(cacheKey);
      if (cached) {
        logger.info('Retrieved smart timing windows from cache', { 
          birthChartId: birthChart._id.toString(),
          userId: birthChart.userId.toString(),
          insightType: 'smart_timing_windows'
        });
        return cached;
      }

      // Analyze transits to identify favorable periods
      const timingWindows: TimingWindow[] = [];
      
      // Group transits by date ranges
      const transitGroups = this.groupTransitsByDateRange(transits);
      
      // Create timing windows based on transit groups
      for (const group of transitGroups) {
        const window: TimingWindow = {
          startDate: group.startDate,
          endDate: group.endDate,
          type: this.determineWindowType(group.transits),
          title: this.generateWindowTitle(group.transits),
          description: this.generateWindowDescription(group.transits),
          involvedPlanets: group.transits.map(t => t.planet),
          aspectType: this.determineAspectType(group.transits),
          keywords: this.extractKeywords(group.transits),
          transits: group.transits,
          strength: this.calculateWindowStrength(group.transits)
        };
        timingWindows.push(window);
      }

      await this.cache.set(cacheKey, timingWindows, this.CACHE_TTL);
      logger.info('Cached smart timing windows analysis', { 
        birthChartId: birthChart._id.toString(),
        userId: birthChart.userId.toString(),
        insightType: 'smart_timing_windows',
        windowCount: timingWindows.length
      });
      return timingWindows;
    } catch (error) {
      logger.error('Failed to analyze smart timing windows', { 
        error, 
        birthChartId: birthChart._id.toString(),
        userId: birthChart.userId.toString(),
        insightType: 'smart_timing_windows'
      });
      throw new ServiceError(`Failed to analyze smart timing windows: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private groupTransitsByDateRange(transits: Transit[]): { startDate: Date; endDate: Date; transits: Transit[] }[] {
    // Sort transits by exact date
    const sortedTransits = [...transits].sort((a, b) => a.exactDate.getTime() - b.exactDate.getTime());
    
    const groups: { startDate: Date; endDate: Date; transits: Transit[] }[] = [];
    let currentGroup: Transit[] = [];
    let currentStartDate: Date | null = null;
    
    for (const transit of sortedTransits) {
      if (!currentStartDate) {
        currentStartDate = transit.exactDate;
        currentGroup = [transit];
      } else if (this.isWithinRange(transit.exactDate, currentStartDate, 7)) { // 7 days range
        currentGroup.push(transit);
      } else {
        groups.push({
          startDate: currentStartDate,
          endDate: this.getLatestEndDate(currentGroup),
          transits: [...currentGroup]
        });
        currentStartDate = transit.exactDate;
        currentGroup = [transit];
      }
    }
    
    // Add the last group
    if (currentGroup.length > 0 && currentStartDate) {
      groups.push({
        startDate: currentStartDate,
        endDate: this.getLatestEndDate(currentGroup),
        transits: currentGroup
      });
    }
    
    return groups;
  }

  private isWithinRange(date: Date, startDate: Date, days: number): boolean {
    const diffTime = Math.abs(date.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= days;
  }

  private getLatestEndDate(transits: Transit[]): Date {
    // Since Transit interface doesn't have endDate, we'll use exactDate + 1 day
    return new Date(Math.max(...transits.map(t => t.exactDate.getTime())) + 24 * 60 * 60 * 1000);
  }

  private determineWindowType(transits: Transit[]): TimingWindow['type'] {
    // Logic to determine window type based on transit aspects
    const aspects = transits.map(t => t.type);
    if (aspects.some(a => ['Trine', 'Sextile'].includes(a))) {
      return 'Opportunity';
    } else if (aspects.some(a => ['Conjunction'].includes(a))) {
      return 'Integration';
    } else if (aspects.some(a => ['Square', 'Opposition'].includes(a))) {
      return 'Challenge';
    }
    return 'Integration'; // Default to Integration since Growth is not a valid type
  }

  private generateWindowTitle(transits: Transit[]): string {
    // Logic to generate a meaningful title based on transits
    const planets = transits.map(t => t.planet);
    const aspects = transits.map(t => t.type);
    return `${planets.join('-')} ${aspects[0]} Period`;
  }

  private generateWindowDescription(transits: Transit[]): string {
    // Logic to generate a description based on transits
    return `A period of ${this.determineWindowType(transits).toLowerCase()} with ${transits.length} significant transits.`;
  }

  private determineAspectType(transits: Transit[]): string {
    // Return the most significant aspect type
    return transits[0]?.type || 'Unknown';
  }

  private extractKeywords(transits: Transit[]): string[] {
    // Extract keywords from transit descriptions
    const keywords = new Set<string>();
    transits.forEach(t => {
      const words = (t.description || t.influence).toLowerCase().split(' ');
      words.forEach(word => {
        if (word.length > 3) keywords.add(word);
      });
    });
    return Array.from(keywords);
  }

  private calculateWindowStrength(transits: Transit[]): number {
    // Calculate strength based on transit aspects and orbs
    const aspectStrengths: Record<AspectType, number> = {
      conjunction: 1.0,
      trine: 0.9,
      sextile: 0.8,
      square: 0.6,
      opposition: 0.7,
      semiSquare: 0.5,
      sesquisquare: 0.4,
      quincunx: 0.3,
      semiSextile: 0.2
    } as const;
    
    const orbStrengths = transits.map(t => {
      const orb = Math.abs(t.orb || 0);
      return orb <= 1 ? 1.0 : orb <= 3 ? 0.8 : orb <= 5 ? 0.6 : 0.4;
    });
    
    const aspectScores = transits.map(t => aspectStrengths[t.type as AspectType] || 0.5);
    
    // Combine scores with weights
    const weightedScore = aspectScores.reduce((sum, score, i) => sum + score * orbStrengths[i], 0) / transits.length;
    
    return Math.min(Math.max(weightedScore, 0), 1); // Ensure between 0 and 1
  }

  async generateWeeklyDigest(
    birthChart: BirthChartDocument,
    transits: Transit[],
    startDate: Date,
    transitInsights: string[] = []
  ): Promise<{ insight: string; log: InsightLog }> {
    try {
      this.logStartInsightGeneration('weekly digest', birthChart._id);
      
      // Build the weekly digest prompt
      const prompt = PromptBuilder.buildWeeklyDigestPrompt(
        this.convertToBirthChart(birthChart),
        transits,
        transitInsights,
        startDate,
        true
      );

      // Generate the weekly digest
      const insight = await this.generateInsightWithRetry(prompt);
      
      const log = this.createInsightLog(InsightType.DAILY, birthChart._id.toString(), insight, {
        date: startDate,
        birthChartId: birthChart._id.toString(),
        keyTransits: transits.map(t => ({
          planet: t.planet,
          sign: t.sign,
          house: t.house || 0,
          orb: t.orb || 0,
          aspectingNatal: t.aspectingNatal
        }))
      });

      this.logCompletion('weekly digest', birthChart._id);
      return { insight, log };
    } catch (error) {
      this.handleInsightError(error, birthChart._id.toString(), birthChart._id.toString());
      throw error;
    }
  }

  async generateThemeForecast(
    birthChart: BirthChartDocument,
    themes: LifeTheme[],
    transits: Transit[]
  ): Promise<{ insight: string; log: Partial<InsightLog> }> {
    try {
      this.logStartInsightGeneration('theme forecast', birthChart._id);
      
      // Build the theme forecast prompt
      const prompt = PromptBuilder.buildThemeForecastPrompt(
        this.convertToBirthChart(birthChart),
        themes,
        transits,
        true
      );

      // Generate the theme forecast
      const insight = await this.generateInsightWithRetry(prompt);
      
      const log = this.createInsightLog(InsightType.THEME_FORECAST, birthChart._id.toString(), insight, {
        date: new Date(),
        birthChartId: birthChart._id.toString(),
        themeCount: themes.length,
        transitCount: transits.length
      });

      this.logCompletion('theme forecast', birthChart._id);
      return { insight, log };
    } catch (error) {
      this.handleInsightError(error, birthChart._id.toString(), birthChart._id.toString());
      throw error;
    }
  }

  async generateResponse(prompt: string): Promise<string> {
    try {
      const sanitizedPrompt = sanitizeText(prompt);
      const insight = await this.llmClient.generateInsight(sanitizedPrompt);
      return sanitizeText(insight);
    } catch (error) {
      logger.error('Failed to generate AI response', { 
        error,
        insightType: 'ai_response'
      });
      throw new AppError('Failed to generate AI response');
    }
  }
} 


