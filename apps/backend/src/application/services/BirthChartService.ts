import { ICache } from '../infrastructure/cache/ICache';
import { EphemerisService } from './EphemerisService';
import { BirthChart, DateTime, GeoPosition, HouseSystem } from '../types/ephemeris.types';
import { IBirthChart } from '../models/BirthChart';
import { NotFoundError, ValidationError } from '../types/errors';
import { BirthChartModel } from '../models/BirthChart';
import { Types } from 'mongoose';

export class BirthChartService {
  constructor(
    private cache: ICache,
    private ephemerisService: EphemerisService
  ) {}

  private validateLocation(location: GeoPosition): void {
    if (location.latitude < -90 || location.latitude > 90) {
      throw new ValidationError('Invalid latitude. Must be between -90 and 90 degrees.');
    }
    if (location.longitude < -180 || location.longitude > 180) {
      throw new ValidationError('Invalid longitude. Must be between -180 and 180 degrees.');
    }
  }

  private validateDateTime(datetime: DateTime): void {
    // Set default timezone if not provided
    if (!datetime.timezone) {
      datetime.timezone = 'UTC';
    }
    
    // Validate month
    if (datetime.month < 1 || datetime.month > 12) {
      throw new ValidationError('Invalid month. Must be between 1 and 12.');
    }
    
    // Validate day based on month
    const daysInMonth = new Date(datetime.year, datetime.month, 0).getDate();
    if (datetime.day < 1 || datetime.day > daysInMonth) {
      throw new ValidationError(`Invalid day. Must be between 1 and ${daysInMonth} for month ${datetime.month}.`);
    }
    
    // Validate time components
    if (datetime.hour < 0 || datetime.hour > 23) {
      throw new ValidationError('Invalid hour. Must be between 0 and 23.');
    }
    if (datetime.minute < 0 || datetime.minute > 59) {
      throw new ValidationError('Invalid minute. Must be between 0 and 59.');
    }
    if (datetime.second < 0 || datetime.second > 59) {
      throw new ValidationError('Invalid second. Must be between 0 and 59.');
    }
  }

  private validateObjectId(id: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid ID format');
    }
  }

  async getBirthChartById(birthChartId: string): Promise<IBirthChart | null> {
    this.validateObjectId(birthChartId);
    const cacheKey = `birthChart:${birthChartId}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached as IBirthChart;
    }

    const birthChart = await this.ephemerisService.getBirthChartById(birthChartId);
    if (birthChart) {
      await this.cache.set(cacheKey, birthChart, 3600);
    }
    return birthChart;
  }

  async getBirthChartsByUserId(userId: string): Promise<IBirthChart[]> {
    this.validateObjectId(userId);
    const cacheKey = `birthCharts:${userId}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached as IBirthChart[];
    }

    const birthCharts = await this.ephemerisService.getBirthChartsByUserId(userId);
    await this.cache.set(cacheKey, birthCharts, 3600);
    return birthCharts;
  }

  async calculateBirthChart(datetime: DateTime, location: GeoPosition, houseSystem: HouseSystem = HouseSystem.PLACIDUS): Promise<BirthChart> {
    this.validateLocation(location);
    this.validateDateTime(datetime);
    return this.ephemerisService.calculateBirthChart(datetime, location, houseSystem);
  }

  async createBirthChart(userId: string, datetime: DateTime, location: GeoPosition): Promise<IBirthChart> {
    this.validateLocation(location);
    this.validateObjectId(userId);
    this.validateDateTime(datetime);
    const birthChart = await this.ephemerisService.calculateBirthChart(datetime, location);
    const newBirthChart = await BirthChartModel.create({
      userId,
      datetime,
      location,
      houseSystem: HouseSystem.PLACIDUS
    });
    await this.cache.set(`birthChart:${newBirthChart._id}`, newBirthChart, 3600);
    return newBirthChart;
  }

  async updateBirthChart(birthChartId: string, updateData: Partial<IBirthChart>): Promise<IBirthChart> {
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

    const birthChart = await this.ephemerisService.getBirthChartById(birthChartId);
    if (!birthChart) {
      throw new NotFoundError('Birth chart not found');
    }

    const updatedBirthChart = await BirthChartModel.findByIdAndUpdate(
      birthChartId,
      { $set: updateData },
      { new: true }
    );

    if (!updatedBirthChart) {
      throw new NotFoundError('Birth chart not found');
    }

    await this.cache.delete(`birthChart:${birthChartId}`);
    await this.cache.set(
      `birthChart:${birthChartId}`,
      updatedBirthChart,
      3600 // 1 hour
    );

    return updatedBirthChart;
  }

  async deleteBirthChart(birthChartId: string): Promise<boolean> {
    const result = await BirthChartModel.findByIdAndDelete(birthChartId);
    if (result) {
      await this.cache.delete(`birthChart:${birthChartId}`);
    }
    return !!result;
  }
} 