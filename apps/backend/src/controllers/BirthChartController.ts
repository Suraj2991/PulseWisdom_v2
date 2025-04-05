import { Request, Response, NextFunction } from 'express';
import { BirthChartService } from '../services/BirthChartService';
import { ValidationError } from '../types/errors';
import { DateTime, GeoPosition, HouseSystem } from '../types/ephemeris.types';

export class BirthChartController {
  constructor(private birthChartService: BirthChartService) {}

  /**
   * Create a new birth chart
   */
  public createBirthChart = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const { datetime, location } = req.body;

      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      this.validateDateTime(datetime);
      this.validateLocation(location);

      const birthChart = await this.birthChartService.createBirthChart(userId, datetime, location);
      res.status(201).json(birthChart);
    } catch (error) {
      next(error);
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
        next(new ValidationError('Birth chart not found'));
        return;
      }
      res.json(birthChart);
    } catch (error) {
      next(error);
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

      const updatedBirthChart = await this.birthChartService.updateBirthChart(birthChartId, updateData);
      res.json(updatedBirthChart);
    } catch (error) {
      next(error);
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
        next(new ValidationError('Failed to delete birth chart'));
        return;
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get birth charts by user ID
   */
  public getBirthChartsByUserId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;

      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const birthCharts = await this.birthChartService.getBirthChartsByUserId(userId);
      res.json(birthCharts);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Calculate birth chart
   */
  public calculateBirthChart = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { datetime, location, houseSystem = HouseSystem.PLACIDUS } = req.body;

      this.validateDateTime(datetime);
      this.validateLocation(location);

      if (!Object.values(HouseSystem).includes(houseSystem)) {
        throw new ValidationError(`Invalid house system. Must be one of: ${Object.values(HouseSystem).join(', ')}`);
      }

      const birthChart = await this.birthChartService.calculateBirthChart(datetime, location, houseSystem);
      res.json(birthChart);
    } catch (error) {
      next(error);
    }
  };

  private validateDateTime(datetime: DateTime) {
    if (!datetime) {
      throw new ValidationError('Datetime is required');
    }

    const { year, month, day, hour, minute, second, timezone } = datetime;

    if (!year || !month || !day || hour === undefined || minute === undefined || second === undefined || !timezone) {
      throw new ValidationError('Invalid datetime format');
    }

    if (month < 1 || month > 12) {
      throw new ValidationError('Invalid month. Must be between 1 and 12.');
    }

    if (day < 1 || day > 31) {
      throw new ValidationError('Invalid day. Must be between 1 and 31.');
    }

    if (hour < 0 || hour > 23) {
      throw new ValidationError('Invalid hour. Must be between 0 and 23.');
    }

    if (minute < 0 || minute > 59) {
      throw new ValidationError('Invalid minute. Must be between 0 and 59.');
    }

    if (second < 0 || second > 59) {
      throw new ValidationError('Invalid second. Must be between 0 and 59.');
    }
  }

  private validateLocation(location: GeoPosition) {
    if (!location) {
      throw new ValidationError('Location is required');
    }

    const { latitude, longitude } = location;

    if (latitude === undefined || longitude === undefined) {
      throw new ValidationError('Invalid location format');
    }

    if (latitude < -90 || latitude > 90) {
      throw new ValidationError('Invalid latitude. Must be between -90 and 90 degrees.');
    }

    if (longitude < -180 || longitude > 180) {
      throw new ValidationError('Invalid longitude. Must be between -180 and 180 degrees.');
    }
  }
} 