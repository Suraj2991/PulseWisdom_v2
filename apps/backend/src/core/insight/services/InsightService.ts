import { ICache } from '../../../infrastructure/cache/ICache';
import { Aspect, EphemerisService } from '../../ephemeris';
import { LifeThemeService } from '../../life-theme';
import { NotFoundError, AppError, ServiceError } from '../../../domain/errors';
import { BirthChartService, BirthChartDocument } from '../../birthchart';
import { AIService } from '../../ai';
import { logger } from '../../../shared/logger';
import { Sanitizer } from '../../../shared/sanitization';
import { 
  InsightGenerator, 
  InsightRepository, 
  InsightAnalyzer, 
  InsightCacheManager,
  BaseInsight,
  InsightCategory,
  InsightSeverity,
  IInsight,
  InsightCacheKey,
  InsightType,
  InsightAnalysis,
  Insight,
  InsightLog,
  TimingWindow,
  validateInsightUpdatePayload,
  LifeThemeInsight
} from '../../insight';
import { InsightDocument } from '../models/insight_model';
import { ObjectId } from 'mongodb';
import { Transit, TransitService, TransitWindow, TransitCacheManager } from '../../transit';
import { InsightGeneratorFactory } from '../generators/InsightGeneratorFactory';

export class InsightService {
  private readonly CACHE_PREFIX = 'insight:';
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly DAILY_INSIGHT_CACHE_TTL = 86400; // 24 hours for daily insights
  private readonly insightRepository: InsightRepository;
  private readonly analysisRepository: InsightRepository;
  private readonly insightCacheManager: InsightCacheManager;
  private readonly transitCacheManager: TransitCacheManager;

  private readonly CACHE_KEYS: Record<InsightType, InsightCacheKey> = {
    [InsightType.DAILY]: InsightCacheKey.DAILY,
    [InsightType.WEEKLY]: InsightCacheKey.WEEKLY_DIGEST,
    [InsightType.WEEKLY_DIGEST]: InsightCacheKey.WEEKLY_DIGEST,
    [InsightType.MONTHLY]: InsightCacheKey.MONTHLY_DIGEST,
    [InsightType.YEARLY]: InsightCacheKey.YEARLY_DIGEST,
    [InsightType.LIFE_THEME]: InsightCacheKey.LIFE_THEME,
    [InsightType.TRANSIT]: InsightCacheKey.TRANSIT,
    [InsightType.CORE_IDENTITY]: InsightCacheKey.CORE_IDENTITY,
    [InsightType.ASPECT]: InsightCacheKey.ASPECT,
    [InsightType.PATTERN]: InsightCacheKey.PATTERN,
    [InsightType.BIRTH_CHART]: InsightCacheKey.BIRTH_CHART,
    [InsightType.NODE_PATH]: InsightCacheKey.NODE_PATH,
    [InsightType.HOUSE_THEMES]: InsightCacheKey.HOUSE_THEMES,
    [InsightType.HOUSE_LORDS]: InsightCacheKey.HOUSE_LORDS,
    [InsightType.THEME_FORECAST]: InsightCacheKey.THEME_FORECAST
  };

  constructor(
    private readonly cache: ICache,
    private readonly ephemerisService: EphemerisService,
    private readonly lifeThemeService: LifeThemeService,
    private readonly birthChartService: BirthChartService,
    private readonly transitService: TransitService,
    private readonly aiService: AIService,
    private readonly insightGenerator: InsightGenerator,
    private readonly insightAnalyzer: InsightAnalyzer,
    insightRepository: InsightRepository,
    analysisRepository: InsightRepository
  ) {
    this.insightRepository = insightRepository;
    this.analysisRepository = analysisRepository;
    this.insightCacheManager = new InsightCacheManager(cache);
    this.transitCacheManager = new TransitCacheManager(cache);
  }

  /**
   * Gets a cache key for an insight type and birth chart ID
   * @param insightType The type of insight
   * @param birthChartId The ID of the birth chart
   * @returns A formatted cache key string
   */
  private getInsightCacheKey(insightType: InsightType, birthChartId: string): string {
    return this.insightCacheManager.getInsightCacheKey(insightType, birthChartId);
  }

  /**
   * Gets a cache key for an insight cache key type and ID
   * @param type The insight cache key type
   * @param id The ID to use in the cache key
   * @returns A formatted cache key string
   */
  private getCacheKey(type: InsightCacheKey, id: string): string {
    return this.insightCacheManager.getCacheKey(type, id);
  }

