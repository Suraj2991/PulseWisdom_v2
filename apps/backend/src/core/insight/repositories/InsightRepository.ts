import { ICache } from '../../../infrastructure/cache/ICache';
import { Insight, InsightAnalysis, InsightType, InsightCategory, InsightSeverity, BaseInsight } from '../types/insight.types';
import { logger } from '../../../shared/logger';
import { AppError, DatabaseError, NotFoundError, ValidationError } from '../../../domain/errors';
import { InsightRepositoryInterface } from './InsightRepositoryInterface';
import { IInsight } from '../models/insight_model';
import { ObjectId } from 'mongodb';

export class InsightRepository implements InsightRepositoryInterface {
  private readonly CACHE_PREFIX = 'insight:';
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor(private readonly cache: ICache) {}

  // Analysis methods
  async getAnalysis(birthChartId: string): Promise<InsightAnalysis | null> {
    try {
      const cachedAnalysis = await this.cache.get<InsightAnalysis>(`${this.CACHE_PREFIX}${birthChartId}`);
      if (cachedAnalysis && this.isValidInsightAnalysis(cachedAnalysis)) {
        logger.debug('Retrieved analysis from cache', { birthChartId });
        return cachedAnalysis;
      }
      return null;
    } catch (error) {
      logger.error('Failed to get analysis from cache', { error, birthChartId });
      return null;
    }
  }

  async saveAnalysis(analysis: InsightAnalysis): Promise<void> {
    try {
      if (!this.isValidInsightAnalysis(analysis)) {
        throw new ValidationError('Invalid insight analysis data');
      }
      await this.cache.set(`${this.CACHE_PREFIX}${analysis.birthChartId}`, analysis, this.CACHE_TTL);
      logger.debug('Saved analysis to cache', { birthChartId: analysis.birthChartId });
    } catch (error) {
      logger.error('Failed to save analysis to cache', { error, birthChartId: analysis.birthChartId });
      throw new DatabaseError('Failed to save analysis to cache', { originalError: error });
    }
  }

  async getAnalysesByUserId(userId: string): Promise<InsightAnalysis[]> {
    try {
      const pattern = `${this.CACHE_PREFIX}*:${userId}`;
      const keys = await this.cache.keys(pattern);
      const analyses = await Promise.all(
        keys.map(key => this.cache.get<InsightAnalysis>(key))
      );
      return analyses.filter((analysis): analysis is InsightAnalysis => 
        analysis !== null && this.isValidInsightAnalysis(analysis)
      );
    } catch (error) {
      logger.error('Failed to get analyses by user ID', { error, userId });
      throw new DatabaseError('Failed to get analyses by user ID', { originalError: error });
    }
  }

  async getInsightsByCategory(birthChartId: string, category: InsightCategory): Promise<Insight[]> {
    try {
      const analysis = await this.getAnalysis(birthChartId);
      if (!analysis) {
        throw new NotFoundError('Analysis not found', { birthChartId });
      }
      return analysis.insights.filter(insight => insight.category === category);
    } catch (error) {
      logger.error('Failed to get insights by category', { error, birthChartId, category });
      if (error instanceof AppError) {
        throw error;
      }
      throw new DatabaseError('Failed to get insights by category', { originalError: error });
    }
  }

  async updateAnalysis(birthChartId: string, updates: Partial<InsightAnalysis>): Promise<InsightAnalysis> {
    try {
      const analysis = await this.getAnalysis(birthChartId);
      if (!analysis) {
        throw new NotFoundError('Analysis not found', { birthChartId });
      }

      const updatedAnalysis: InsightAnalysis = {
        ...analysis,
        ...updates,
        updatedAt: new Date()
      };

      if (!this.isValidInsightAnalysis(updatedAnalysis)) {
        throw new ValidationError('Invalid insight analysis data after update');
      }

      await this.saveAnalysis(updatedAnalysis);
      return updatedAnalysis;
    } catch (error) {
      logger.error('Failed to update analysis', { error, birthChartId });
      if (error instanceof AppError) {
        throw error;
      }
      throw new DatabaseError('Failed to update analysis', { originalError: error });
    }
  }

  // Insight methods
  async findById(id: string): Promise<IInsight | null> {
    try {
      const pattern = `${this.CACHE_PREFIX}*`;
      const keys = await this.cache.keys(pattern);
      for (const key of keys) {
        const analysis = await this.cache.get<InsightAnalysis>(key);
        if (analysis) {
          const insight = analysis.insights.find(i => i.id === id);
          if (insight && this.isValidInsight(insight)) {
            return this.convertToIInsight(insight);
          }
        }
      }
      return null;
    } catch (error) {
      logger.error('Failed to find insight by ID', { error, id });
      throw new DatabaseError('Failed to find insight by ID', { originalError: error });
    }
  }

  async findByUserId(userId: string): Promise<IInsight[]> {
    try {
      const analyses = await this.getAnalysesByUserId(userId);
      return analyses.flatMap(analysis => 
        analysis.insights
          .filter(this.isValidInsight)
          .map(this.convertToIInsight)
      );
    } catch (error) {
      logger.error('Failed to find insights by user ID', { error, userId });
      throw new DatabaseError('Failed to find insights by user ID', { originalError: error });
    }
  }

