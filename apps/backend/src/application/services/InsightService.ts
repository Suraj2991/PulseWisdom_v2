import { DateTime } from '../../shared/types/ephemeris.types';
import { InsightAnalysis, Insight, InsightType, InsightCategory, InsightSeverity, BaseInsight } from '../../domain/types/insight.types';
import { ICache } from '../../infrastructure/cache/ICache';
import { EphemerisService } from '../services/EphemerisService';
import { LifeThemeService } from '../services/LifeThemeService';
import { NotFoundError, ValidationError, DatabaseError, CacheError, AppError, ServiceError } from '../../domain/errors';
import { BirthChartService } from '../services/BirthChartService';
import { TransitService } from '../services/TransitService';
import { AIService } from '../services/AIService';
import { logger } from '../../shared/logger';
import { InsightGenerator } from './insight/InsightGenerator';
import { InsightRepository } from './insight/InsightRepository';
import { InsightAnalyzer } from './insight/InsightAnalyzer';
import { validateInsightRequest, validateInsightUpdatePayload } from '../../domain/validators/insight.validator';
import { Sanitizer } from '../../shared/sanitization';
import { IInsight, InsightDocument } from '../../domain/models/Insight';
import { InsightDatabaseRepository } from '../../infrastructure/database/InsightRepository';
import { ObjectId } from 'mongodb';

export class InsightService {
  private readonly CACHE_PREFIX = 'insight:';
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly insightRepository: InsightDatabaseRepository;
  private readonly analysisRepository: InsightRepository;

  constructor(
    private readonly cache: ICache,
    private readonly ephemerisService: EphemerisService,
    private readonly lifeThemeService: LifeThemeService,
    private readonly birthChartService: BirthChartService,
    private readonly transitService: TransitService,
    private readonly aiService: AIService,
    private readonly insightGenerator: InsightGenerator,
    private readonly insightAnalyzer: InsightAnalyzer,
    insightRepository: InsightDatabaseRepository,
    analysisRepository: InsightRepository
  ) {
    this.insightRepository = insightRepository;
    this.analysisRepository = analysisRepository;
  }

  private logInfo(message: string, data?: any): void {
    logger.info(`[InsightService] ${message}`, data);
  }

  private logError(message: string, error: Error): void {
    logger.error(`[InsightService] ${message}`, { error });
  }

  private handleError(error: Error, context: string): never {
    this.logError(context, error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new ServiceError(`Failed to ${context}: ${error.message}`);
  }

  private async getCachedInsights(key: string): Promise<InsightAnalysis | null> {
    try {
      return await this.cache.get<InsightAnalysis>(`${this.CACHE_PREFIX}${key}`);
    } catch (error) {
      this.logError('Failed to get cached insights', error as Error);
      return null;
    }
  }

  private async cacheInsights(key: string, insights: InsightAnalysis): Promise<void> {
    try {
      await this.cache.set(`${this.CACHE_PREFIX}${key}`, insights, this.CACHE_TTL);
    } catch (error) {
      this.logError('Failed to cache insights', error as Error);
    }
  }

  async analyzeInsights(birthChartId: string, date: Date = new Date()): Promise<InsightAnalysis> {
    try {
      this.logInfo('Analyzing insights', { birthChartId, date });

      const cacheKey = `${birthChartId}:${date.toISOString()}`;
      const cachedInsights = await this.getCachedInsights(cacheKey);
      if (cachedInsights) {
        return cachedInsights;
      }

      const birthChart = await this.birthChartService.getBirthChartById(birthChartId);
      if (!birthChart) {
        throw new NotFoundError(`Birth chart not found: ${birthChartId}`);
      }

      const insights = await this.generateInsights(birthChartId);
      const analysis = await this.insightAnalyzer.analyzeInsights(birthChartId, date);

      await this.cacheInsights(cacheKey, analysis);
      return analysis;
    } catch (error) {
      this.handleError(error as Error, 'analyze insights');
    }
  }

  private convertToInsight(iInsight: InsightDocument): Insight {
    const baseInsight: BaseInsight = {
      id: iInsight._id.toString(),  
      type: InsightType.CORE_IDENTITY, // Default type
      category: InsightCategory.STRENGTHS, // Default category
      severity: InsightSeverity.MEDIUM, // Default severity
      title: iInsight.type,
      description: iInsight.content,
      date: iInsight.timestamp,
      aspects: iInsight.insights[0]?.aspects?.map(aspect => ({
        body1Id: aspect.bodyId,
        body2Id: aspect.bodyId,
        type: aspect.type,
        angle: 0,
        orb: aspect.orb,
        isApplying: false
      })) || [],
      houses: [],
      supportingFactors: [],
      challenges: [],
      recommendations: []
    };

    // Create a CoreIdentityInsight by default
    return {
      ...baseInsight,
      type: InsightType.CORE_IDENTITY,
      sunSign: '',
      moonSign: '',
      ascendantSign: ''
    };
  }

  private async findInsightById(insightId: string): Promise<InsightDocument | null> {
    try {
      const insight = await this.insightRepository.findById(insightId);
      if (!insight) {
        throw new Error(`Insight with id ${insightId} not found`);
      }
      return insight as InsightDocument;
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error getting insight by id', { error: error.message });
      } else {
        logger.error('Unknown error getting insight by id');
      }
      throw error;
    }
  }