  private logInfo(message: string, data?: Record<string, unknown>): void {
    // Sanitize any insight content in the data
    const sanitizedData = data ? {
      ...data,
      content: data.content ? Sanitizer.sanitizeString(String(data.content)) : undefined,
      insight: data.insight ? Sanitizer.sanitizeString(String(data.insight)) : undefined,
      summary: data.summary ? Sanitizer.sanitizeString(String(data.summary)) : undefined
    } : undefined;
    
    logger.info(`[InsightService] ${message}`, sanitizedData);
  }

  private logError(message: string, error: Error): void {
    // Sanitize error message if it contains insight content
    const sanitizedError = {
      ...error,
      message: Sanitizer.sanitizeString(error.message)
    };
    logger.error(`[InsightService] ${message}`, { error: sanitizedError });
  }

  private handleError(message: string, error: unknown): Error {
    const sanitizedMessage = Sanitizer.sanitizeString(message);
    logger.error(sanitizedMessage, { 
      error: error instanceof Error ? Sanitizer.sanitizeString(error.message) : 'Unknown error',
      service: 'InsightService',
      timestamp: new Date().toISOString()
    });
    if (error instanceof AppError) {
      return error;
    }
    return new AppError(sanitizedMessage + ': ' + (error instanceof Error ? Sanitizer.sanitizeString(error.message) : 'Unknown error'));
  }

  private async getCachedInsightAnalysis(key: string): Promise<InsightAnalysis | null> {
    try {
      const result = await this.insightCacheManager.get<InsightAnalysis>(key);
      if (!result) return null;
      
      // Type guard to ensure the cached object has the required properties
      if (this.isValidInsightAnalysis(result)) {
        return result;
      }
      return null;
    } catch (error) {
      this.logError('Failed to get cached insight analysis', error as Error);
      return null;
    }
  }

  private async getCachedInsight(key: string): Promise<Insight | null> {
    try {
      const result = await this.insightCacheManager.get<Insight>(key);
      if (!result) return null;
      
      // Type guard to ensure the cached object has the required properties
      if (this.isValidInsight(result)) {
        return result;
      }
      return null;
    } catch (error) {
      this.logError('Failed to get cached insight', error as Error);
      return null;
    }
  }

  private async cacheInsightAnalysis(key: string, analysis: InsightAnalysis, ttl: number = this.CACHE_TTL): Promise<void> {
    try {
      await this.insightCacheManager.set(key, analysis, ttl);
    } catch (error) {
      this.logError('Failed to cache insight analysis', error as Error);
    }
  }

  private async cacheInsight(key: string, insight: Insight, ttl: number = this.CACHE_TTL): Promise<void> {
    try {
      await this.insightCacheManager.set(key, insight, ttl);
    } catch (error) {
      this.logError('Failed to cache insight', error as Error);
    }
  }

  private isValidInsightAnalysis(obj: unknown): obj is InsightAnalysis {
    if (!obj || typeof obj !== 'object') return false;
    const analysis = obj as Record<string, unknown>;
    return (
      typeof analysis.birthChartId === 'string' &&
      typeof analysis.userId === 'string' &&
      typeof analysis.content === 'string' &&
      typeof analysis.type === 'string' &&
      Array.isArray(analysis.insights) &&
      typeof analysis.overallSummary === 'string' &&
      analysis.createdAt instanceof Date &&
      analysis.updatedAt instanceof Date
    );
  }

  private isValidInsight(obj: unknown): obj is Insight {
    if (!obj || typeof obj !== 'object') return false;
    const insight = obj as Record<string, unknown>;
    return (
      typeof insight.id === 'string' &&
      typeof insight.type === 'string' &&
      typeof insight.category === 'string' &&
      typeof insight.severity === 'string' &&
      typeof insight.title === 'string' &&
      typeof insight.description === 'string' &&
      insight.date instanceof Date
    );
  }

  private async getDailyInsightFromCache(birthChartId: string): Promise<InsightAnalysis | null> {
    const cacheKey = `${birthChartId}:${new Date().toISOString()}`;
    return this.getCachedInsightAnalysis(cacheKey);
  }

  private async getWeeklyDigestFromCache(birthChartId: string): Promise<Insight | null> {
    const cacheKey = this.getInsightCacheKey(InsightType.WEEKLY, birthChartId);
    return this.getCachedInsight(cacheKey);
  }

  private async getThemeForecastFromCache(birthChartId: string): Promise<Insight | null> {
    const cacheKey = this.getInsightCacheKey(InsightType.THEME_FORECAST, birthChartId);
    return this.getCachedInsight(cacheKey);
  }

