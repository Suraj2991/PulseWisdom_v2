import { Request, Response, NextFunction } from 'express';
import { TransitService } from '../../transit';
import { ValidationError, NotFoundError } from '../../../domain/errors';
import { BirthChartService } from '../../birthchart';
import { logger } from '../../../shared/logger';

export class TransitController {
  constructor(
    private transitService: TransitService,
    private birthChartService: BirthChartService
  ) {}

  /**
   * Get transits for a birth chart
   * @param req.params.birthChartId - The ID of the birth chart
   * @param req.query.date - Optional date in YYYY-MM-DD format for custom transit lookups
   */
  public getTransitsByChartId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { birthChartId } = req.params;
      const dateStr = req.query.date as string | undefined;

      logger.info('Getting transits for birth chart', { birthChartId, date: dateStr });

      if (!birthChartId) {
        throw new ValidationError('Birth chart ID is required');
      }

      // Validate date format if provided
      let date = new Date();
      if (dateStr) {
        const parsedDate = new Date(dateStr);
        if (isNaN(parsedDate.getTime())) {
          throw new ValidationError('Invalid date format. Please use YYYY-MM-DD');
        }
        date = parsedDate;
      }

      // Get the birth chart
      const birthChart = await this.birthChartService.getBirthChartById(birthChartId);
      if (!birthChart) {
        logger.warn('Birth chart not found', { birthChartId });
        throw new NotFoundError('Birth chart not found');
      }

      // Analyze transits for the specified date
      const analysis = await this.transitService.analyzeTransits(birthChart, date);
      
      logger.info('Successfully retrieved transits', { 
        birthChartId, 
        date: date.toISOString(),
        transitCount: analysis.windows.flatMap(w => w.transits).length 
      });
      
      res.json(analysis);
    } catch (error) {
      logger.error('Error getting transits', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        birthChartId: req.params.birthChartId,
        date: req.query.date
      });
      next(error);
    }
  };
}