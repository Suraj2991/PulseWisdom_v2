import { AIService } from '../../ai';
import { logger } from '../../../shared/logger';
import { AppError } from '../../../domain/errors';
import { ICache } from '../../../infrastructure/cache/ICache';
import { InsightLog } from '../../ai/types/personalization.types';
import { BirthChartDocument } from '../../birthchart/types/birthChart.types';
import { Transit } from '../../transit';
import { ServiceError } from '../../../domain/errors';
import { InsightAnalysis, Insight, InsightType, InsightCategory, InsightSeverity, InsightCacheKey } from '../types/insight.types';
import { InsightGeneratorFactory } from './InsightGeneratorFactory';
import { getPrimaryTransit, createInsightLog, determineTransitLifeArea, determineTransitTrigger } from '../utils/insight.utils';

export class InsightGenerator {
  private readonly CACHE_PREFIX = 'insight:';

  constructor(
    private readonly cache: ICache,
    private readonly aiService: AIService
  ) {}

  private getCacheKey(type: InsightCacheKey, id: string): string {
    return `${this.CACHE_PREFIX}${type}:${id}`;
  }

  async generateDailyInsight(birthChart: BirthChartDocument): Promise<Insight> {
    try {
      const result = await this.getOrGenerateDailyInsight(birthChart, [], new Date());
      const generator = InsightGeneratorFactory.getGenerator(InsightType.DAILY);
      const insights = await generator.generate({
        birthChartId: birthChart._id.toString(),
        userId: birthChart.userId.toString(),
        type: InsightType.DAILY,
        content: result.insight,
        insights: [],
        overallSummary: '',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      if (insights.length === 0) {
        throw new Error('No insights generated');
      }

      const insightObj = insights[0];
      await this.cache.set(this.getCacheKey(InsightCacheKey.DAILY, birthChart._id.toString()), insightObj);
      return insightObj;
    } catch (error) {
      logger.error('Failed to generate daily insight', { 
        error,
        insightType: InsightType.DAILY,
        birthChartId: birthChart._id.toString(),
        userId: birthChart.userId.toString()
      });
      throw new ServiceError(`Failed to generate daily insight: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateWeeklyDigest(birthChart: BirthChartDocument): Promise<Insight> {
    try {
      const { insight } = await this.aiService.generateWeeklyDigest(birthChart, [], new Date());
      const generator = InsightGeneratorFactory.getGenerator(InsightType.WEEKLY_DIGEST);
      const insights = await generator.generate({
        birthChartId: birthChart._id.toString(),
        userId: birthChart.userId.toString(),
        type: InsightType.WEEKLY_DIGEST,
        content: insight,
        insights: [],
        overallSummary: '',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      if (insights.length === 0) {
        throw new Error('No insights generated');
      }

      const insightObj = insights[0];
      await this.cache.set(this.getCacheKey(InsightCacheKey.WEEKLY_DIGEST, birthChart._id.toString()), insightObj);
      return insightObj;
    } catch (error) {
      logger.error('Failed to generate weekly digest', { 
        error,
        insightType: InsightType.WEEKLY_DIGEST,
        birthChartId: birthChart._id.toString(),
        userId: birthChart.userId.toString()
      });
      throw new ServiceError(`Failed to generate weekly digest: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateThemeForecast(birthChart: BirthChartDocument): Promise<Insight> {
    try {
      const { insight } = await this.aiService.generateThemeForecast(birthChart, [], []);
      const generator = InsightGeneratorFactory.getGenerator(InsightType.THEME_FORECAST);
      const insights = await generator.generate({
        birthChartId: birthChart._id.toString(),
        userId: birthChart.userId.toString(),
        type: InsightType.THEME_FORECAST,
        content: insight,
        insights: [],
        overallSummary: '',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      if (insights.length === 0) {
        throw new Error('No insights generated');
      }

      const insightObj = insights[0];
      await this.cache.set(this.getCacheKey(InsightCacheKey.THEME_FORECAST, birthChart._id.toString()), insightObj);
      return insightObj;
    } catch (error) {
      logger.error('Failed to generate theme forecast', { 
        error,
        insightType: InsightType.THEME_FORECAST,
        birthChartId: birthChart._id.toString(),
        userId: birthChart.userId.toString()
      });
      throw new ServiceError(`Failed to generate theme forecast: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateInsights(analysis: InsightAnalysis): Promise<Insight[]> {
    try {
      logger.info('Generating insights from analysis', {
        insightType: analysis.type,
        birthChartId: analysis.birthChartId,
        userId: analysis.userId
      });

      const insights: Insight[] = [];
      const generators = InsightGeneratorFactory.getAllGenerators();

      for (const generator of generators) {
        const generatorInsights = await generator.generate(analysis);
        insights.push(...generatorInsights);
      }

      return insights;
    } catch (error) {
      logger.error('Failed to generate insights', { 
        error,
        insightType: analysis.type,
        birthChartId: analysis.birthChartId,
        userId: analysis.userId
      });
      throw new AppError('Failed to generate insights: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async getOrGenerateDailyInsight(
    birthChart: BirthChartDocument,
    transits: Transit[],
    currentDate: Date
  ): Promise<{ insight: string; insightLog: InsightLog }> {
    try {
      logger.info('Starting daily insight generation', { 
        birthChartId: birthChart._id.toString(),
        userId: birthChart.userId.toString(),
        insightType: InsightType.DAILY,
        date: currentDate.toISOString(),
        transitCount: transits.length
      });
      
      const result = await this.aiService.getOrGenerateDailyInsight(birthChart, transits, currentDate);
      
      const primaryTransit = getPrimaryTransit(transits);
      const insightLog = createInsightLog(InsightType.DAILY, result.insight, {
        date: currentDate,
        lifeArea: primaryTransit ? determineTransitLifeArea(primaryTransit) : undefined,
        transitAspect: primaryTransit?.type,
        transitCount: transits.length,
        triggeredBy: primaryTransit ? determineTransitTrigger(primaryTransit) : undefined
      });

      logger.info('Completed daily insight generation', { 
        birthChartId: birthChart._id.toString(),
        userId: birthChart.userId.toString(),
        insightType: InsightType.DAILY,
        date: currentDate.toISOString()
      });
      
      return { insight: result.insight, insightLog };
    } catch (error) {
      logger.error('Failed to generate daily insight', { 
        error,
        insightType: InsightType.DAILY,
        birthChartId: birthChart._id.toString(),
        userId: birthChart.userId.toString(),
        date: currentDate.toISOString()
      });
      throw new ServiceError(`Failed to generate daily insight: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public generateOverallSummary(insights: Insight[]): string {
    const highSeverityInsights = insights.filter(i => i.severity === InsightSeverity.HIGH);
    const opportunities = insights.filter(i => i.category === InsightCategory.OPPORTUNITIES);
    const challenges = insights.filter(i => i.category === InsightCategory.CHALLENGES);

    return `Analysis reveals ${highSeverityInsights.length} significant insights, with ${opportunities.length} opportunities and ${challenges.length} challenges.`;
  }
} 