  async findByBirthChartId(birthChartId: string): Promise<IInsight[]> {
    try {
      const analysis = await this.getAnalysis(birthChartId);
      if (!analysis) {
        throw new NotFoundError('Analysis not found', { birthChartId });
      }
      return analysis.insights
        .filter(this.isValidInsight)
        .map(this.convertToIInsight);
    } catch (error) {
      logger.error('Failed to find insights by birth chart ID', { error, birthChartId });
      throw new DatabaseError('Failed to find insights by birth chart ID', { originalError: error });
    }
  }

  async findByChartIdAndType(birthChartId: string, type: InsightType): Promise<IInsight | null> {
    try {
      const insights = await this.findByBirthChartId(birthChartId);
      const insight = insights.find(i => i.type === type);
      return insight || null;
    } catch (error) {
      logger.error('Failed to find insight by chart ID and type', { error, birthChartId, type });
      throw new DatabaseError('Failed to find insight by chart ID and type', { originalError: error });
    }
  }

  async createInsight(insightData: Omit<IInsight, '_id' | 'createdAt' | 'updatedAt'>): Promise<IInsight> {
    try {
      const analysis = await this.getAnalysis(insightData.birthChartId.toString());
      if (!analysis) {
        throw new NotFoundError('Analysis not found', { birthChartId: insightData.birthChartId.toString() });
      }

      const newInsight: IInsight = {
        _id: new ObjectId(),
        ...insightData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (!this.isValidIInsight(newInsight)) {
        throw new ValidationError('Invalid insight data');
      }

      analysis.insights.push(this.convertToInsight(newInsight));
      await this.saveAnalysis(analysis);
      return newInsight;
    } catch (error) {
      logger.error('Failed to create insight', { error, insightData });
      throw new DatabaseError('Failed to create insight', { originalError: error });
    }
  }

  async updateInsight(id: string, insightData: Partial<IInsight>): Promise<IInsight | null> {
    try {
      const insight = await this.findById(id);
      if (!insight) {
        return null;
      }

      const updatedInsight: IInsight = {
        ...insight,
        ...insightData,
        updatedAt: new Date()
      };

      if (!this.isValidIInsight(updatedInsight)) {
        throw new ValidationError('Invalid insight data after update');
      }

      const analysis = await this.getAnalysis(insight.birthChartId.toString());
      if (analysis) {
        const index = analysis.insights.findIndex(i => i.id === id);
        if (index !== -1) {
          analysis.insights[index] = this.convertToInsight(updatedInsight);
          await this.saveAnalysis(analysis);
        }
      }

      return updatedInsight;
    } catch (error) {
      logger.error('Failed to update insight', { error, id, insightData });
      throw new DatabaseError('Failed to update insight', { originalError: error });
    }
  }

  async deleteInsight(id: string): Promise<boolean> {
    try {
      const insight = await this.findById(id);
      if (!insight) {
        return false;
      }

      const analysis = await this.getAnalysis(insight.birthChartId.toString());
      if (analysis) {
        analysis.insights = analysis.insights.filter(i => i.id !== id);
        await this.saveAnalysis(analysis);
      }

      return true;
    } catch (error) {
      logger.error('Failed to delete insight', { error, id });
      throw new DatabaseError('Failed to delete insight', { originalError: error });
    }
  }

  // Type guards and validators
  private isValidInsightAnalysis = (obj: unknown): obj is InsightAnalysis => {
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
  };

  private isValidInsight = (obj: unknown): obj is Insight => {
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
  };

  private isValidIInsight = (obj: unknown): obj is IInsight => {
    if (!obj || typeof obj !== 'object') return false;
    const insight = obj as Record<string, unknown>;
    return (
      insight._id instanceof ObjectId &&
      typeof insight.content === 'string' &&
      typeof insight.type === 'string' &&
      insight.userId instanceof ObjectId &&
      insight.birthChartId instanceof ObjectId &&
      Array.isArray(insight.insights) &&
      insight.timestamp instanceof Date &&
      insight.createdAt instanceof Date &&
      insight.updatedAt instanceof Date &&
      (!insight.tags || Array.isArray(insight.tags))
    );
  };

  // Type converters
  private convertToInsight = (iInsight: IInsight): Insight => {
    const baseInsight: BaseInsight = {
      id: iInsight._id.toString(),
      type: iInsight.type,
      content: iInsight.content,
      category: InsightCategory.STRENGTHS,
      severity: InsightSeverity.MEDIUM,
      createdAt: iInsight.createdAt,
      updatedAt: iInsight.updatedAt
    };

    // Create a CoreIdentityInsight by default
    return {
      ...baseInsight,
      type: InsightType.CORE_IDENTITY,
      sunSign: '',
      moonSign: '',
      ascendantSign: ''
    };
  };

  private convertToIInsight = (insight: Insight): IInsight => {
    return {
      _id: new ObjectId(insight.id),
      content: insight.content,
      type: insight.type,
      userId: new ObjectId(), // This should be provided
      birthChartId: new ObjectId(), // This should be provided
      insights: [{
        type: insight.type,
        description: insight.content,
        bodyId: 0 // Default to Sun
      }],
      timestamp: insight.createdAt,
      createdAt: insight.createdAt,
      updatedAt: insight.updatedAt,
      tags: [] // Initialize with empty array
    };
  };
} 