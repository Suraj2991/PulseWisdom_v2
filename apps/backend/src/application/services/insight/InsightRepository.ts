import { ICache } from '../../../infrastructure/cache/ICache';
import { Insight, InsightAnalysis } from '../../../domain/types/insight.types';
import { logger } from '../../../shared/logger';
import { AppError, DatabaseError, NotFoundError } from '../../../domain/errors';

export class InsightRepository {
  private readonly CACHE_PREFIX = 'insight:';
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor(private readonly cache: ICache) {}

  async getAnalysis(birthChartId: string): Promise<InsightAnalysis | null> {
    try {
      const cachedAnalysis = await this.cache.get<InsightAnalysis>(`${this.CACHE_PREFIX}${birthChartId}`);
      if (cachedAnalysis) {
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
      return analyses.filter((analysis): analysis is InsightAnalysis => analysis !== null);
    } catch (error) {
      logger.error('Failed to get analyses by user ID', { error, userId });
      throw new DatabaseError('Failed to get analyses by user ID', { originalError: error });
    }
  }

  async getInsightsByCategory(birthChartId: string, category: string): Promise<Insight[]> {
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
} 