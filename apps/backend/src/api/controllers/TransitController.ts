import { Request, Response, NextFunction } from 'express';
import { TransitService } from '../../application/services/TransitService';
import { ValidationError } from '../../domain/errors';
import { DateTime } from '../../domain/types/ephemeris.types';
import { BirthChartService } from '../../application/services/BirthChartService';
import { Validator } from '../../shared/validation';

export class TransitController {
  constructor(
    private transitService: TransitService,
    private birthChartService: BirthChartService
  ) {}

  /**
   * Analyze transits for a birth chart at a specific date
   */
  public analyzeTransits = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { birthChartId } = req.params;

      if (!birthChartId) {
        throw new ValidationError('Birth chart ID is required');
      }

      const { year, month, day, hour = 0, minute = 0, second = 0, timezone = 'UTC' } = req.query;

      // Validate date parameters
      if (!year || !month || !day) {
        throw new ValidationError('Date parameters are required (year, month, day)');
      }

      const date: DateTime = {
        year: Number(year),
        month: Number(month),
        day: Number(day),
        hour: Number(hour),
        minute: Number(minute),
        second: Number(second),
        timezone: String(timezone)
      };

      this.validateDateTime(date);

      const analysis = await this.transitService.analyzeTransits(birthChartId, date);
      res.json(analysis);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get transits for a date range
   */
  public getTransitsByDateRange = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { birthChartId } = req.params;

      if (!birthChartId) {
        throw new ValidationError('Birth chart ID is required');
      }

      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        throw new ValidationError('Start date and end date are required');
      }

      const start = this.parseDate(startDate as string);
      const end = this.parseDate(endDate as string);

      this.validateDateTime(start);
      this.validateDateTime(end);

      if (this.isDateBefore(end, start)) {
        throw new ValidationError('End date must be after start date');
      }

      const analyses = await this.transitService.getTransitsByDateRange(birthChartId, start, end);
      res.json(analyses);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Calculate transits for a birth chart at a specific date without saving
   */
  public calculateTransits = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { birthChartId } = req.params;

      if (!birthChartId) {
        throw new ValidationError('Birth chart ID is required');
      }

      const { date } = req.body;

      if (!date) {
        throw new ValidationError('Date is required');
      }

      this.validateDateTime(date);

      const birthChart = await this.birthChartService.getBirthChartById(birthChartId);
      if (!birthChart) {
        throw new ValidationError('Birth chart not found');
      }

      const analysis = await this.transitService.calculateTransits(birthChart, date);
      res.json(analysis);
    } catch (error) {
      next(error);
    }
  };

  private validateDateTime(date: DateTime): void {
    Validator.validateDateTime(date);
  }

  private parseDate(dateString: string): DateTime {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new ValidationError('Invalid date format');
    }

    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      hour: date.getHours(),
      minute: date.getMinutes(),
      second: date.getSeconds(),
      timezone: 'UTC'
    };
  }

  private isDateBefore(date1: DateTime, date2: DateTime): boolean {
    const d1 = new Date(date1.year, date1.month - 1, date1.day);
    const d2 = new Date(date2.year, date2.month - 1, date2.day);
    return d1 < d2;
  }
} 