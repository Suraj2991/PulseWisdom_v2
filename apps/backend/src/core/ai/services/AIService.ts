import { LLMClient } from '..';
import { BirthChartDocument } from '../../birthchart';
import { LifeTheme } from '../../life-theme';
import { Transit } from '../../transit';
import { InsightLog } from '../../insight/types/insight.types';
import { ICache } from '../../../infrastructure/cache/ICache';
import { logger } from '../../../shared/logger';
import { ServiceError } from '../../../domain/errors';
import { config } from '../../../shared/config';
import { ChartAnalysisService } from './ChartAnalysisService';
import { TransitAnalysisService } from './TransitAnalysisService';
import { HouseAnalysisService } from './HouseAnalysisService';
import { PatternAnalysisService } from './PatternAnalysisService';

export class AIService {
  private readonly chartAnalysisService: ChartAnalysisService;
  private readonly transitAnalysisService: TransitAnalysisService;
  private readonly houseAnalysisService: HouseAnalysisService;
  private readonly patternAnalysisService: PatternAnalysisService;
  private readonly CACHE_PREFIX = 'ai:insight:';
  private readonly CACHE_TTL = config.ai.timeoutMs / 1000;

  constructor(
    private readonly llmClient: LLMClient,
    private readonly cache: ICache
  ) {
    this.chartAnalysisService = new ChartAnalysisService(llmClient, cache);
    this.transitAnalysisService = new TransitAnalysisService(llmClient, cache);
    this.houseAnalysisService = new HouseAnalysisService(llmClient, cache);
    this.patternAnalysisService = new PatternAnalysisService(llmClient, cache);
  }

  private getCacheKey(type: string, id: string): string {
    return `${this.CACHE_PREFIX}${type}:${id}`;
  }

  // Core Identity and Life Theme Analysis
  async generateLifeThemeInsight(themeData: LifeTheme): Promise<{ insight: string; log: Partial<InsightLog> }> {
    try {
      this.logStartInsightGeneration('life theme', themeData.id);
      const result = await this.patternAnalysisService.generateLifeThemeInsight(themeData);
      this.logCompletion('life theme', themeData.id);
      return result;
    } catch (error) {
      this.handleInsightError(error, themeData.id, themeData.id);
      throw error;
    }
  }

  async generateNatalChartInsight(birthChart: BirthChartDocument): Promise<{ insight: string; log: InsightLog }> {
    try {
      this.logStartInsightGeneration('natal chart', birthChart._id);
      const result = await this.chartAnalysisService.generateNatalChartInsight(birthChart);
      this.logCompletion('natal chart', birthChart._id);
      return result;
    } catch (error) {
      this.handleInsightError(error, birthChart._id.toString(), birthChart._id.toString());
      throw error;
    }
  }

  // Transit Analysis
  async generateTransitInsight(transitData: Transit): Promise<{ insight: string; log: Partial<InsightLog> }> {
    try {
      this.logStartInsightGeneration('transit', transitData.planet);
      const result = await this.transitAnalysisService.generateTransitInsight(transitData);
      this.logCompletion('transit', transitData.planet);
      return result;
    } catch (error) {
      this.handleInsightError(error, transitData.planet, transitData.planet);
      throw error;
    }
  }

  async generateWeeklyDigest(
    birthChart: BirthChartDocument,
    transits: Transit[],
    startDate: Date,
    transitInsights: string[] = []
  ): Promise<{ insight: string; log: InsightLog }> {
    try {
      this.logStartInsightGeneration('weekly digest', birthChart._id);
      const result = await this.transitAnalysisService.generateWeeklyDigest(
        birthChart,
        transits,
        startDate,
        transitInsights
      );
      this.logCompletion('weekly digest', birthChart._id);
      return result;
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
      const result = await this.transitAnalysisService.generateThemeForecast(birthChart, themes, transits);
      this.logCompletion('theme forecast', birthChart._id);
      return result;
    } catch (error) {
      this.handleInsightError(error, birthChart._id.toString(), birthChart._id.toString());
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
      const result = await this.transitAnalysisService.getOrGenerateDailyInsight(
        birthChart,
        transits,
        currentDate
      );
      this.logCompletion('daily insight', birthChart._id);
      return result;
    } catch (error) {
      this.handleInsightError(error, birthChart._id.toString(), birthChart._id.toString());
      throw error;
    }
  }

  // Delegated Analysis Methods
  async analyzeStrengths(birthChart: BirthChartDocument) {
    return this.chartAnalysisService.analyzeStrengths(birthChart);
  }

  async analyzeChallenges(birthChart: BirthChartDocument) {
    return this.chartAnalysisService.analyzeChallenges(birthChart);
  }

  async analyzePatterns(birthChart: BirthChartDocument) {
    return this.chartAnalysisService.analyzePatterns(birthChart);
  }

  async analyzeHouseThemes(birthChart: BirthChartDocument) {
    return this.houseAnalysisService.analyzeHouseThemes(birthChart);
  }

  async analyzeHouseLords(birthChart: BirthChartDocument) {
    return this.houseAnalysisService.analyzeHouseLords(birthChart);
  }

  async generateNodeInsight(birthChart: BirthChartDocument) {
    return this.patternAnalysisService.generateNodeInsight(birthChart);
  }

  async generateCoreIdentityDescription(birthChart: BirthChartDocument) {
    return this.patternAnalysisService.generateCoreIdentityDescription(birthChart);
  }

  async analyzeSmartTimingWindows(birthChart: BirthChartDocument, transits: Transit[], currentDate: Date) {
    return this.transitAnalysisService.analyzeSmartTimingWindows(birthChart, transits, currentDate);
  }

  async generatePatternInsight(patternData: {
    type: string;
    sign: string;
    count: number;
    planets: Array<{
      id: number;
      sign: string;
      house: number;
      degree: number;
      retrograde: boolean;
    }>;
    birthChart: BirthChartDocument;
  }): Promise<{ insight: string; log: Partial<InsightLog> }> {
    try {
      this.logStartInsightGeneration('pattern', patternData.type);
      const result = await this.patternAnalysisService.generatePatternInsight(patternData);
      this.logCompletion('pattern', patternData.type);
      return result;
    } catch (error) {
      this.handleInsightError(error, patternData.type, patternData.type);
      throw error;
    }
  }

  // Logging and Error Handling
  private logStartInsightGeneration(type: string, id: unknown): void {
    logger.info(`Starting ${type} insight generation`, { id });
  }

  private logCompletion(type: string, id: unknown): void {
    logger.info(`Completed ${type} insight generation`, { id });
  }

  private handleInsightError(error: unknown, userId: string, chartId: string): void {
    logger.error('Error generating insight', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
      chartId
    });

    if (error instanceof ServiceError) {
      throw error;
    }

    throw new ServiceError(`Failed to generate insight for user ${userId} and chart ${chartId}`);
  }
} 


