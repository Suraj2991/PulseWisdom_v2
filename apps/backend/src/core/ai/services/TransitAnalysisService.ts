import { BirthChartDocument } from '../../birthchart';
import { Transit, WindowType } from '../../transit';
import { TimingWindow, InsightType, InsightLog } from '../../insight/types/insight.types';
import { LLMClient } from '..';
import { ICache } from '../../../infrastructure/cache/ICache';
import { logger } from '../../../shared/logger';
import { ServiceError } from '../../../domain/errors';
import { PromptBuilder } from '../prompts/PromptBuilder';
import { adaptBirthChartData } from '../../birthchart';
import { AspectType } from '../../../shared/constants/astrology';
import { LifeTheme } from '../../life-theme';
import { createInsightLog, getPrimaryTransit, determineTransitLifeArea, determineTransitTrigger } from '../../insight';

export class TransitAnalysisService {
  private readonly CACHE_PREFIX = 'ai:transit:';
  private readonly CACHE_TTL = 3600; // 1 hour in seconds

  constructor(
    private readonly llmClient: LLMClient,
    private readonly cache: ICache
  ) {}

  private getCacheKey(type: string, id: string): string {
    return `${this.CACHE_PREFIX}${type}:${id}`;
  }

  async analyzeSmartTimingWindows(
    birthChart: BirthChartDocument,
    transits: Transit[],
    currentDate: Date
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

      // Filter transits to only include those within a reasonable time range from current date
      const relevantTransits = transits.filter(transit => {
        const transitDate = new Date(transit.exactDate);
        const daysDiff = Math.abs(transitDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24);
        // Include transits within 90 days before and 180 days after current date
        return daysDiff <= 180 && transitDate.getTime() - currentDate.getTime() >= -90 * 24 * 60 * 60 * 1000;
      });

      // Sort transits by proximity to current date
      relevantTransits.sort((a, b) => {
        const aDiff = Math.abs(new Date(a.exactDate).getTime() - currentDate.getTime());
        const bDiff = Math.abs(new Date(b.exactDate).getTime() - currentDate.getTime());
        return aDiff - bDiff;
      });

      const timingWindows = this.generateTimingWindows(relevantTransits);
      
      // Add relative timing information to each window
      const windowsWithTiming = timingWindows.map(window => ({
        ...window,
        isActive: this.isWindowActive(window, currentDate),
        daysUntilStart: this.calculateDaysUntilStart(window, currentDate),
        daysRemaining: this.calculateDaysRemaining(window, currentDate)
      }));

      await this.cache.set(cacheKey, windowsWithTiming, this.CACHE_TTL);
      logger.info('Cached smart timing windows analysis', { 
        birthChartId: birthChart._id.toString(),
        userId: birthChart.userId.toString(),
        insightType: 'smart_timing_windows',
        windowCount: windowsWithTiming.length
      });
      return windowsWithTiming;
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

  private generateTimingWindows(transits: Transit[]): TimingWindow[] {
    const transitGroups = this.groupTransitsByDateRange(transits);
    
    return transitGroups.map(group => ({
      startDate: group.startDate,
      endDate: group.endDate,
      type: this.determineWindowType(group.transits),
      title: this.generateWindowTitle(group.transits),
      description: this.generateWindowDescription(group.transits),
      involvedPlanets: Array.from(new Set(group.transits.map(t => t.planet))),
      aspectType: this.determineAspectType(group.transits),
      keywords: this.extractKeywords(group.transits),
      transits: group.transits,
      strength: this.calculateWindowStrength(group.transits)
    }));
  }

  private groupTransitsByDateRange(transits: Transit[]): Array<{
    startDate: Date;
    endDate: Date;
    transits: Transit[];
  }> {
    const sortedTransits = [...transits].sort((a, b) => 
      a.exactDate.getTime() - b.exactDate.getTime()
    );
    
    const groups: Array<{
      startDate: Date;
      endDate: Date;
      transits: Transit[];
    }> = [];
    
    let currentGroup: Transit[] = [];
    let currentStartDate: Date | null = null;
    
    for (const transit of sortedTransits) {
      if (!currentStartDate) {
        currentStartDate = transit.exactDate;
        currentGroup = [transit];
      } else if (this.isWithinRange(transit.exactDate, currentStartDate, 7)) {
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
    return new Date(Math.max(...transits.map(t => t.exactDate.getTime())) + 24 * 60 * 60 * 1000);
  }

  private determineWindowType(transits: Transit[]): TimingWindow['type'] {
    const aspects = transits.map(t => t.type);
    if (aspects.some(a => ['Trine', 'Sextile'].includes(a))) {
      return WindowType.Opportunity;
    } else if (aspects.some(a => ['Conjunction'].includes(a))) {
      return WindowType.Integration;
    } else if (aspects.some(a => ['Square', 'Opposition'].includes(a))) {
      return WindowType.Challenge;
    }
    return WindowType.Integration;
  }

  private generateWindowTitle(transits: Transit[]): string {
    const planets = Array.from(new Set(transits.map(t => t.planet)));
    const aspects = Array.from(new Set(transits.map(t => t.type)));
    return `${planets.join('-')} ${aspects[0]} Period`;
  }

  private generateWindowDescription(transits: Transit[]): string {
    return `A period of ${this.determineWindowType(transits).toLowerCase()} with ${transits.length} significant transits.`;
  }

  private determineAspectType(transits: Transit[]): string {
    return transits[0]?.type || 'Unknown';
  }

  private extractKeywords(transits: Transit[]): string[] {
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
    
    const aspectScores = transits.map(t => 
      aspectStrengths[t.type as AspectType] || 0.5
    );
    
    const weightedScore = aspectScores.reduce(
      (sum, score, i) => sum + score * orbStrengths[i], 
      0
    ) / transits.length;
    
    return Math.min(Math.max(weightedScore, 0), 1);
  }

  private isWindowActive(window: TimingWindow, currentDate: Date): boolean {
    return currentDate >= window.startDate && currentDate <= window.endDate;
  }

  private calculateDaysUntilStart(window: TimingWindow, currentDate: Date): number {
    if (currentDate >= window.startDate) return 0;
    return Math.ceil((window.startDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  private calculateDaysRemaining(window: TimingWindow, currentDate: Date): number {
    if (currentDate > window.endDate) return 0;
    if (currentDate < window.startDate) return Math.ceil((window.endDate.getTime() - window.startDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.ceil((window.endDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  async generateTransitInsight(transitData: Transit): Promise<{ insight: string; log: Partial<InsightLog> }> {
    try {
      const prompt = PromptBuilder.buildTransitPrompt(transitData, true);
      const insight = await this.llmClient.generateInsight(prompt);
      
      const log = {
        id: transitData.planet,
        userId: transitData.planet,
        insightType: InsightType.TRANSIT,
        content: insight,
        generatedAt: new Date(),
        metadata: {
          date: transitData.exactDate,
          planet: transitData.planet,
          sign: transitData.sign,
          house: transitData.house,
          orb: transitData.orb,
          lifeArea: determineTransitLifeArea(transitData),
          transitAspect: transitData.type,
          triggeredBy: determineTransitTrigger(transitData)
        }
      };

      return { insight, log };
    } catch (error) {
      logger.error('Failed to generate transit insight', { 
        error, 
        planet: transitData.planet,
        insightType: 'transit'
      });
      throw new ServiceError(`Failed to generate transit insight: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateWeeklyDigest(
    birthChart: BirthChartDocument,
    transits: Transit[],
    startDate: Date,
    transitInsights: string[] = []
  ): Promise<{ insight: string; log: InsightLog }> {
    try {
      const adaptedChart = adaptBirthChartData(birthChart);
      const prompt = PromptBuilder.buildWeeklyDigestPrompt(
        adaptedChart,
        transits,
        transitInsights,
        startDate,
        true
      );

      const insight = await this.llmClient.generateInsight(prompt);
      
      const log = {
        id: birthChart._id.toString(),
        userId: birthChart.userId.toString(),
        insightType: InsightType.DAILY,
        content: insight,
        generatedAt: new Date(),
        metadata: {
          date: startDate,
          birthChartId: birthChart._id.toString(),
          keyTransits: transits.map(t => ({
            planet: t.planet,
            sign: t.sign,
            house: t.house || 0,
            orb: t.orb || 0,
            aspectingNatal: t.aspectingNatal
          })),
          activePlanets: Array.from(new Set(transits.map(t => t.planet)))
        }
      };

      return { insight, log };
    } catch (error) {
      logger.error('Failed to generate weekly digest', { 
        error, 
        birthChartId: birthChart._id.toString(),
        userId: birthChart.userId.toString(),
        insightType: 'weekly_digest'
      });
      throw new ServiceError(`Failed to generate weekly digest: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateThemeForecast(
    birthChart: BirthChartDocument,
    themes: LifeTheme[],
    transits: Transit[]
  ): Promise<{ insight: string; log: Partial<InsightLog> }> {
    try {
      const adaptedChart = adaptBirthChartData(birthChart);
      const prompt = PromptBuilder.buildThemeForecastPrompt(
        adaptedChart,
        themes,
        transits,
        true
      );

      const insight = await this.llmClient.generateInsight(prompt);
      
      const log = {
        id: birthChart._id.toString(),
        userId: birthChart.userId.toString(),
        insightType: InsightType.THEME_FORECAST,
        content: insight,
        generatedAt: new Date(),
        metadata: {
          date: new Date(),
          birthChartId: birthChart._id.toString(),
          themeCount: themes.length,
          transitCount: transits.length
        }
      };

      return { insight, log };
    } catch (error) {
      logger.error('Failed to generate theme forecast', { 
        error, 
        birthChartId: birthChart._id.toString(),
        userId: birthChart.userId.toString(),
        insightType: 'theme_forecast'
      });
      throw new ServiceError(`Failed to generate theme forecast: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getOrGenerateDailyInsight(
    birthChart: BirthChartDocument,
    transits: Transit[],
    currentDate: Date
  ): Promise<{ insight: string; insightLog: InsightLog }> {
    try {
      const cacheKey = this.getCacheKey('daily', `${birthChart._id}-${currentDate.toISOString().split('T')[0]}`);
      const cached = await this.cache.get<{ insight: string; insightLog: InsightLog }>(cacheKey);
      if (cached) {
        return cached;
      }

      const adaptedChart = adaptBirthChartData(birthChart);
      const prompt = PromptBuilder.buildDailyInsightPrompt(adaptedChart, transits, currentDate, true);
      const insight = await this.llmClient.generateInsight(prompt);
      
      const primaryTransit = getPrimaryTransit(transits);
      const insightLog = createInsightLog(
        InsightType.DAILY,
        insight,
        {
          date: currentDate,
          lifeArea: primaryTransit ? determineTransitLifeArea(primaryTransit) : undefined,
          transitAspect: primaryTransit?.type,
          transitCount: transits.length,
          triggeredBy: primaryTransit ? determineTransitTrigger(primaryTransit) : undefined
        },
        birthChart.userId.toString()
      );

      const result = { insight, insightLog };
      await this.cache.set(cacheKey, result, this.CACHE_TTL);
      return result;
    } catch (error) {
      logger.error('Failed to generate daily insight', { 
        error, 
        birthChartId: birthChart._id.toString(),
        userId: birthChart.userId.toString(),
        insightType: 'daily'
      });
      throw new ServiceError(`Failed to generate daily insight: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 