  async analyzeInsights(birthChartId: string, date: Date = new Date()): Promise<InsightAnalysis> {
    try {
      this.logInfo('Analyzing insights', { birthChartId, date });

      const cacheKey = `${birthChartId}:${date.toISOString()}`;
      const cachedInsights = await this.getCachedInsightAnalysis(cacheKey);
      if (cachedInsights) {
        return cachedInsights;
      }

      const birthChart = await this.birthChartService.getBirthChartById(birthChartId);
      if (!birthChart) {
        throw new NotFoundError(`Birth chart not found: ${birthChartId}`);
      }

      const insights = await this.generateInsights(birthChartId);
      const analysis = await this.insightAnalyzer.analyzeInsights(birthChartId, date);

      await this.cacheInsightAnalysis(cacheKey, analysis);
      return analysis;
    } catch (error) {
      throw this.handleError('analyze insights', error);
    }
  }

  private convertToInsight(iInsight: InsightDocument): Insight {
    const baseInsight: BaseInsight = {
      id: iInsight._id.toString(),  
      type: InsightType.CORE_IDENTITY,
      content: iInsight.content,
      category: InsightCategory.STRENGTHS,
      severity: InsightSeverity.MEDIUM,
      createdAt: iInsight.createdAt,
      updatedAt: iInsight.updatedAt
    };

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
        logger.error('Error getting insight by id', { 
          error: error.message,
          insightId,
          insightType: 'unknown'
        });
      } else {
        logger.error('Unknown error getting insight by id', { 
          insightId,
          insightType: 'unknown'
        });
      }
      throw error;
    }
  }

  private convertToIInsight(insight: Insight): Omit<IInsight, '_id' | 'createdAt' | 'updatedAt'> {
    // Extract common fields from the insight
    const { content, type } = insight;

    // Create the base IInsight object
    const iInsight: Omit<IInsight, '_id' | 'createdAt' | 'updatedAt'> = {
      content,
      type: type.toString(),
      userId: new ObjectId(),
      birthChartId: new ObjectId(),
      insights: [{
        type: type.toString(),
        description: content,
        bodyId: 0 // Default to Sun
      }],
      timestamp: new Date()
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
        type: insight.type as InsightType,
        insights: [this.convertToInsight(insight as InsightDocument)],
        overallSummary: '',
        createdAt: insight.createdAt,
        updatedAt: insight.updatedAt
      };
      await this.analysisRepository.saveAnalysis(analysis);
      this.logInfo('Retrieved insight from database and cached', { id });
      return this.convertToInsight(insight as InsightDocument);
    } catch (error) {
      throw this.handleError('get insight by id', error);
    }
  }

  public async getInsightsByUserId(userId: string): Promise<InsightDocument[]> {
    return this.insightRepository.findByUserId(userId) as Promise<InsightDocument[]>;
  }

  async getInsightsByCategory(birthChartId: string, category: InsightCategory): Promise<Insight[]> {
    try {
      this.logInfo('Getting insights by category', { birthChartId, category });

      const analysis = await this.analyzeInsights(birthChartId);
      return analysis.insights.filter(insight => insight.category === category);
    } catch (error) {
      throw this.handleError('get insights by category', error);
    }
  }

  async updateInsights(birthChartId: string, updates: Partial<InsightAnalysis>): Promise<InsightAnalysis> {
    try {
      this.logInfo('Updating insights', { birthChartId, updates });

      validateInsightUpdatePayload(updates);
      const analysis = await this.analyzeInsights(birthChartId);
      const updatedAnalysis = { ...analysis, ...updates };

      await this.analysisRepository.updateAnalysis(birthChartId, updatedAnalysis);
      await this.cacheInsightAnalysis(this.getInsightCacheKey(InsightType.DAILY, birthChartId), updatedAnalysis);

      return updatedAnalysis;
    } catch (error) {
      throw this.handleError('update insights', error);
    }
  }

  async getBirthChartInsights(birthChartId: string): Promise<Insight[]> {
    try {
      this.logInfo('Getting birth chart insights', { birthChartId });

      const analysis = await this.analyzeInsights(birthChartId);
      return analysis.insights.filter(insight => insight.type === InsightType.BIRTH_CHART);
    } catch (error) {
      throw this.handleError('get birth chart insights', error);
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
        const insightDate = insight.createdAt;
        return insightDate >= startDate && insightDate <= endDate;
      });
    } catch (error) {
      throw this.handleError('get insights by date range', error);
    }
  }

  async getTransitInsights(birthChartId: string): Promise<Insight[]> {
    try {
      this.logInfo('Getting transit insights', { birthChartId });

      const analysis = await this.analyzeInsights(birthChartId);
      return analysis.insights.filter(insight => insight.type === InsightType.TRANSIT);
    } catch (error) {
      throw this.handleError('get transit insights', error);
    }
  }

  async getLifeThemeInsights(birthChartId: string): Promise<LifeThemeInsight[]> {
    try {
      this.logInfo('Getting life theme insights', { birthChartId });

      const analysis = await this.analyzeInsights(birthChartId);
      return analysis.insights.filter(insight => insight.type === InsightType.LIFE_THEME) as LifeThemeInsight[];
    } catch (error) {
      throw this.handleError('get life theme insights', error);
    }
  }

  async getOrGenerateDailyInsight(birthChartId: string, date: Date = new Date()): Promise<{ insight: string; insightLog: InsightLog }> {
    try {
      this.logInfo('Generating daily insight', { birthChartId, date });

      const cacheKey = `${birthChartId}:${date.toISOString()}`;
      let cachedInsight;
      try {
        cachedInsight = await this.getCachedInsightAnalysis(cacheKey);
      } catch (cacheError) {
        throw this.logError('Cache read failed, proceeding without cache', cacheError as Error);
      }

      if (cachedInsight) {
        return {
          insight: cachedInsight.content,
          insightLog: {
            id: new ObjectId().toString(),
            userId: cachedInsight.userId.toString(),
            insightType: InsightType.DAILY,
            content: cachedInsight.content,
            generatedAt: new Date(),
            metadata: {
              date,
              birthChartId
            }
          }
        };
      }

      const birthChart = await this.birthChartService.getBirthChartById(birthChartId);
      if (!birthChart) {
        throw new NotFoundError(`Birth chart not found: ${birthChartId}`);
      }

      const transitAnalysis = await this.transitService.analyzeTransits(birthChart);
      const transits = transitAnalysis.windows.flatMap((window: TransitWindow) => window.transits);
      const { insight, insightLog } = await this.aiService.getOrGenerateDailyInsight(
        birthChart,
        transits,
        date
      );

      const analysis: InsightAnalysis = {
        birthChartId,
        userId: birthChart.userId,
        content: insight,
        type: InsightType.DAILY,
        insights: [],
        overallSummary: insight,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.cacheInsightAnalysis(cacheKey, analysis);

      return { insight, insightLog };
    } catch (error) {
      throw this.handleError('generate daily insight', error);
    }
  }

  async generateAndStoreDailyInsight(birthChart: BirthChartDocument, transits: Transit[], date: Date): Promise<Insight> {
    try {
      this.logInfo('Generating and storing daily insight', { birthChartId: birthChart._id, date });

      // Generate insight using AI service
      const { insight, insightLog } = await this.aiService.getOrGenerateDailyInsight(birthChart, transits, date);

      // Use the factory to get the daily insight generator
      const generator = InsightGeneratorFactory.getGenerator(InsightType.DAILY);
      const insights = await generator.generate({
        birthChartId: birthChart._id.toString(),
        userId: birthChart.userId.toString(),
        type: InsightType.DAILY,
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

      // Store in database
      const storedInsight = await this.insightRepository.createInsight(this.convertToIInsight(insightObj) as InsightDocument);

      // Cache the insight
      const cacheKey = this.getInsightCacheKey(InsightType.DAILY, birthChart._id.toString());
      await this.cacheInsight(cacheKey, insightObj);

      this.logInfo('Successfully generated and stored daily insight', { 
        birthChartId: birthChart._id,
        insightId: (storedInsight as InsightDocument)._id
      });

      return insightObj;
    } catch (error) {
      throw this.handleError('generate and store daily insight', error);
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
        birthChartId: birthChart._id.toString(),
        userId: birthChart.userId.toString(),
        content: 'Birth chart analysis',
        type: InsightType.BIRTH_CHART,
        insights: [],
        overallSummary: 'Birth chart analysis completed',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Use the factory to get all generators and generate insights
      const generators = InsightGeneratorFactory.getAllGenerators();
      const insights: Insight[] = [];

      for (const generator of generators) {
        const generatorInsights = await generator.generate(analysis);
        insights.push(...generatorInsights);
      }

      // Cache the generated insights
      const cacheKey = this.getInsightCacheKey(InsightType.BIRTH_CHART, birthChartId);
      await this.cacheInsightAnalysis(cacheKey, {
        ...analysis,
        insights
      });

      return insights;
    } catch (error) {
      throw this.handleError('generate insights', error);
    }
  }

  private async updateInsight(id: string, insight: Partial<IInsight>): Promise<InsightDocument | null> {
    return this.insightRepository.updateInsight(id, insight as InsightDocument) as Promise<InsightDocument | null>;
  }

  private async deleteInsight(id: string): Promise<boolean> {
    return this.insightRepository.deleteInsight(id);
  }

  private async createInsight(insight: Omit<IInsight, '_id' | 'createdAt' | 'updatedAt'>): Promise<InsightDocument> {
    return this.insightRepository.createInsight(insight as InsightDocument) as Promise<InsightDocument>;
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

  async generateAndStoreLifeThemeInsights(birthChartId: string): Promise<Insight[]> {
    try {
      this.logInfo('Generating life theme insights', { birthChartId });

      // Get birth chart and life themes
      const birthChart = await this.birthChartService.getBirthChartById(birthChartId);
      if (!birthChart) {
        throw new NotFoundError(`Birth chart not found: ${birthChartId}`);
      }

      // Get life themes for the birth chart
      const lifeThemes = await this.lifeThemeService.analyzeLifeThemes({ birthChartId });

      // Generate insights for each theme using AI service
      const insights = await Promise.all(
        lifeThemes.map(async theme => {
          const { insight } = await this.aiService.generateLifeThemeInsight(theme);
          return {
            id: new ObjectId().toString(),
            type: InsightType.LIFE_THEME,
            category: InsightCategory.PERSONAL_GROWTH,
            severity: InsightSeverity.MEDIUM,
            title: theme.title,
            description: insight,
            date: new Date(),
            aspects: theme.supportingAspects.map(aspect => ({
              body1: aspect.body1,
              body2: aspect.body2,
              type: aspect.type,
              orb: aspect.orb,
              isApplying: true
            })) as Aspect[],
            houses: [],
            supportingFactors: [],
            challenges: [],
            recommendations: [],
            themeId: theme.id
          } as unknown as LifeThemeInsight;
        })
      );

      // Store insights in cache
      const cacheKey = `${birthChartId}:${new Date().toISOString()}`;
      const analysis: InsightAnalysis = {
        birthChartId,
        userId: birthChart.userId.toString(),
        content: 'Life theme insights',
        type: InsightType.LIFE_THEME,
        insights,
        overallSummary: '',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await this.cacheInsightAnalysis(cacheKey, analysis);

      this.logInfo('Successfully generated and stored life theme insights', { 
        birthChartId,
        themeCount: lifeThemes.length,
        insightCount: insights.length
      });

      return insights;
    } catch (error) {
      throw this.handleError('generate and store life theme insights', error)
    }
  }

  async analyzeSmartTimingWindows(birthChartId: string, date: Date): Promise<TimingWindow[]> {
    try {
      this.logInfo('Analyzing smart timing windows', { birthChartId, date });

      // Get birth chart
      const birthChart = await this.birthChartService.getBirthChartById(birthChartId);
      if (!birthChart) {
        throw new NotFoundError(`Birth chart not found: ${birthChartId}`);
      }

      // Calculate current transits
      const transitAnalysis = await this.transitService.analyzeTransits(birthChart);
      const transits = transitAnalysis.windows.flatMap((window: TransitWindow) => window.transits);

      // Generate timing windows using AI service
      const timingWindows = await this.aiService.analyzeSmartTimingWindows(
        birthChart,
        transits,
        date
      );

      this.logInfo('Successfully generated timing windows', { 
        birthChartId,
        date: date.toISOString(),
        windowCount: timingWindows.length
      });

      return timingWindows;
    } catch (error) {
      throw this.handleError('analyze smart timing windows', error);
    }
  }

  async generateThemeForecast(birthChart: BirthChartDocument, userId: string): Promise<Insight> {
    try {
      this.logInfo('Generating theme forecast', { birthChartId: birthChart._id });

      // Get life themes and transits in parallel
      const [lifeThemes, transitAnalysis] = await Promise.all([
        this.lifeThemeService.analyzeLifeThemes({ birthChartId: birthChart._id.toString() }),
        this.transitService.analyzeTransits(birthChart)
      ]);

      // Extract transits from windows
      const transits = transitAnalysis.windows.flatMap((window: TransitWindow) => window.transits);

      // Generate theme forecast using AI service
      const { insight } = await this.aiService.generateThemeForecast(
        birthChart,
        lifeThemes,
        transits
      );

      // Create insight document
      const insightDoc: Omit<IInsight, '_id' | 'createdAt' | 'updatedAt'> = {
        content: insight,
        type: InsightType.THEME_FORECAST.toString(),
        userId: new ObjectId(userId),
        birthChartId: birthChart._id,
        insights: [{
          type: InsightType.THEME_FORECAST.toString(),
          description: insight,
          bodyId: 0 // Default to Sun
        }],
        timestamp: new Date(),
        relevance: 1.0
      };

      // Store in database
      const storedInsight = await this.insightRepository.createInsight(insightDoc as InsightDocument);

      // Cache the insight
      const cacheKey = this.getInsightCacheKey(InsightType.THEME_FORECAST, birthChart._id.toString());
      await this.cacheInsight(cacheKey, this.convertToInsight(storedInsight as InsightDocument));

      this.logInfo('Successfully generated and stored theme forecast', { 
        birthChartId: birthChart._id,
        insightId: (storedInsight as InsightDocument)._id
      });

      return this.convertToInsight(storedInsight as InsightDocument);
    } catch (error) {
      throw this.handleError('generate theme forecast', error);
    }
  }

  async getInsightsByBirthChartId(birthChartId: string): Promise<Insight[]> {
    try {
      this.logInfo('Getting insights by birth chart ID', { birthChartId });

      // Try to get from cache first
      const cacheKey = `${birthChartId}:${new Date().toISOString()}`;
      const cachedAnalysis = await this.getCachedInsightAnalysis(cacheKey);
      if (cachedAnalysis) {
        this.logInfo('Retrieved insights from cache', { birthChartId });
        return cachedAnalysis.insights;
      }

      // Try to get from database
      const insights = await this.insightRepository.findByBirthChartId(birthChartId);
      if (insights.length > 0) {
        // Cache the results
        const analysis: InsightAnalysis = {
          birthChartId: birthChartId,
          userId: insights[0].userId.toString(),
          content: 'Birth chart insights',
          type: InsightType.BIRTH_CHART,
          insights: insights.map(insight => this.convertToInsight(insight as InsightDocument)),
          overallSummary: '',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await this.cacheInsightAnalysis(cacheKey, analysis);
        this.logInfo('Retrieved insights from database and cached', { birthChartId });
        return analysis.insights;
      }

      // If no insights found, generate new ones
      this.logInfo('No insights found, generating new ones', { birthChartId });
      
      // Get birth chart to get userId
      const birthChart = await this.birthChartService.getBirthChartById(birthChartId);
      if (!birthChart) {
        throw new NotFoundError(`Birth chart not found: ${birthChartId}`);
      }
      
      const generatedInsights = await this.generateInsights(birthChartId);
      
      // Store and cache the generated insights
      const analysis: InsightAnalysis = {
        birthChartId: birthChart._id.toString(),
        userId: birthChart.userId.toString(),
        content: 'Generated birth chart insights',
        type: InsightType.BIRTH_CHART,
        insights: generatedInsights,
        overallSummary: '',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await this.cacheInsightAnalysis(cacheKey, analysis);
      
      // Store in database
      await Promise.all(
        generatedInsights.map(insight => 
          this.insightRepository.createInsight(this.convertToIInsight(insight) as InsightDocument)
        )
      );

      this.logInfo('Successfully generated and stored new insights', { 
        birthChartId,
        insightCount: generatedInsights.length
      });

      return generatedInsights;
    } catch (error) {
      throw this.handleError('get insights by birth chart ID', error);
    }
  }

  async generateWeeklyDigest(birthChart: BirthChartDocument, userId: string): Promise<Insight> {
    try {
      this.logInfo('Generating weekly digest', { birthChartId: birthChart._id });

      // Get transits for the week
      const transitAnalysis = await this.transitService.analyzeTransits(birthChart);
      const transits = transitAnalysis.windows.flatMap((window: TransitWindow) => window.transits);

      // Generate insight using AI service
      const { insight } = await this.aiService.generateWeeklyDigest(
        birthChart,
        transits,
        new Date(),
        [] // No transit insights needed for MVP
      );

      // Create insight document
      const insightDoc: Omit<IInsight, '_id' | 'createdAt' | 'updatedAt'> = {
        content: insight,
        type: InsightType.WEEKLY.toString(),
        userId: new ObjectId(userId),
        birthChartId: birthChart._id,
        insights: [{
          type: InsightType.WEEKLY.toString(),
          description: insight,
          bodyId: 0 // Default to Sun
        }],
        timestamp: new Date(),
        relevance: 1.0
      };

      // Store in database
      const storedInsight = await this.insightRepository.createInsight(insightDoc as InsightDocument);

      // Cache the insight
      const cacheKey = this.getInsightCacheKey(InsightType.WEEKLY, birthChart._id.toString());
      await this.cacheInsight(cacheKey, this.convertToInsight(storedInsight as InsightDocument));

      this.logInfo('Successfully generated and stored weekly digest', { 
        birthChartId: birthChart._id,
        insightId: (storedInsight as InsightDocument)._id
      });

      return this.convertToInsight(storedInsight as InsightDocument);
    } catch (error) {
      throw this.handleError('generate weekly digest', error);
    }
  }

  async getDailyInsightByBirthChartId(birthChartId: string): Promise<Insight> {
    try {
      this.logInfo('Getting daily insight by birth chart ID', { birthChartId });

      // Try to get from cache first
      const cacheKey = this.getInsightCacheKey(InsightType.DAILY, birthChartId);
      const cachedInsight = await this.getCachedInsightAnalysis(cacheKey);
      if (cachedInsight) {
        this.logInfo('Retrieved daily insight from cache', { birthChartId });
        return cachedInsight.insights[0];
      }

      // Try to get from database
      const birthChart = await this.birthChartService.getBirthChartById(birthChartId);
      if (!birthChart) {
        throw new NotFoundError(`Birth chart not found: ${birthChartId}`);
      }

      const insights = await this.insightRepository.findByBirthChartId(birthChartId);
      const dailyInsight = insights.find(i => i.type === InsightType.DAILY.toString());
      
      if (dailyInsight) {
        const insight = this.convertToInsight(dailyInsight as InsightDocument);
        // Cache the result
        await this.cacheInsight(cacheKey, insight);
        this.logInfo('Retrieved daily insight from database and cached', { birthChartId });
        return insight;
      }

      // If no insight found, generate new one
      this.logInfo('No daily insight found, generating new one', { birthChartId });
      
      // Get transits for the day
      const transitAnalysis = await this.transitService.analyzeTransits(birthChart);
      const transits = transitAnalysis.windows.flatMap((window: TransitWindow) => window.transits);
      
      // Generate and store new insight
      const insight = await this.generateAndStoreDailyInsight(birthChart, transits, new Date());
      
      this.logInfo('Successfully generated and stored new daily insight', { 
        birthChartId,
        insightId: insight.id
      });

      return insight;
    } catch (error) {
      throw this.handleError('get daily insight by birth chart ID', error);
    }
  }

  async getWeeklyDigestByBirthChartId(birthChartId: string): Promise<Insight> {
    try {
      this.logInfo('Getting weekly digest by birth chart ID', { birthChartId });

      // Try to get from cache first
      const cacheKey = this.getInsightCacheKey(InsightType.WEEKLY, birthChartId);
      const cachedInsight = await this.getCachedInsight(cacheKey);
      if (cachedInsight) {
        this.logInfo('Retrieved weekly digest from cache', { birthChartId });
        return cachedInsight;
      }

      // Try to get from database
      const birthChart = await this.birthChartService.getBirthChartById(birthChartId);
      if (!birthChart) {
        throw new NotFoundError(`Birth chart not found: ${birthChartId}`);
      }

      const insights = await this.insightRepository.findByBirthChartId(birthChartId);
      const weeklyDigest = insights.find(i => i.type === InsightType.WEEKLY.toString());
      
      if (weeklyDigest) {
        const insight = this.convertToInsight(weeklyDigest as InsightDocument);
        // Cache the result
        await this.cacheInsight(cacheKey, insight);
        this.logInfo('Retrieved weekly digest from database and cached', { birthChartId });
        return insight;
      }

      // If no insight found, generate new one
      this.logInfo('No weekly digest found, generating new one', { birthChartId });
      
      // Generate and store new weekly digest
      const insight = await this.generateWeeklyDigest(birthChart, birthChart.userId.toString());
      
      this.logInfo('Successfully generated and stored new weekly digest', { 
        birthChartId,
        insightId: insight.id
      });

      return insight;
    } catch (error) {
      throw this.handleError('get weekly digest by birth chart ID', error);
    }
  }

  async getThemeForecastByBirthChartId(birthChartId: string): Promise<Insight> {
    try {
      this.logInfo('Getting theme forecast by birth chart ID', { birthChartId });

      // Try to get from cache first
      const cacheKey = this.getInsightCacheKey(InsightType.THEME_FORECAST, birthChartId);
      const cachedInsight = await this.getCachedInsight(cacheKey);
      if (cachedInsight) {
        this.logInfo('Retrieved theme forecast from cache', { birthChartId });
        return cachedInsight;
      }

      // Try to get from database
      const birthChart = await this.birthChartService.getBirthChartById(birthChartId);
      if (!birthChart) {
        throw new NotFoundError(`Birth chart not found: ${birthChartId}`);
      }

      const insights = await this.insightRepository.findByBirthChartId(birthChartId);
      const themeForecast = insights.find(i => i.type === InsightType.THEME_FORECAST.toString());
      
      if (themeForecast) {
        const insight = this.convertToInsight(themeForecast as InsightDocument);
        // Cache the result
        await this.cacheInsight(cacheKey, insight);
        this.logInfo('Retrieved theme forecast from database and cached', { birthChartId });
        return insight;
      }

      // If no insight found, generate new one
      this.logInfo('No theme forecast found, generating new one', { birthChartId });
      
      // Generate and store new theme forecast
      const insight = await this.generateThemeForecast(birthChart, birthChart.userId.toString());
      
      this.logInfo('Successfully generated and stored new theme forecast', { 
        birthChartId,
        insightId: insight.id
      });

      return insight;
    } catch (error) {
      throw this.handleError('get theme forecast by birth chart ID', error);
    }
  }

  /**
   * Clears all cached insights for a birth chart
   * @param birthChartId The ID of the birth chart
   */
  private async clearCachedInsightsForChart(birthChartId: string): Promise<void> {
    await this.insightCacheManager.clearAllForChart(birthChartId);
  }

  async generateDailyInsight(birthChartId: string, date: Date): Promise<InsightAnalysis> {
    try {
      const cacheKey = `${birthChartId}:${date.toISOString()}`;
      const cachedInsights = await this.getCachedInsightAnalysis(cacheKey);
      if (cachedInsights) {
        return cachedInsights;
      }

      const analysis = await this.insightAnalyzer.analyzeInsights(birthChartId, date);
      await this.cacheInsightAnalysis(cacheKey, analysis);
      return analysis;
    } catch (error) {
      this.logError('Failed to generate daily insight', error as Error);
      throw error;
    }
  }

  async getDailyInsight(birthChartId: string): Promise<Insight> {
    try {
      // Try to get from cache first
      const cacheKey = this.getInsightCacheKey(InsightType.DAILY, birthChartId);
      const cachedInsight = await this.getCachedInsight(cacheKey);
      if (cachedInsight) {
        this.logInfo('Retrieved daily insight from cache', { birthChartId });
        return cachedInsight;
      }

      // If not in cache, try to get from database
      const dailyInsight = await this.insightRepository.findByChartIdAndType(birthChartId, InsightType.DAILY);
      if (dailyInsight) {
        const insight = this.convertToInsight(dailyInsight as InsightDocument);
        // Cache the result
        await this.cacheInsight(cacheKey, insight, this.DAILY_INSIGHT_CACHE_TTL);
        this.logInfo('Retrieved daily insight from database and cached', { birthChartId });
        return insight;
      }

      throw new Error('Daily insight not found');
    } catch (error) {
      this.logError('Error getting daily insight', error as Error);
      throw error;
    }
  }

  async getWeeklyDigest(birthChartId: string): Promise<Insight> {
    try {
      // Try to get from cache first
      const cacheKey = this.getInsightCacheKey(InsightType.WEEKLY, birthChartId);
      const cachedInsight = await this.getCachedInsight(cacheKey);
      if (cachedInsight) {
        this.logInfo('Retrieved weekly digest from cache', { birthChartId });
        return cachedInsight;
      }

      // If not in cache, try to get from database
      const weeklyDigest = await this.insightRepository.findByChartIdAndType(birthChartId, InsightType.WEEKLY);
      if (weeklyDigest) {
        const insight = this.convertToInsight(weeklyDigest as InsightDocument);
        // Cache the result
        await this.cacheInsight(cacheKey, insight);
        this.logInfo('Retrieved weekly digest from database and cached', { birthChartId });
        return insight;
      }

      throw new Error('Weekly digest not found');
    } catch (error) {
      this.logError('Error getting weekly digest', error as Error);
      throw error;
    }
  }

  async getThemeForecast(birthChartId: string): Promise<Insight> {
    try {
      // Try to get from cache first
      const cacheKey = this.getInsightCacheKey(InsightType.THEME_FORECAST, birthChartId);
      const cachedInsight = await this.getCachedInsight(cacheKey);
      if (cachedInsight) {
        this.logInfo('Retrieved theme forecast from cache', { birthChartId });
        return cachedInsight;
      }

      // If not in cache, try to get from database
      const themeForecast = await this.insightRepository.findByChartIdAndType(birthChartId, InsightType.THEME_FORECAST);
      if (themeForecast) {
        const insight = this.convertToInsight(themeForecast as InsightDocument);
        // Cache the result
        await this.cacheInsight(cacheKey, insight);
        this.logInfo('Retrieved theme forecast from database and cached', { birthChartId });
        return insight;
      }

      throw new Error('Theme forecast not found');
    } catch (error) {
      this.logError('Error getting theme forecast', error as Error);
      throw error;
    }
  }

  async getInsightsByType(
    birthChartId: string,
    insightType: InsightType
  ): Promise<Insight[]> {
    try {
      this.logInfo('Getting insights by type', { birthChartId, insightType });

      const analysis = await this.analyzeInsights(birthChartId);
      return analysis.insights.filter(insight => insight.type === insightType);
    } catch (error) {
      throw this.handleError('get insights by type', error);
    }
  }
} 