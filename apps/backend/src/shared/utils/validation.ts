import { Types } from 'mongoose';
import { DateTime, GeoPosition } from '../../domain/types/ephemeris.types';
import { IBirthChart } from '../../domain/models/BirthChart';
import { ValidationError } from '../../domain/errors';

export interface IBirthChartData {
  datetime: DateTime;
  location: GeoPosition;
}

export class ValidationUtils {
  static validateBirthChart(birthChart: IBirthChartData): void {
    if (!birthChart) {
      throw new ValidationError('Birth chart is required');
    }
    this.validateDateTime(birthChart.datetime);
    this.validateLocation(birthChart.location);
  }

  static validateDateTime(datetime: DateTime): void {
    if (!datetime) {
      throw new ValidationError('DateTime is required');
    }
    if (!datetime.year || !datetime.month || !datetime.day || !datetime.hour || !datetime.minute) {
      throw new ValidationError('Invalid DateTime: year, month, day, hour, and minute are required');
    }
    if (typeof datetime.year !== 'number' || datetime.year < 1900 || datetime.year > 2100) {
      throw new ValidationError('Invalid year');
    }
    if (typeof datetime.month !== 'number' || datetime.month < 1 || datetime.month > 12) {
      throw new ValidationError('Invalid month');
    }
    if (typeof datetime.day !== 'number' || datetime.day < 1 || datetime.day > 31) {
      throw new ValidationError('Invalid day');
    }
    if (typeof datetime.hour !== 'number' || datetime.hour < 0 || datetime.hour > 23) {
      throw new ValidationError('Invalid hour');
    }
    if (typeof datetime.minute !== 'number' || datetime.minute < 0 || datetime.minute > 59) {
      throw new ValidationError('Invalid minute');
    }
  }

  static validateLocation(location: GeoPosition): void {
    if (!location) {
      throw new ValidationError('Location is required');
    }
    if (typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
      throw new ValidationError('Invalid location: latitude and longitude must be numbers');
    }
    if (location.latitude < -90 || location.latitude > 90) {
      throw new ValidationError('Invalid latitude: must be between -90 and 90');
    }
    if (location.longitude < -180 || location.longitude > 180) {
      throw new ValidationError('Invalid longitude: must be between -180 and 180');
    }
  }

  static validateObjectId(id: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid ObjectId');
    }
  }

  static validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('Invalid email format');
    }
  }

  static validatePassword(password: string): void {
    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      throw new ValidationError('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      throw new ValidationError('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      throw new ValidationError('Password must contain at least one number');
    }
  }
}

/**
 * Validates a latitude value
 * @param latitude The latitude to validate
 * @returns boolean indicating if the latitude is valid
 */
export function validateLatitude(latitude: number): boolean {
  if (typeof latitude !== 'number' || isNaN(latitude)) return false;
  return latitude >= -90 && latitude <= 90;
}

/**
 * Validates a longitude value
 * @param longitude The longitude to validate
 * @returns boolean indicating if the longitude is valid
 */
export function validateLongitude(longitude: number): boolean {
  if (typeof longitude !== 'number' || isNaN(longitude)) return false;
  return longitude >= -180 && longitude <= 180;
} 