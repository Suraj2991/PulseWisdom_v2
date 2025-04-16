import { LLMClient } from '../../infrastructure/ai/LLMClient';
import { PromptBuilder } from '../../utils/PromptBuilder';
import { LifeTheme } from '../../domain/types/lifeTheme.types';
import { Transit } from '../../domain/types/transit.types';
import { BirthChart, NodePlacement, CelestialBody } from '../../domain/types/ephemeris.types';
import { HouseTheme, HouseLord } from '../../domain/types/insight.types';
import { TimingWindow } from '../../domain/types/timing.types';
import { InsightLog } from '../../domain/types/personalization.types';
import { logger } from '../../shared/logger';
import { ServiceError, AppError } from '../../domain/errors';
import { ICache } from '../../infrastructure/cache/ICache';
import { BirthChartDocument } from '../../domain/models/BirthChart';
import { sanitizeText } from '../../utils/sanitizeText';
import { InsightType } from '../../domain/types/insight.types';

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
  constructor(
    private readonly llmClient: LLMClient,
    private readonly promptBuilder: typeof PromptBuilder,
    private readonly cache: ICache
  ) {}

  async generateLifeThemeInsight(themeData: LifeTheme): Promise<string> {
    try {
      this.logStartInsightGeneration('life theme', themeData.id);
      const prompt = this.promptBuilder.buildLifeThemePrompt(themeData, true);
      const insight = await this.generateInsightWithRetry(prompt);
      this.logCompletion('life theme', themeData.id);
      return insight;
    } catch (error) {
      this.handleInsightError(error, 'life theme', themeData);
    }
  }

  async generateTransitInsight(transitData: Transit): Promise<{ insight: string; log: Partial<InsightLog> }> {
    try {
      this.logStartInsightGeneration('transit', transitData.planet);
      const prompt = this.promptBuilder.buildTransitPrompt(transitData, true);
      const insight = await this.generateInsightWithRetry(prompt);
      const log = this.createInsightLog(InsightType.TRANSIT, insight, transitData);
      this.logCompletion('transit', transitData.planet);
      return { insight, log };
    } catch (error) {
      this.handleInsightError(error, 'transit', transitData);
    }
  }

  async generateNatalChartInsight(birthChart: BirthChartDocument): Promise<string> {
    try {
      this.logStartInsightGeneration('natal chart', birthChart._id);
      const prompt = this.promptBuilder.buildNatalChartPrompt(this.convertToBirthChart(birthChart), true);
      const insight = await this.generateInsightWithRetry(prompt);
      this.logCompletion('natal chart', birthChart._id);
      return insight;
    } catch (error) {
      this.handleInsightError(error, 'natal chart', birthChart);
    }
  }

  private logStartInsightGeneration(type: string, id: unknown): void {
    logger.info(`Starting ${type} insight generation`, { id: String(id) });
  }

  private logCompletion(type: string, id: unknown): void {
    logger.info(`Completed ${type} insight generation`, { id: String(id) });
  }

  private async generateInsightWithRetry(prompt: string): Promise<string> {
    try {
      return await this.llmClient.generateInsight(prompt);
    } catch (error) {
      logger.warn('First attempt failed, retrying...', { error });
      return await this.llmClient.generateInsight(prompt);
    }
  }

  private createInsightLog(
    type: InsightType,
    insight: string,
    data: { planet?: string; sign?: string; exactDate?: Date }
  ): Partial<InsightLog> {
    return {
      insightType: type.toLowerCase() as InsightLog['insightType'],
      content: insight,
      generatedAt: new Date(),
      metadata: {
        planet: data.planet,
        sign: data.sign,
        date: data.exactDate
      }
    };
  }

  private handleInsightError(error: unknown, type: string, data: any): never {
    logger.error(`Failed to generate ${type} insight`, { error, data });
    throw new ServiceError(
      `Failed to generate ${type} insight: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  private convertToBirthChart(birthChart: BirthChartDocument): BirthChart {
    const sun = birthChart.bodies.find(body => body.name === 'Sun');
    const moon = birthChart.bodies.find(body => body.name === 'Moon');
    const northNode = birthChart.bodies.find(body => body.name === 'North Node');
    const southNode = birthChart.bodies.find(body => body.name === 'South Node');
  
    return {
      datetime: birthChart.datetime,
      location: birthChart.location,
      bodies: birthChart.bodies,
      houses: birthChart.houses,
      aspects: [], // You may need to calculate aspects if not available
      angles: {
        ascendant: birthChart.angles.ascendant,
        midheaven: birthChart.angles.mc,
        descendant: birthChart.angles.descendant,
        imumCoeli: birthChart.angles.ic
      },
      sun: sun ? sun.sign : '',
      moon: moon ? moon.sign : '',
      ascendant: birthChart.angles.ascendant,
      planets: birthChart.bodies.map(body => ({
        name: body.name,
        sign: body.sign,
        house: body.house,
        degree: body.longitude % 30
      })),
      housePlacements: birthChart.houses.cusps.map((cusp, index) => ({
        house: index + 1,
        sign: this.getSignFromLongitude(cusp)
      })),
      chiron: this.getChironPlacement(birthChart),
      northNode: this.getNodePlacement(northNode, 'North Node'),
      southNode: this.getNodePlacement(southNode, 'South Node')
    };
  }
  
  private getChironPlacement(birthChart: BirthChartDocument): NodePlacement {
    const chiron = birthChart.bodies.find(body => body.name === 'Chiron');
    return {
      sign: chiron ? chiron.sign : '',
      house: chiron ? chiron.house : 0,
      degree: chiron ? chiron.longitude % 30 : 0
    };
  }

  private getNodePlacement(node: CelestialBody | undefined, nodeName: string): NodePlacement {
    return {
      sign: node ? node.sign : '',
      house: node ? node.house : 0,
      degree: node ? node.longitude % 30 : 0
    };
  }

  private getSignFromLongitude(longitude: number): string {
    const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
    return signs[Math.floor(longitude / 30)];
  }

  async analyzeStrengths(birthChart: BirthChartDocument): Promise<Strength[]> {
    try {
      return [
        {
          area: 'Communication',
          description: 'Strong ability to express ideas clearly',
          supportingAspects: ['Mercury in Gemini', 'Third house emphasis']
        },
        {
          area: 'Leadership',
          description: 'Natural leadership qualities',
          supportingAspects: ['Sun in Leo', 'First house emphasis']
        }
      ];
    } catch (error) {
      logger.error('Failed to analyze strengths', { error, birthChartId: birthChart._id });
      throw new ServiceError(`Failed to analyze strengths: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async analyzeChallenges(birthChart: BirthChartDocument): Promise<Challenge[]> {
    try {
      return [
        {
          area: 'Emotional Balance',
          description: 'May struggle with emotional stability',
          growthOpportunities: ['Mindfulness practice', 'Emotional awareness'],
          supportingAspects: ['Moon in Scorpio', 'Fourth house emphasis']
        },
        {
          area: 'Decision Making',
          description: 'Tendency to overthink decisions',
          growthOpportunities: ['Trusting intuition', 'Setting time limits'],
          supportingAspects: ['Mercury in Virgo', 'Twelfth house emphasis']
        }
      ];
    } catch (error) {
      logger.error('Failed to analyze challenges', { error, birthChartId: birthChart._id });
      throw new ServiceError(`Failed to analyze challenges: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async analyzePatterns(birthChart: BirthChartDocument): Promise<Pattern[]> {
    try {
      return [
        {
          type: 'Grand Trine',
          description: 'Natural flow of energy between three planets',
          planets: ['Moon', 'Venus', 'Neptune'],
          houses: [4, 7, 12]
        },
        {
          type: 'T-Square',
          description: 'Dynamic tension between three planets',
          planets: ['Sun', 'Mars', 'Saturn'],
          houses: [1, 4, 10]
        }
      ];
    } catch (error) {
      logger.error('Failed to analyze patterns', { error, birthChartId: birthChart._id });
      throw new ServiceError(`Failed to analyze patterns: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
      logger.error('Failed to analyze house themes', { error, birthChartId: birthChart._id });
      throw new ServiceError(`Failed to analyze house themes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async analyzeHouseLords(birthChart: BirthChartDocument): Promise<HouseLord[]> {
    try {
      return [
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
    } catch (error) {
      logger.error('Failed to analyze house lords', { error, birthChartId: birthChart._id });
      throw new ServiceError(`Failed to analyze house lords: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async analyzeTimingWindows(birthChart: BirthChartDocument): Promise<TimingWindow[]> {
    try {
      return [
        {
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          type: 'Opportunity',
          title: 'Career Advancement',
          description: 'Favorable period for career growth',
          involvedPlanets: ['Jupiter', 'Saturn'],
          aspectType: 'Trine',
          keywords: ['career', 'growth', 'opportunity']
        },
        {
          startDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          type: 'Integration',
          title: 'Relationship Growth',
          description: 'Good time for deepening relationships',
          involvedPlanets: ['Venus', 'Mars'],
          aspectType: 'Conjunction',
          keywords: ['relationships', 'connection', 'harmony']
        }
      ];
    } catch (error) {
      logger.error('Failed to analyze timing windows', { error, birthChartId: birthChart._id });
      throw new ServiceError(`Failed to analyze timing windows: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateCoreIdentityDescription(sun: CelestialBody, moon: CelestialBody, ascendant: number): Promise<string> {
    try {
      return `Your core identity combines the creative energy of ${this.getSignName(sun.longitude)} Sun with the emotional depth of ${this.getSignName(moon.longitude)} Moon, rising in ${this.getSignName(ascendant)}.`;
    } catch (error) {
      logger.error('Failed to generate core identity description', { error });
      throw new ServiceError(`Failed to generate core identity description: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateOverallSummary(strengths: Strength[], challenges: Challenge[], patterns: Pattern[]): Promise<string> {
    try {
      return `Your birth chart reveals ${strengths.length} key strengths, ${challenges.length} areas for growth, and ${patterns.length} significant patterns that shape your life journey.`;
    } catch (error) {
      logger.error('Failed to generate overall summary', { error });
      throw new ServiceError(`Failed to generate overall summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateNodeInsight(birthChart: BirthChartDocument): Promise<string> {
    try {
      logger.info('Starting node insight generation', { birthChartId: birthChart._id });
      const prompt = this.promptBuilder.buildNodeInsightPrompt({
        northNode: birthChart.bodies.find(body => body.name === 'North Node') ? {
          sign: birthChart.bodies.find(body => body.name === 'North Node')!.sign,
          house: birthChart.bodies.find(body => body.name === 'North Node')!.house,
          degree: birthChart.bodies.find(body => body.name === 'North Node')!.longitude % 30
        } : { sign: '', house: 0, degree: 0 },
        southNode: birthChart.bodies.find(body => body.name === 'South Node') ? {
          sign: birthChart.bodies.find(body => body.name === 'South Node')!.sign,
          house: birthChart.bodies.find(body => body.name === 'South Node')!.house,
          degree: birthChart.bodies.find(body => body.name === 'South Node')!.longitude % 30
        } : { sign: '', house: 0, degree: 0 }
      }, true);
      const insight = await this.llmClient.generateInsight(prompt);
      logger.info('Completed node insight generation', { birthChartId: birthChart._id });
      return insight;
    } catch (error) {
      logger.error('Failed to generate node insight', { error, birthChartId: birthChart._id });
      throw new ServiceError(`Failed to generate node insight: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateHouseThemesInsight(houseThemes: HouseTheme[]): Promise<string> {
    try {
      logger.info('Starting house themes insight generation', { count: houseThemes.length });
      const prompt = this.promptBuilder.buildHouseThemesPrompt(houseThemes, true);
      const insight = await this.llmClient.generateInsight(prompt);
      logger.info('Completed house themes insight generation', { count: houseThemes.length });
      return insight;
    } catch (error) {
      logger.error('Failed to generate house themes insight', { error });
      throw new ServiceError(`Failed to generate house themes insight: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateHouseLordsInsight(houseLords: HouseLord[]): Promise<string> {
    try {
      logger.info('Starting house lords insight generation', { count: houseLords.length });
      const prompt = this.promptBuilder.buildHouseLordsPrompt(houseLords, true);
      const insight = await this.llmClient.generateInsight(prompt);
      logger.info('Completed house lords insight generation', { count: houseLords.length });
      return insight;
    } catch (error) {
      logger.error('Failed to generate house lords insight', { error });
      throw new ServiceError(`Failed to generate house lords insight: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateDailyInsight(
    birthChart: BirthChartDocument,
    transits: Transit[],
    currentDate: Date
  ): Promise<{ insight: string; log: string }> {
    try {
      logger.info('Starting daily insight generation', { 
        birthChartId: birthChart._id,
        date: currentDate.toISOString(),
        transitCount: transits.length
      });
      
      const prompt = this.promptBuilder.buildDailyInsightPrompt(this.convertToBirthChart(birthChart), transits, currentDate, true);
      const insight = await this.llmClient.generateInsight(prompt);
      
      const log = JSON.stringify({
        insightType: 'Daily',
        content: insight,
        generatedAt: new Date(),
        metadata: { date: currentDate.toISOString() }
      });

      logger.info('Completed daily insight generation', { 
        birthChartId: birthChart._id,
        date: currentDate.toISOString()
      });
      
      return { insight, log };
    } catch (error) {
      logger.error('Failed to generate daily insight', { error, birthChartId: birthChart._id, currentDate });
      throw new ServiceError(`Failed to generate daily insight: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async analyzeSmartTimingWindows(
    birthChart: BirthChartDocument,
    transits: Transit[],
    currentDate: Date
  ): Promise<TimingWindow[]> {
    try {
      logger.info('Starting smart timing windows analysis', { 
        birthChartId: birthChart._id,
        date: currentDate.toISOString(),
        transitCount: transits.length
      });
      
      const prompt = this.promptBuilder.buildSmartTimingPrompt(this.convertToBirthChart(birthChart), transits, currentDate, true);
      const insight = await this.llmClient.generateInsight(prompt);
      const windows = JSON.parse(insight) as TimingWindow[];

      logger.info('Completed smart timing windows analysis', { 
        birthChartId: birthChart._id,
        date: currentDate.toISOString(),
        windowCount: windows.length
      });
      
      return windows;
    } catch (error) {
      logger.error('Failed to analyze smart timing windows', { error, birthChartId: birthChart._id, currentDate });
      throw new ServiceError(`Failed to analyze smart timing windows: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private getSignName(longitude: number): string {
    const signs = [
      'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
      'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
    ];
    return signs[Math.floor(longitude / 30)];
  }

  async generateWeeklyDigest(
    birthChart: BirthChartDocument,
    transits: Transit[],
    startDate: Date,
    transitInsights: string[] = []
  ): Promise<string> {
    try {
      // Sanitize any user-provided insights
      const sanitizedInsights = transitInsights.map(insight => sanitizeText(insight));
      
      const prompt = `You are an expert astrologer. Generate a weekly astrological digest for the week starting ${startDate.toISOString()}. 
      Consider the following transits and their interpretations:
      
      Birth Chart: ${JSON.stringify(birthChart)}
      Transits: ${JSON.stringify(transits)}
      Individual Transit Insights: ${sanitizedInsights.join('\n')}
      
      Provide a comprehensive weekly overview that includes:
      1. Key themes and energies
      2. Important dates and timing
      3. Areas of focus and opportunity
      4. Potential challenges and growth points
      5. Practical guidance and recommendations`;

      return await this.llmClient.generateInsight(prompt);
    } catch (error) {
      logger.error('Failed to generate weekly digest', { error, birthChartId: birthChart._id, startDate });
      throw new ServiceError(`Failed to generate weekly digest: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateThemeForecast(
    birthChart: BirthChartDocument,
    themes: LifeTheme[],
    transits: Transit[]
  ): Promise<string> {
    try {
      // Sanitize any user-provided theme data
      const sanitizedThemes = themes.map(theme => ({
        ...theme,
        description: theme.description ? sanitizeText(theme.description) : theme.description
      }));

      const prompt = `You are an expert astrologer. Generate a thematic forecast based on the natal chart themes and current transits.
      
      Birth Chart: ${JSON.stringify(birthChart)}
      Life Themes: ${JSON.stringify(sanitizedThemes)}
      Current Transits: ${JSON.stringify(transits)}
      
      Analyze how current transits are activating or challenging the established life themes.
      Include:
      1. Theme activation and timing
      2. Growth opportunities
      3. Potential challenges
      4. Integration strategies
      5. Key dates and windows of opportunity`;

      return await this.llmClient.generateInsight(prompt);
    } catch (error) {
      logger.error('Failed to generate theme forecast', { error, birthChartId: birthChart._id });
      throw new ServiceError(`Failed to generate theme forecast: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateResponse(prompt: string): Promise<string> {
    try {
      const sanitizedPrompt = sanitizeText(prompt);
      return await this.llmClient.generateInsight(sanitizedPrompt);
    } catch (error) {
      logger.error('Failed to generate AI response', { error });
      throw new AppError('Failed to generate AI response');
    }
  }
} 