import { ValidationError } from '../domain/errors';
import { Types } from 'mongoose';
import { DateTime } from '../types/ephemeris.types';

export class Validator {
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidPassword(password: string): boolean {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  static isValidDate(date: Date): boolean {
    return date instanceof Date && !isNaN(date.getTime());
  }

  static isValidTime(time: string): boolean {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  static validateLocation(location: { latitude: number; longitude: number; placeName: string }): void {
    if (location.latitude < -90 || location.latitude > 90) {
      throw new ValidationError('Invalid latitude');
    }
    if (location.longitude < -180 || location.longitude > 180) {
      throw new ValidationError('Invalid longitude');
    }
    if (!location.placeName || location.placeName.trim().length === 0) {
      throw new ValidationError('Place name is required');
    }
  }

  static validateEmail(email: string): void {
    if (!this.isValidEmail(email)) {
      throw new ValidationError('Invalid email format');
    }
  }

  static validatePassword(password: string): void {
    if (!this.isValidPassword(password)) {
      throw new ValidationError('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character');
    }
  }

  static validateDate(date: Date): void {
    if (!this.isValidDate(date)) {
      throw new ValidationError('Invalid birth date');
    }
  }

  static validateTime(time: string): void {
    if (!this.isValidTime(time)) {
      throw new ValidationError('Invalid birth time format (HH:mm)');
    }
  }

  static validateDateTime(datetime: DateTime): void {
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

  static validateObjectId(id: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid ID format');
    }
  }

  static validateDateRange(startDate: DateTime, endDate: DateTime): void {
    this.validateDateTime(startDate);
    this.validateDateTime(endDate);

    const start = new Date(
      startDate.year,
      startDate.month - 1,
      startDate.day,
      startDate.hour,
      startDate.minute,
      startDate.second
    );
    const end = new Date(
      endDate.year,
      endDate.month - 1,
      endDate.day,
      endDate.hour,
      endDate.minute,
      endDate.second
    );

    if (start > end) {
      throw new ValidationError('Start date must be before end date');
    }
  }
} 