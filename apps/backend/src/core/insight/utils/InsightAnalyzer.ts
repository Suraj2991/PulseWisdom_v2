import { LifeThemeService } from '../../life-theme';
import { TransitService } from '../../transit';
import { logger } from '../../../shared/logger';
import { AppError, ServiceError } from '../../../domain/errors';
import { InsightAnalysis, InsightAspect, InsightType } from '..';
import { TimingWindow } from '../../insight';
import { ICache } from '../../../infrastructure/cache/ICache';
import { PromptBuilder, LLMClient } from '../../ai';
import { BirthChartDocument, adaptBirthChartData } from '../../birthchart';
import { Transit } from '../../transit';
import { EphemerisAdapter, BirthChart } from '../../ephemeris';
import { WindowType } from '../../transit';

interface Planet {
  name: string;
  longitude: number;
  latitude: number;
  speed: number;
  house: number;
}

export class InsightAnalyzer {
  constructor(
    private readonly cache: ICache,
    private readonly lifeThemeService: LifeThemeService,
    private readonly transitService: TransitService,
    private readonly llmClient: LLMClient
  ) {}

  private convertToBirthChart(birthChart: BirthChartDocument): BirthChart {
    return adaptBirthChartData(birthChart);
  }

  // private getChironPlacement(birthChart: BirthChartDocument): NodePlacement {
  //   const chiron = birthChart.bodies.find(body => body.name === 'Chiron');
  //   return {
  //     sign: chiron ? chiron.sign : '',
  //     house: chiron ? chiron.house : 0,
  //     degree: chiron ? chiron.longitude % 30 : 0
  //   };
  // }

  // private getNodePlacement(node: CelestialBody | undefined, _nodeName: string): NodePlacement {
  //   return {
  //     sign: node ? node.sign : '',
  //     house: node ? node.house : 0,
  //     degree: node ? node.longitude % 30 : 0
  //   };
  // }

  async analyzeInsights(birthChartId: string, date: Date): Promise<InsightAnalysis> {
    try {
      logger.info('Analyzing life themes and transits', { birthChartId });
      
      // Get birth chart to extract user ID
      const birthChart = await this.lifeThemeService.getBirthChart(birthChartId);
      if (!birthChart) {
        throw new AppError(`Birth chart not found for ID: ${birthChartId}`);
      }

      const [lifeThemes, transits] = await Promise.all([
        this.lifeThemeService.analyzeLifeThemes({ birthChartId }),
        this.transitService.analyzeTransits(birthChart)
      ]);

      // Get planetary positions
      const planets = await this.transitService.getPlanetaryPositions(
        EphemerisAdapter.toDateTime(date),
        birthChart.location.latitude,
        birthChart.location.longitude
      );

      return {
        birthChartId,
        userId: birthChart.userId,
        content: 'Insight analysis',
        type: InsightType.BIRTH_CHART,
        insights: [],
        overallSummary: '', // Will be populated by InsightGenerator
        createdAt: new Date(),
        updatedAt: new Date(),
        planets: planets.map(body => ({
          id: body.id,
          name: body.name,
          sign: body.sign,
          house: body.house,
          degree: body.longitude % 30,
          retrograde: body.speed < 0
        })),
        aspects: transits.windows.flatMap(window => window.transits.map(transit => ({
          body1Id: transit.aspectingNatal?.id || 0,
          body2Id: 0, // TODO: Get actual planet ID
          type: transit.influence,
          angle: Number(transit.orb) || 0,
          orb: transit.orb || 0,
          isApplying: true // TODO: Calculate if applying
        }))),
        lifeThemes,
        transits: transits.windows.flatMap(window => window.transits)
      };
    } catch (error) {
      logger.error('Failed to analyze insights', { error, birthChartId });
      throw new AppError('Failed to analyze insights: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  private validateTimingWindow(window: TimingWindow): boolean {
    return (
      window &&
      typeof window.type === 'string' &&
      ['Opportunity', 'Challenge', 'Integration'].includes(window.type) &&
      typeof window.title === 'string' &&
      typeof window.description === 'string' &&
      window.startDate instanceof Date &&
      window.endDate instanceof Date &&
      Array.isArray(window.involvedPlanets) &&
      window.involvedPlanets.every((planet: string) => typeof planet === 'string') &&
      typeof window.aspectType === 'string' &&
      Array.isArray(window.keywords) &&
      window.keywords.every((keyword: string) => typeof keyword === 'string')
    );
  }

  private validatePlanet(planet: Planet): boolean {
    return (
      planet &&
      typeof planet.name === 'string' &&
      typeof planet.longitude === 'number' &&
      typeof planet.latitude === 'number' &&
      typeof planet.speed === 'number' &&
      typeof planet.house === 'number'
    );
  }

  private validateKeyword(keyword: string): boolean {
    return typeof keyword === 'string' && keyword.length > 0;
  }

  private mapWindow(window: TimingWindow): TimingWindow {
    return {
      type: window.type,
      title: window.title,
      description: window.description,
      startDate: window.startDate,
      endDate: window.endDate,
      involvedPlanets: window.involvedPlanets,
      aspectType: window.aspectType,
      keywords: window.keywords,
      transits: window.transits,
      strength: window.strength
    };
  }

  private mapAspect(aspect: InsightAspect): InsightAspect {
    return {
      body1Id: aspect.body1Id,
      body2Id: aspect.body2Id,
      type: aspect.type,
      angle: Number(aspect.angle) || 0,
      orb: Number(aspect.orb) || 0,
      isApplying: aspect.isApplying
    };
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
      
      const prompt = PromptBuilder.buildSmartTimingPrompt(this.convertToBirthChart(birthChart), transits, currentDate, true);
      const insight = await this.llmClient.generateInsight(prompt);
      
      // Parse and validate the JSON response
      let windows: TimingWindow[];
      try {
        const parsedWindows = JSON.parse(insight);
        if (!Array.isArray(parsedWindows)) {
          throw new Error('Invalid response format: expected array of windows');
        }
        
        // Validate each window
        windows = parsedWindows.map((window: TimingWindow) => {
          // Validate required fields
          if (!window.type || !window.title || !window.description || 
              !window.startDate || !window.endDate || !window.involvedPlanets || 
              !window.aspectType || !window.keywords) {
            throw new Error('Invalid window format: missing required fields');
          }

          // Convert date strings to Date objects
          return {
            ...window,
            startDate: new Date(window.startDate),
            endDate: new Date(window.endDate)
          };
        });
      } catch (parseError) {
        logger.error('Failed to parse timing windows', { 
          error: parseError,
          insight 
        });
        throw new ServiceError('Invalid timing windows data received from AI');
      }

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

  private isValidTimingWindow(window: TimingWindow): boolean {
    return (
      Object.values(WindowType).includes(window.type) &&
      window.startDate instanceof Date &&
      window.endDate instanceof Date &&
      window.title.length > 0 &&
      window.description.length > 0
    );
  }

  // ... rest of the analysis methods ...
} 