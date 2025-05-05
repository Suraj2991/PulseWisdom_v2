import { ICache } from '../../../infrastructure/cache/ICache';
import { EphemerisService, DateTime, GeoPosition, CelestialBody, Houses, HouseSystem } from '../../ephemeris';
import { ObjectId } from 'mongodb';
import { IBirthChart, BirthChartDocument } from '../types/birthChart.types';
import { NotFoundError, ValidationError, AppError, ServiceError } from '../../../domain/errors';
import { logger } from '../../../shared/logger';
import { BirthChartModel } from '../../birthchart';

export class BirthChartService {
  private readonly CACHE_PREFIX = 'birthChart:';
  private readonly CACHE_TTL: number;
  private readonly USER_CHARTS_PREFIX = 'userCharts:';

  constructor(
    private readonly cache: ICache,
    private readonly ephemerisService: EphemerisService,
    cacheTTL = 3600 // Default 1 hour in seconds
  ) {
    this.CACHE_TTL = cacheTTL;
  }

  private logInfo(message: string, meta: Record<string, unknown>): void {
    logger.info(message, meta);
  }

  private logDebug(message: string, meta: Record<string, unknown>): void {
    logger.debug(message, meta);
  }

  private logError(message: string, meta: Record<string, unknown>): void {
    logger.error(message, meta);
  }

