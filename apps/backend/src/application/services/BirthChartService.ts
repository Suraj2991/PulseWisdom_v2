import { ICache } from '../../infrastructure/cache/ICache';
import { EphemerisService } from './EphemerisService';
import { DateTime, GeoPosition, CelestialBody, Houses } from '../../domain/types/ephemeris.types';
import { HouseSystem, HOUSE_SYSTEMS } from '../../shared/constants/astrology';
import { ObjectId } from 'mongodb';
import { IBirthChart, BirthChartDocument } from '../../domain/models/BirthChart';
import { NotFoundError, ValidationError, DatabaseError, CacheError, AppError, ServiceError } from '../../domain/errors';
import { Validator } from '../../shared/validation';
import { logger } from '../../shared/logger';
import { ValidationUtils } from '../../shared/utils/validation';
import { CacheUtils } from '../../infrastructure/cache/CacheUtils';
import { BirthChartModel } from '../../infrastructure/database/models/BirthChart';

export class BirthChartService {
  private readonly CACHE_PREFIX = 'birthChart:';
  private readonly CACHE_TTL = 3600; // 1 hour in seconds

  constructor(
    private readonly cache: ICache,
    private readonly ephemerisService: EphemerisService
  ) {}

  private logInfo(message: string, context: Record<string, unknown>): void {
    logger.info(message, context);
  }

  private logDebug(message: string, context: Record<string, unknown>): void {
    logger.debug(message, context);
  }

  private logError(message: string, error: Error): void {
    logger.error(message, { error });
  }

  private handleError(error: Error, context: string): never {
    this.logError(`Failed to ${context}`, error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new ServiceError(`Failed to ${context}: ${error.message}`);
  }

  private validateLocation(location: GeoPosition): void {
    if (!location.latitude || !location.longitude) {
      throw new ValidationError('Invalid location coordinates');
    }
  }

  private validateDateTime(datetime: DateTime): void {
    if (!datetime.year || !datetime.month || !datetime.day || !datetime.hour || !datetime.minute) {
      throw new ValidationError('Invalid datetime format');
    }
  }

  private validateObjectId(id: string): void {
    if (!ObjectId.isValid(id)) {
      throw new ValidationError('Invalid ID format');
    }
  }

  private async getCachedBirthChart(id: string): Promise<BirthChartDocument | null> {
    try {
      return await this.cache.get<BirthChartDocument>(`${this.CACHE_PREFIX}${id}`);
    } catch (error) {
      this.logError('Failed to get cached birth chart', error as Error);
      return null;
    }
  }

  private async cacheBirthChart(id: string, birthChart: BirthChartDocument): Promise<void> {
    try {
      await this.cache.set(`${this.CACHE_PREFIX}${id}`, birthChart, this.CACHE_TTL);
      this.logDebug('Cached birth chart', { id });
    } catch (error) {
      this.logError('Failed to cache birth chart', error as Error);
    }
  }

  private async deleteCachedBirthChart(id: string): Promise<void> {
    try {
      await this.cache.delete(`${this.CACHE_PREFIX}${id}`);
    } catch (error) {
      this.logError('Failed to delete cached birth chart', error as Error);
    }
  }

  async getBirthChartById(id: string): Promise<BirthChartDocument | null> {
    try {
      this.logInfo('Getting birth chart by ID', { id });
      this.validateObjectId(id);
      
      const cachedChart = await this.getCachedBirthChart(id);
      if (cachedChart) {
        return cachedChart;
      }
      
      const birthChart = await BirthChartModel.findById(id);
      if (birthChart) {
        await this.cacheBirthChart(id, birthChart);
      }
      return birthChart;
    } catch (error) {
      this.handleError(error as Error, 'get birth chart by ID');
    }
  }

  async getBirthChartsByUserId(userId: string): Promise<BirthChartDocument[]> {
    try {
      this.logInfo('Getting birth charts by user ID', { userId });
      this.validateObjectId(userId);
      
      return await BirthChartModel.find({ userId });
    } catch (error) {
      this.handleError(error as Error, 'get birth charts by user ID');
    }
  }

  async calculateBirthChart(datetime: DateTime, location: GeoPosition): Promise<{
    bodies: CelestialBody[];
    houses: Houses;
    aspects: Array<{
      body1: string;
      body2: string;
      type: string;
      orb: number;
    }>;
    angles: {
      ascendant: number;
      midheaven: number;
      descendant: number;
      imumCoeli: number;
    };
  }> {
    try {
      this.logInfo('Calculating birth chart', { datetime, location });
      this.validateLocation(location);
      this.validateDateTime(datetime);
      
      return await this.ephemerisService.calculateBirthChart(datetime, location);
    } catch (error) {
      this.handleError(error as Error, 'calculate birth chart');
    }
  }

  async createBirthChart(userId: string, datetime: DateTime, location: GeoPosition): Promise<BirthChartDocument> {
    try {
      this.logInfo('Creating birth chart', { userId, datetime, location });
      this.validateLocation(location);
      this.validateObjectId(userId);
      this.validateDateTime(datetime);
      
      const birthChart = await this.ephemerisService.calculateBirthChart(datetime, location);
      const newBirthChart = await BirthChartModel.create({
        userId,
        datetime,
        location,
        houseSystem: HOUSE_SYSTEMS.PLACIDUS,
        bodies: birthChart.bodies,
        houses: birthChart.houses,
        aspects: birthChart.aspects,
        angles: {
          ascendant: birthChart.angles.ascendant,
          mc: birthChart.angles.midheaven,
          ic: birthChart.angles.imumCoeli,
          descendant: birthChart.angles.descendant
        }
      });
      
      await this.cacheBirthChart((newBirthChart as any)._id.toString(), newBirthChart);
      return newBirthChart;
    } catch (error) {
      this.handleError(error as Error, 'create birth chart');
    }
  }

  async updateBirthChart(birthChartId: string, updateData: Partial<IBirthChart>): Promise<IBirthChart> {
    try {
      this.logInfo('Updating birth chart', { birthChartId, updateData });
      this.validateObjectId(birthChartId);
      
      if (updateData.datetime) {
        this.validateDateTime(updateData.datetime as DateTime);
      }
      
      if (updateData.userId) {
        this.validateObjectId(updateData.userId);
      }

      if (updateData.location) {
        this.validateLocation(updateData.location);
      }

      const birthChart = await BirthChartModel.findById(birthChartId);
      if (!birthChart) {
        throw new NotFoundError('Birth chart not found');
      }

      const updatedBirthChart = await BirthChartModel.update(birthChartId, updateData);
      if (!updatedBirthChart) {
        throw new NotFoundError('Birth chart not found');
      }

      await this.deleteCachedBirthChart(birthChartId);
      await this.cacheBirthChart(birthChartId, updatedBirthChart);

      return updatedBirthChart;
    } catch (error) {
      this.handleError(error as Error, 'update birth chart');
    }
  }

  async deleteBirthChart(birthChartId: string): Promise<boolean> {
    try {
      this.logInfo('Deleting birth chart', { birthChartId });
      this.validateObjectId(birthChartId);

      const result = await BirthChartModel.delete(birthChartId);
      if (result) {
        await this.deleteCachedBirthChart(birthChartId);
      }
      return result;
    } catch (error) {
      this.handleError(error as Error, 'delete birth chart');
    }
  }
} 