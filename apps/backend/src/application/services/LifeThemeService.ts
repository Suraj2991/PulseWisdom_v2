import { Types } from 'mongoose';
import { ICache } from '../../infrastructure/cache/ICache';
import { LifeTheme } from '../../domain/types/lifeTheme.types';
import { LifeThemeAnalysis } from '../../domain/types/lifeThemeAnalysis.types';
import { NotFoundError, DatabaseError, CacheError, AppError } from '../../domain/errors';
import { EphemerisService } from './EphemerisService';
import { AIService } from './AIService';
import { BirthChart } from '../../domain/types/ephemeris.types';
import { BirthChartService } from './BirthChartService';
import { logger } from '../../shared/logger';
import { DateTime } from 'luxon';
import crypto from 'crypto';
import { InsightCategory, InsightSeverity } from '../../domain/types/insight.types';
import { BirthChartDocument } from '../../domain/models/BirthChart';
import { validateLifeThemeRequest } from '../../domain/validators/lifetheme.validator';

interface LifeThemeRequest {
  birthChartId: string;
}

export class LifeThemeService {
  private readonly CACHE_PREFIX = 'lifeTheme:';
  private readonly CACHE_TTL = 3600; // 1 hour in seconds

  constructor(
    private readonly cache: ICache,
    private readonly birthChartService: BirthChartService,
    private readonly aiService: AIService
  ) {}

  async getBirthChart(birthChartId: string): Promise<BirthChartDocument> {
    try {
      this.logInfo('Getting birth chart', { birthChartId });
      const birthChart = await this.birthChartService.getBirthChartById(birthChartId);
      if (!birthChart) {
        throw new NotFoundError('Birth chart not found');
      }
      return birthChart;
    } catch (error) {
      this.handleError('Failed to get birth chart', error, { birthChartId });
    }
  }

  async analyzeLifeThemes(input: LifeThemeRequest): Promise<LifeTheme[]> {
    validateLifeThemeRequest(input);

    try {
      this.logInfo('Analyzing life themes', { birthChartId: input.birthChartId });
      const birthChart = await this.getBirthChart(input.birthChartId);
      return await this.generateLifeThemes(birthChart, input.birthChartId);
    } catch (error) {
      this.handleError('Failed to analyze life themes', error, { birthChartId: input.birthChartId });
    }
  }

  private async generateLifeThemes(birthChart: BirthChartDocument, birthChartId: string): Promise<LifeTheme[]> {
    try {
      this.logInfo('Starting life theme generation', { birthChartId });
      
      const themes = await this.identifyThemes(birthChart);
      
      this.logInfo('Completed life theme generation', { 
        birthChartId,
        themeCount: themes.length 
      });
      
      return themes;
    } catch (error) {
      this.handleError('Failed to generate life themes', error, { birthChartId });
    }
  }

  private async identifyThemes(birthChart: BirthChartDocument): Promise<LifeTheme[]> {
    const themes: LifeTheme[] = [];
    
    if (this.hasTransformationTheme(birthChart)) {
      themes.push(this.createTransformationTheme());
    }
    
    // Add more theme identification logic here
    
    return themes;
  }

  private hasTransformationTheme(birthChart: BirthChartDocument): boolean {
    return birthChart.aspects.some(a => 
      a.body1 === 'Sun' && 
      a.body2 === 'Pluto' && 
      a.type === 'Conjunction'
    );
  }

