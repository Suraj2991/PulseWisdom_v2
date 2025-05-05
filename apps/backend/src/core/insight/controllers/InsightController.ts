import { Request, Response, NextFunction } from 'express';
import { InsightService, InsightCategory, InsightAnalysis } from '../../insight';
import { ValidationError, NotFoundError } from '../../../domain/errors';

export class InsightController {
  constructor(private insightService: InsightService) {}

  /**
   * Analyze insights for a birth chart
   */
  public analyzeInsights = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { birthChartId } = req.params;
      const { date } = req.query;

      if (!birthChartId) {
        throw new ValidationError('Birth chart ID is required');
      }

      const analysisDate = date ? new Date(date as string) : new Date();
      const analysis = await this.insightService.analyzeInsights(birthChartId, analysisDate);
      res.status(200).json(analysis);
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ message: error.message });
        return;
      }
      if (error instanceof NotFoundError) {
        res.status(404).json({ message: error.message });
        return;
      }
      next(error);
    }
  };

  /**
   * Get insights by user ID
   */
  public getInsightsByUserId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;

      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const insights = await this.insightService.getInsightsByUserId(userId);
      res.status(200).json(insights);
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ message: error.message });
        return;
      }
      if (error instanceof NotFoundError) {
        res.status(404).json({ message: error.message });
        return;
      }
      next(error);
    }
  };

  /**
   * Get insights by category
   */
  public getInsightsByCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { birthChartId } = req.params;
      const { category } = req.query;

      if (!birthChartId) {
        throw new ValidationError('Birth chart ID is required');
      }

      if (!category || typeof category !== 'string') {
        throw new ValidationError('Category is required');
      }

      const validCategories = Object.values(InsightCategory);

      if (!validCategories.includes(category as InsightCategory)) {
        throw new ValidationError('Invalid category');
      }

      const insights = await this.insightService.getInsightsByCategory(
        birthChartId,
        category as InsightCategory
      );
      res.status(200).json(insights);
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ message: error.message });
        return;
      }
      if (error instanceof NotFoundError) {
        res.status(404).json({ message: error.message });
        return;
      }
      next(error);
    }
  };

  /**
   * Update insights
   */
  public updateInsights = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { birthChartId } = req.params;
      const updates = req.body;
      
      if (!birthChartId) {
        throw new ValidationError('Birth chart ID is required');
      }

      if (!updates || typeof updates !== 'object') {
        throw new ValidationError('Invalid update data');
      }

      // Validate required fields
      this.validateInsightUpdates(updates);

      const updated = await this.insightService.updateInsights(birthChartId, updates);
      res.status(200).json(updated);
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ message: error.message });
        return;
      }
      if (error instanceof NotFoundError) {
        res.status(404).json({ message: error.message });
        return;
      }
      next(error);
    }
  };

  /**
   * Get insights for a birth chart
   */
  public getBirthChartInsights = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { birthChartId } = req.params;

      if (!birthChartId) {
        throw new ValidationError('Birth chart ID is required');
      }

      const insights = await this.insightService.getBirthChartInsights(birthChartId);
      res.status(200).json(insights);
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ message: error.message });
        return;
      }
      if (error instanceof NotFoundError) {
        res.status(404).json({ message: error.message });
        return;
      }
      next(error);
    }
  };

  /**
   * Get insights for a specific date range
   */
  public getInsightsByDateRange = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { birthChartId } = req.params;
      const { startDate, endDate } = req.query;

      if (!birthChartId) {
        throw new ValidationError('Birth chart ID is required');
      }

      if (!startDate || !endDate) {
        throw new ValidationError('Start and end dates are required');
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new ValidationError('Invalid date format');
      }

      if (end < start) {
        throw new ValidationError('End date must be after start date');
      }

      const insights = await this.insightService.getInsightsByDateRange(
        birthChartId,
        start,
        end
      );
      res.status(200).json(insights);
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ message: error.message });
        return;
      }
      if (error instanceof NotFoundError) {
        res.status(404).json({ message: error.message });
        return;
      }
      next(error);
    }
  };

  /**
   * Get transit insights
   */
  public getTransitInsights = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { birthChartId } = req.params;

      if (!birthChartId) {
        throw new ValidationError('Birth chart ID is required');
      }

      const insights = await this.insightService.getTransitInsights(birthChartId);
      res.status(200).json(insights);
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ message: error.message });
        return;
      }
      if (error instanceof NotFoundError) {
        res.status(404).json({ message: error.message });
        return;
      }
      next(error);
    }
  };

  /**
   * Get life theme insights
   */
  public getLifeThemeInsights = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { birthChartId } = req.params;

      if (!birthChartId) {
        throw new ValidationError('Birth chart ID is required');
      }

      const insights = await this.insightService.getLifeThemeInsights(birthChartId);
      res.status(200).json(insights);
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ message: error.message });
        return;
      }
      if (error instanceof NotFoundError) {
        res.status(404).json({ message: error.message });
        return;
      }
      next(error);
    }
  };

  /**
   * Generate daily insight
   */
  public generateDailyInsight = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { birthChartId } = req.params;
      const { date } = req.query;

      if (!birthChartId) {
        throw new ValidationError('Birth chart ID is required');
      }

      const insightDate = date ? new Date(date as string) : new Date();
      const { insight } = await this.insightService.getOrGenerateDailyInsight(birthChartId, insightDate);
      res.status(200).json({ insight });
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ message: error.message });
        return;
      }
      if (error instanceof NotFoundError) {
        res.status(404).json({ message: error.message });
        return;
      }
      next(error);
    }
  };

  private validateInsightUpdates(updates: Partial<InsightAnalysis>) {
    if (updates.insights) {
      if (!Array.isArray(updates.insights)) {
        throw new ValidationError('Insights must be an array');
      }

      updates.insights.forEach(insight => {
        if (!insight.id || !insight.type || !insight.content || !insight.category || 
            !insight.severity || !insight.createdAt || !insight.updatedAt) {
          throw new ValidationError('Invalid insight data structure');
        }
      });
    }

    if (updates.overallSummary && typeof updates.overallSummary !== 'string') {
      throw new ValidationError('Overall summary must be a string');
    }
  }
} 