  private handleError(error: unknown, operation: string): never {
    if (error instanceof ValidationError) {
      this.logError(`Validation error during ${operation}`, { error });
      throw error;
    }
    if (error instanceof NotFoundError) {
      this.logError(`Resource not found during ${operation}`, { error });
      throw error;
    }
    if (error instanceof ServiceError) {
      this.logError(`Service error during ${operation}`, { error });
      throw error;
    }
    if (error instanceof Error) {
      this.logError(`Unexpected error during ${operation}`, { error });
      throw new ServiceError(`Failed to ${operation}: ${error.message}`);
    }
    this.logError(`Unknown error during ${operation}`, { error });
    throw new ServiceError(`Failed to ${operation}: An unknown error occurred`);
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
      const cachedData = await this.cache.get(`${this.CACHE_PREFIX}${id}`);
      return cachedData ? JSON.parse(cachedData as string) as BirthChartDocument : null;
    } catch (error) {
      this.logError('Failed to get cached birth chart', { error: error instanceof Error ? error : new Error('Unknown error') });
      return null;
    }
  }

  private async cacheBirthChart(id: string, birthChart: BirthChartDocument): Promise<void> {
    try {
      await this.cache.set(
        `${this.CACHE_PREFIX}${id}`,
        JSON.stringify(birthChart),
        this.CACHE_TTL
      );
      // Also cache the user's birth charts list
      await this.cacheUserBirthCharts(birthChart.userId);
      this.logDebug('Cached birth chart', { id });
    } catch (error) {
      this.logError('Failed to cache birth chart', { error: error as Error });
    }
  }

  private async cacheUserBirthCharts(userId: string): Promise<void> {
    try {
      const birthCharts = await BirthChartModel.find({ userId });
      await this.cache.set(
        `${this.USER_CHARTS_PREFIX}${userId}`,
        JSON.stringify(birthCharts),
        this.CACHE_TTL
      );
    } catch (error) {
      this.logError('Failed to cache user birth charts', { error: error as Error });
    }
  }

  private async deleteCachedBirthChart(id: string, userId: string): Promise<void> {
    try {
      await this.cache.delete(`${this.CACHE_PREFIX}${id}`);
      await this.cache.delete(`${this.USER_CHARTS_PREFIX}${userId}`);
    } catch (error) {
      this.logError('Failed to delete cached birth chart', { error: error as Error });
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
      this.handleError(error, 'get birth chart by ID');
    }
  }

  /**
   * Get all birth charts for a user
   * @param userId - The user's ID
   * @returns Array of birth charts
   * 
   * Note: Currently not cached to avoid complexity with batch caching by user.
   * If performance becomes a concern, consider implementing:
   * 1. Batch caching with TTL
   * 2. Cache invalidation on chart updates
   * 3. Pagination with cached results
   */
  async getBirthChartsByUserId(userId: string): Promise<BirthChartDocument[]> {
    try {
      this.logInfo('Getting birth charts by user ID', { userId });
      this.validateObjectId(userId);

      // Try to get from cache first
      const cachedCharts = await this.cache.get(`${this.USER_CHARTS_PREFIX}${userId}`);
      if (cachedCharts) {
        return JSON.parse(cachedCharts as string) as BirthChartDocument[];
      }

      const birthCharts = await BirthChartModel.find({ userId });
      await this.cacheUserBirthCharts(userId);
      return birthCharts;
    } catch (error) {
      this.handleError(error, 'get birth charts by user ID');
    }
  }

  async calculateBirthChart(datetime: DateTime, location: GeoPosition, houseSystem?: HouseSystem): Promise<{
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
    sun: string;
    moon: string;
    planets: Array<{
      name: string;
      sign: string;
      house: number;
      degree: number;
    }>;
    housePlacements: Array<{
      house: number;
      sign: string;
    }>;
    chiron: {
      sign: string;
      house: number;
      degree: number;
    };
    northNode: {
      sign: string;
      house: number;
      degree: number;
    };
    southNode: {
      sign: string;
      house: number;
      degree: number;
    };
  }> {
    try {
      this.logInfo('Calculating birth chart', { datetime, location });
      this.validateLocation(location);
      this.validateDateTime(datetime);
      
      return await this.ephemerisService.calculateBirthChart(datetime, location);
    } catch (error) {
      this.handleError(error, 'calculate birth chart');
    }
  }

  async createBirthChart(userId: string, datetime: DateTime, location: GeoPosition, houseSystem?: HouseSystem): Promise<BirthChartDocument> {
    try {
      this.logInfo('Creating birth chart', { userId, datetime, location });
      this.validateLocation(location);
      this.validateObjectId(userId);
      this.validateDateTime(datetime);
      
      const birthChart = await this.ephemerisService.calculateBirthChart(datetime, location);
      const now = new Date();
      const newBirthChart = await BirthChartModel.create({
        userId,
        datetime,
        location,
        houseSystem: houseSystem || 'Placidus',
        bodies: birthChart.bodies,
        aspects: birthChart.aspects,
        angles: {
          ascendant: birthChart.angles.ascendant,
          mc: birthChart.angles.midheaven,
          ic: birthChart.angles.imumCoeli,
          descendant: birthChart.angles.descendant
        },
        houses: birthChart.houses,
        sun: birthChart.sun,
        moon: birthChart.moon,
        planets: birthChart.planets,
        housePlacements: birthChart.housePlacements,
        chiron: birthChart.chiron,
        northNode: birthChart.northNode,
        southNode: birthChart.southNode,
        createdAt: now,
        updatedAt: now
      });
      
      if (newBirthChart._id) {
        await this.cacheBirthChart(newBirthChart._id.toString(), newBirthChart);
      }
      return newBirthChart;
    } catch (error) {
      this.handleError(error, 'create birth chart');
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

      await this.deleteCachedBirthChart(birthChartId, updatedBirthChart.userId);
      await this.cacheBirthChart(birthChartId, updatedBirthChart);

      return updatedBirthChart;
    } catch (error) {
      this.handleError(error, 'update birth chart');
    }
  }

  async deleteBirthChart(birthChartId: string): Promise<boolean> {
    try {
      this.logInfo('Deleting birth chart', { birthChartId });
      this.validateObjectId(birthChartId);

      const birthChart = await BirthChartModel.findById(birthChartId);
      if (!birthChart) {
        throw new NotFoundError('Birth chart not found');
      }

      const result = await BirthChartModel.delete(birthChartId);
      if (result) {
        await this.deleteCachedBirthChart(birthChartId, birthChart.userId);
      }
      return result;
    } catch (error) {
      this.handleError(error, 'delete birth chart');
    }
  }
} 