  private createTransformationTheme(): LifeTheme {
    return {
      id: crypto.randomUUID(),
      title: 'Transformation & Empowerment',
      description: 'You carry a deep capacity for inner transformation...',
      category: InsightCategory.PERSONAL_GROWTH,
      severity: InsightSeverity.HIGH,
      aspects: ['Sun conjunct Pluto'],
      supportingFactors: ['Strong Pluto influence'],
      challenges: ['Intense transformation periods'],
      recommendations: ['Embrace change and personal growth'],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async generateLifeThemeInsights(birthChart: BirthChartDocument, birthChartId: string): Promise<string> {
    try {
      this.logInfo('Starting life theme insight generation', { birthChartId });
      
      const themes = await this.generateLifeThemes(birthChart, birthChartId);
      const insights = await this.generateInsightsForThemes(themes);
      
      this.logInfo('Completed life theme insight generation', { 
        birthChartId,
        insightCount: insights.length 
      });
      
      return insights.join('\n\n');
    } catch (error) {
      this.handleError('Failed to generate life theme insights', error, { birthChartId });
    }
  }

  private async generateInsightsForThemes(themes: LifeTheme[]): Promise<string[]> {
    return Promise.all(
      themes.map(theme => this.aiService.generateLifeThemeInsight(theme))
    );
  }

  private getSignName(longitude: number): string {
    const signs = [
      'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
      'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
    ];
    return signs[Math.floor(longitude / 30)];
  }

  private getPlanetName(planetId: number): string {
    const planets: Record<number, string> = {
      0: 'Sun',
      1: 'Moon',
      2: 'Mercury',
      3: 'Venus',
      4: 'Mars',
      5: 'Jupiter',
      6: 'Saturn',
      7: 'Uranus',
      8: 'Neptune',
      9: 'Pluto'
    };
    return planets[planetId] || `Planet ${planetId}`;
  }

  async getLifeThemesByUserId(userId: string): Promise<LifeThemeAnalysis[]> {
    try {
      const birthCharts = await this.birthChartService.getBirthChartsByUserId(userId);
      return this.analyzeThemesForBirthCharts(birthCharts);
    } catch (error) {
      this.handleError('Failed to get life themes by user ID', error, { userId });
    }
  }

  private async analyzeThemesForBirthCharts(birthCharts: BirthChartDocument[]): Promise<LifeThemeAnalysis[]> {
    return Promise.all(
      birthCharts.map(chart => this.createThemeAnalysis(chart))
    );
  }

  private async createThemeAnalysis(chart: BirthChartDocument): Promise<LifeThemeAnalysis> {
    return {
      birthChartId: chart._id.toString(),
      userId: chart.userId,
      themes: await this.analyzeLifeThemes({ birthChartId: chart._id.toString() }),
      createdAt: chart.createdAt,
      updatedAt: chart.updatedAt
    };
  }

  async updateLifeThemes(birthChartId: string, updates: Partial<LifeThemeAnalysis>): Promise<LifeThemeAnalysis> {
    try {
      const [themes, birthChart] = await this.getThemesAndBirthChart(birthChartId);
      const updatedAnalysis = await this.createUpdatedAnalysis(birthChart, themes, updates);
      await this.cacheAnalysis(birthChartId, updatedAnalysis);
      return updatedAnalysis;
    } catch (error) {
      this.handleError('Failed to update life themes', error, { birthChartId });
    }
  }

  private async getThemesAndBirthChart(birthChartId: string): Promise<[LifeTheme[], BirthChartDocument]> {
    const themes = await this.analyzeLifeThemes({ birthChartId });
    const birthChart = await this.birthChartService.getBirthChartById(birthChartId);
    
    if (!birthChart) {
      throw new NotFoundError('Birth chart not found');
    }
    
    return [themes, birthChart];
  }

  private async createUpdatedAnalysis(
    birthChart: BirthChartDocument,
    themes: LifeTheme[],
    updates: Partial<LifeThemeAnalysis>
  ): Promise<LifeThemeAnalysis> {
    return {
      birthChartId: birthChart._id.toString(),
      userId: birthChart.userId,
      themes,
      createdAt: birthChart.createdAt,
      updatedAt: new Date(),
      ...updates
    };
  }

  private async cacheAnalysis(birthChartId: string, analysis: LifeThemeAnalysis): Promise<void> {
    try {
      await this.cache.set(`${this.CACHE_PREFIX}${birthChartId}`, analysis, this.CACHE_TTL);
      this.logDebug('Cached life themes', { birthChartId });
    } catch (error) {
      this.logError('Cache set error', error, { birthChartId });
    }
  }

  private logInfo(message: string, context: Record<string, unknown>): void {
    logger.info(message, context);
  }

  private logDebug(message: string, context: Record<string, unknown>): void {
    logger.debug(message, context);
  }

  private logError(message: string, error: unknown, context: Record<string, unknown>): void {
    logger.error(message, { error, ...context });
  }

  private handleError(message: string, error: unknown, context: Record<string, unknown>): never {
    this.logError(message, error, context);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(`${message}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 