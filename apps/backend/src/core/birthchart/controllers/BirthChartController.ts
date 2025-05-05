import { Request, Response, NextFunction } from 'express';
import { BirthChartService } from '../services/BirthChartService';
import { ValidationError, NotFoundError } from '../../../domain/errors';
import { DateTime, GeoPosition } from '../../ephemeris';
import { CommonValidator } from '../../../shared/validation/common';
import { HOUSE_SYSTEMS } from '../../../shared/constants/astrology';
import { logger } from '../../../shared/logger';

export class BirthChartController {
  constructor(private birthChartService: BirthChartService) {}

  private handleError(error: Error | ValidationError | NotFoundError, next: NextFunction): void {
    logger.error('Birth chart operation failed', { error });
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      next(error);
      return;
    }
    next(new Error('An unexpected error occurred'));
  }

  /**
   * Create a new birth chart
   */
  public createBirthChart = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('User not authenticated');
      }

      const { datetime, location } = req.body;
      this.validateDateTime(datetime);
      this.validateLocation(location);

      const birthChart = await this.birthChartService.createBirthChart(userId, datetime, location);
      res.status(201).json(birthChart);
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error('An unexpected error occurred'), next);
    }
  };

  /**
   * Get birth chart by ID
   */
  public getBirthChartById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { birthChartId } = req.params;
      if (!birthChartId) {
        throw new ValidationError('Birth chart ID is required');
      }

      const birthChart = await this.birthChartService.getBirthChartById(birthChartId);
      if (!birthChart) {
        throw new NotFoundError('Birth chart not found');
      }
      res.json(birthChart);
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error('An unexpected error occurred'), next);
    }
  };

  /**
   * Update birth chart
   */
  public updateBirthChart = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { birthChartId } = req.params;
      const updateData = req.body;

      if (!birthChartId) {
        throw new ValidationError('Birth chart ID is required');
      }

      if (updateData.datetime) {
        this.validateDateTime(updateData.datetime);
      }

      if (updateData.location) {
        this.validateLocation(updateData.location);
      }

      if (updateData.houseSystem && !Object.values(HOUSE_SYSTEMS).includes(updateData.houseSystem)) {
        throw new ValidationError(`Invalid house system. Must be one of: ${Object.values(HOUSE_SYSTEMS).join(', ')}`);
      }

      const updatedBirthChart = await this.birthChartService.updateBirthChart(birthChartId, updateData);
      res.json(updatedBirthChart);
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error('An unexpected error occurred'), next);
    }
  };

  /**
   * Delete birth chart
   */
  public deleteBirthChart = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { birthChartId } = req.params;
      if (!birthChartId) {
        throw new ValidationError('Birth chart ID is required');
      }

      const result = await this.birthChartService.deleteBirthChart(birthChartId);
      if (!result) {
        throw new NotFoundError('Birth chart not found');
      }
      res.status(204).send();
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error('An unexpected error occurred'), next);
    }
  };

  /**
   * Get birth charts by user ID
   */
  public getBirthChartsByUserId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ValidationError('User not authenticated');
      }

      const birthCharts = await this.birthChartService.getBirthChartsByUserId(userId);
      res.json(birthCharts);
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error('An unexpected error occurred'), next);
    }
  };

  /**
   * Calculate birth chart
   */
  public calculateBirthChart = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { datetime, location, houseSystem = 'Placidus' } = req.body;

      this.validateDateTime(datetime);
      this.validateLocation(location);

      if (!Object.values(HOUSE_SYSTEMS).includes(houseSystem)) {
        throw new ValidationError(`Invalid house system. Must be one of: ${Object.values(HOUSE_SYSTEMS).join(', ')}`);
      }

      const birthChart = await this.birthChartService.calculateBirthChart(datetime, location);
      res.json(birthChart);
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error('An unexpected error occurred'), next);
    }
  };

  private validateDateTime(datetime: DateTime): void {
    CommonValidator.validateDateTime(datetime);
  }

  private validateLocation(location: GeoPosition): void {
    CommonValidator.validateLocation({
      latitude: location.latitude,
      longitude: location.longitude
    });
  }
} 