  private convertToIInsight(insight: Insight): Omit<IInsight, '_id' | 'createdAt' | 'updatedAt'> {
    // Extract common fields from the insight
    const { description, type, date } = insight;

    // Create the base IInsight object
    const iInsight: Omit<IInsight, '_id' | 'createdAt' | 'updatedAt'> = {
      content: description,
      type: type.toString(),
      userId: new ObjectId(),
      birthChartId: new ObjectId(),
      insights: [{
        type: type.toString(),
        description: description,
        bodyId: 0 // Default to Sun
      }],
      timestamp: date
    };

    // Add type-specific fields
    switch (insight.type) {
      case InsightType.ASPECT:
        iInsight.insights[0].aspects = [{
          bodyId: insight.planet1Id,
          type: insight.aspectType,
          orb: 0
        }];
        break;
      case InsightType.PATTERN:
        iInsight.insights[0].bodyId = insight.planets[0]?.id || 0;
        break;
      case InsightType.CORE_IDENTITY:
      case InsightType.LIFE_THEME:
      case InsightType.TRANSIT:
      case InsightType.BIRTH_CHART:
        // These types don't need additional fields
        break;
    }

    return iInsight;
  }

  async getInsightById(id: string): Promise<Insight> {
    try {
      // Try to get from cache first
      const cachedAnalysis = await this.analysisRepository.getAnalysis(id);
      if (cachedAnalysis) {
        this.logInfo('Retrieved insight from cache', { id });
        return cachedAnalysis.insights[0];
      }

      // If not in cache, get from database
      const insight = await this.insightRepository.findById(id);
      if (!insight) {
        throw new NotFoundError(`Insight not found with id: ${id}`);
      }

      // Cache the result
      const analysis: InsightAnalysis = {
        birthChartId: insight.birthChartId.toString(),
        userId: insight.userId.toString(),
        content: insight.content,
        type: insight.type,
        insights: [this.convertToInsight(insight as InsightDocument)],
        overallSummary: '',
        createdAt: insight.createdAt,
        updatedAt: insight.updatedAt
      };
      await this.analysisRepository.saveAnalysis(analysis);
      this.logInfo('Retrieved insight from database and cached', { id });
      return this.convertToInsight(insight as InsightDocument);
    } catch (error) {
      this.handleError(error as Error, 'get insight by id');
    }
  }

  private async getInsightsByUserId(userId: string): Promise<InsightDocument[]> {
    return this.insightRepository.findByUserId(userId) as Promise<InsightDocument[]>;
  }

  async getInsightsByCategory(birthChartId: string, category: InsightCategory): Promise<Insight[]> {
    try {
      this.logInfo('Getting insights by category', { birthChartId, category });

      const analysis = await this.analyzeInsights(birthChartId);
      return analysis.insights.filter(insight => insight.category === category);
    } catch (error) {
      this.handleError(error as Error, 'get insights by category');
    }
  }

  async updateInsights(birthChartId: string, updates: Partial<InsightAnalysis>): Promise<InsightAnalysis> {
    try {
      this.logInfo('Updating insights', { birthChartId, updates });

      validateInsightUpdatePayload(updates);
      const analysis = await this.analyzeInsights(birthChartId);
      const updatedAnalysis = { ...analysis, ...updates };

      await this.analysisRepository.updateAnalysis(birthChartId, updatedAnalysis);
      await this.cacheInsights(birthChartId, updatedAnalysis);

      return updatedAnalysis;
    } catch (error) {
      this.handleError(error as Error, 'update insights');
    }
  }

