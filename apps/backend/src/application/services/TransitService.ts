import { ICache } from '../infrastructure/cache/ICache';
import { EphemerisService } from './EphemerisService';
import { TransitAnalysis } from '../types/transit.types';
import { DateTime } from '../types/ephemeris.types';
import { ValidationError, ConfigurationError } from '../types/errors';
import { IBirthChart } from '../models/BirthChart';

export class TransitService {
  constructor(
    private cache: ICache,
    private ephemerisService: EphemerisService
  ) {
    if (!cache) {
      throw new ConfigurationError('Cache service is required');
    }
    if (!ephemerisService) {
      throw new ConfigurationError('Ephemeris service is required');
    }
  }

  private validateDateTime(date: DateTime): void {
    if (!date || typeof date !== 'object') {
      throw new ValidationError('Invalid date format');
    }
    if (date.month < 1 || date.month > 12) {
      throw new ValidationError('Invalid month');
    }
    if (date.day < 1 || date.day > 31) {
      throw new ValidationError('Invalid day');
    }
    if (date.hour < 0 || date.hour > 23) {
      throw new ValidationError('Invalid hour');
    }
    if (date.minute < 0 || date.minute > 59) {
      throw new ValidationError('Invalid minute');
    }
    if (date.second < 0 || date.second > 59) {
      throw new ValidationError('Invalid second');
    }
  }

  private validateBirthChart(birthChart: IBirthChart): void {
    if (!birthChart || typeof birthChart !== 'object') {
      throw new ValidationError('Invalid birth chart');
    }
    if (!birthChart.bodies || !Array.isArray(birthChart.bodies) || birthChart.bodies.length === 0) {
      throw new ValidationError('Birth chart must contain at least one celestial body');
    }
  }

  private validateDateRange(startDate: DateTime, endDate: DateTime): void {
    this.validateDateTime(startDate);
    this.validateDateTime(endDate);

    const start = new Date(startDate.year, startDate.month - 1, startDate.day);
    const end = new Date(endDate.year, endDate.month - 1, endDate.day);

    if (end < start) {
      throw new ValidationError('End date must be after start date');
    }
  }

  private validateTransitData(transit: any): void {
    if (!transit || typeof transit !== 'object') {
      throw new ValidationError('Invalid transit data');
    }
    if (!transit.transitPlanet || typeof transit.transitPlanet !== 'string') {
      throw new ValidationError('Invalid transit planet');
    }
    if (!transit.natalPlanet || typeof transit.natalPlanet !== 'string') {
      throw new ValidationError('Invalid natal planet');
    }
    if (!transit.aspectType || typeof transit.aspectType !== 'string') {
      throw new ValidationError('Invalid aspect type');
    }
  }

  async analyzeTransits(birthChartId: string, date: DateTime): Promise<TransitAnalysis> {
    this.validateDateTime(date);

    const cacheKey = `transits:${birthChartId}:${date.year}-${date.month}-${date.day}`;
    try {
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return cached as TransitAnalysis;
      }
    } catch (error) {
      // Continue if cache fails
      console.warn('Cache error:', error);
    }

    const analysis = await this.ephemerisService.analyzeTransits(birthChartId, date);
    
    // Validate transit data
    if (analysis.transits) {
      analysis.transits.forEach(this.validateTransitData);
    }

    try {
      await this.cache.set(cacheKey, analysis, 3600);
    } catch (error) {
      console.warn('Cache set error:', error);
    }
    
    return analysis;
  }

  async calculateTransits(birthChart: IBirthChart, date: DateTime): Promise<TransitAnalysis> {
    this.validateDateTime(date);
    this.validateBirthChart(birthChart);

    const analysis = await this.ephemerisService.calculateTransits(birthChart as any, date);
    
    // Validate transit data
    if (analysis.transits) {
      analysis.transits.forEach(this.validateTransitData);
    }

    return analysis;
  }

  async getTransitsByDateRange(birthChartId: string, startDate: DateTime, endDate: DateTime): Promise<TransitAnalysis[]> {
    this.validateDateRange(startDate, endDate);

    const analyses: TransitAnalysis[] = [];
    const currentDate = new Date(startDate.year, startDate.month - 1, startDate.day);
    const endDateTime = new Date(endDate.year, endDate.month - 1, endDate.day);

    while (currentDate <= endDateTime) {
      const date: DateTime = {
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
        day: currentDate.getDate(),
        hour: 0,
        minute: 0,
        second: 0,
        timezone: 'UTC'
      };

      const analysis = await this.analyzeTransits(birthChartId, date);
      
      // Validate transit data
      if (analysis.transits) {
        analysis.transits.forEach(transit => {
          if (!['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'].includes(transit.transitPlanet)) {
            throw new ValidationError(`Invalid transit planet: ${transit.transitPlanet}`);
          }
        });
      }
      
      analyses.push(analysis);

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return analyses;
  }
} 