  async getBirthChartInsights(birthChartId: string): Promise<Insight[]> {
    try {
      this.logInfo('Getting birth chart insights', { birthChartId });

      const analysis = await this.analyzeInsights(birthChartId);
      return analysis.insights.filter(insight => insight.type === InsightType.BIRTH_CHART);
    } catch (error) {
      this.handleError(error as Error, 'get birth chart insights');
    }
  }

  async getInsightsByDateRange(
    birthChartId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Insight[]> {
    try {
      this.logInfo('Getting insights by date range', { birthChartId, startDate, endDate });

      const analysis = await this.analyzeInsights(birthChartId);
      return analysis.insights.filter(insight => {
        const insightDate = new Date(insight.date);
        return insightDate >= startDate && insightDate <= endDate;
      });
    } catch (error) {
      this.handleError(error as Error, 'get insights by date range');
    }
  }

  async getTransitInsights(birthChartId: string): Promise<Insight[]> {
    try {
      this.logInfo('Getting transit insights', { birthChartId });

      const analysis = await this.analyzeInsights(birthChartId);
      return analysis.insights.filter(insight => insight.type === InsightType.TRANSIT);
    } catch (error) {
      this.handleError(error as Error, 'get transit insights');
    }
  }

  async getLifeThemeInsights(birthChartId: string): Promise<Insight[]> {
    try {
      this.logInfo('Getting life theme insights', { birthChartId });

      const analysis = await this.analyzeInsights(birthChartId);
      return analysis.insights.filter(insight => insight.type === InsightType.LIFE_THEME);
    } catch (error) {
      this.handleError(error as Error, 'get life theme insights');
    }
  }

  async generateDailyInsight(birthChartId: string): Promise<string> {
    try {
      this.logInfo('Generating daily insight', { birthChartId });

      const birthChart = await this.birthChartService.getBirthChartById(birthChartId);
      if (!birthChart) {
        throw new NotFoundError(`Birth chart not found: ${birthChartId}`);
      }

      const transits = await this.transitService.analyzeTransits(birthChartId, {
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        day: new Date().getDate(),
        hour: new Date().getHours(),
        minute: new Date().getMinutes(),
        second: new Date().getSeconds()
      });

      // Get the current window's transits
      const currentWindow = transits.windows.find(window => {
        const now = new Date();
        return now >= window.startDate && now <= window.endDate;
      });

      const result = await this.aiService.generateDailyInsight(
        birthChart,
        currentWindow?.transits || [],
        new Date()
      );
      return result.insight;
    } catch (error) {
      this.handleError(error as Error, 'generate daily insight');
    }
  }

  async generateInsights(birthChartId: string): Promise<Insight[]> {
    try {
      this.logInfo('Generating insights', { birthChartId });

      const birthChart = await this.birthChartService.getBirthChartById(birthChartId);
      if (!birthChart) {
        throw new NotFoundError(`Birth chart not found: ${birthChartId}`);
      }

      const analysis: InsightAnalysis = {
        birthChartId,
        userId: birthChart.userId,
        content: '',
        type: InsightType.BIRTH_CHART,
        insights: [],
        overallSummary: '',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const insights = await this.insightGenerator.generateInsights(analysis);
      return insights;
    } catch (error) {
      this.handleError(error as Error, 'generate insights');
    }
  }

  private async updateInsight(id: string, insight: Partial<IInsight>): Promise<InsightDocument | null> {
    return this.insightRepository.updateInsight(id, insight) as Promise<InsightDocument | null>;
  }

  private async deleteInsight(id: string): Promise<boolean> {
    return this.insightRepository.deleteInsight(id);
  }

  private async createInsight(insight: Omit<IInsight, '_id' | 'createdAt' | 'updatedAt'>): Promise<InsightDocument> {
    return this.insightRepository.createInsight(insight) as Promise<InsightDocument>;
  }

  private async getAnalysis(id: string): Promise<InsightAnalysis | null> {
    return this.analysisRepository.getAnalysis(id);
  }

  private async saveAnalysis(analysis: InsightAnalysis): Promise<InsightAnalysis> {
    await this.analysisRepository.saveAnalysis(analysis);
    return analysis;
  }

  private async updateAnalysis(id: string, analysis: Partial<InsightAnalysis>): Promise<InsightAnalysis | null> {
    return this.analysisRepository.updateAnalysis(id, analysis);
  }

  private async getAnalysesByUserId(userId: string): Promise<InsightAnalysis[]> {
    return this.analysisRepository.getAnalysesByUserId(userId);
  }
} 