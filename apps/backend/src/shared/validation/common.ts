import { ValidationError } from '../../domain/errors';

// Common regex patterns
export const PATTERNS = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  NAME: /^[a-zA-Z\s'-]{2,50}$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  URL: /^https?:\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?$/,
  DATE: /^\d{4}-\d{2}-\d{2}$/,
  TIME: /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/
} as const;

// Common validation messages
export const MESSAGES = {
  EMAIL: {
    REQUIRED: 'Email is required',
    INVALID: 'Invalid email format'
  },
  PASSWORD: {
    REQUIRED: 'Password is required',
    INVALID: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  },
  NAME: {
    REQUIRED: 'Name is required',
    INVALID: 'Name must be between 2 and 50 characters and contain only letters, spaces, hyphens, and apostrophes'
  },
  DATE: {
    REQUIRED: 'Date is required',
    INVALID: 'Invalid date format (YYYY-MM-DD)'
  },
  TIME: {
    REQUIRED: 'Time is required',
    INVALID: 'Invalid time format (HH:MM:SS)'
  }
} as const;

// Common validation functions
export class CommonValidator {
  /**
   * Validates an email address
   * @param email - Email to validate
   * @param required - Whether the email is required
   * @throws ValidationError if validation fails
   */
  static validateEmail(email: string | undefined, required = true): string {
    if (!email) {
      if (required) {
        throw new ValidationError(MESSAGES.EMAIL.REQUIRED);
      }
      return '';
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!PATTERNS.EMAIL.test(trimmedEmail)) {
      throw new ValidationError(MESSAGES.EMAIL.INVALID);
    }

    return trimmedEmail;
  }

  /**
   * Validates a password
   * @param password - Password to validate
   * @param required - Whether the password is required
   * @throws ValidationError if validation fails
   */
  static validatePassword(password: string | undefined, required = true): string {
    if (!password) {
      if (required) {
        throw new ValidationError(MESSAGES.PASSWORD.REQUIRED);
      }
      return '';
    }

    if (!PATTERNS.PASSWORD.test(password)) {
      throw new ValidationError(MESSAGES.PASSWORD.INVALID);
    }

    return password;
  }

  /**
   * Validates a name (first name, last name, etc.)
   * @param name - Name to validate
   * @param required - Whether the name is required
   * @throws ValidationError if validation fails
   */
  static validateName(name: string | undefined, required = true): string {
    if (!name) {
      if (required) {
        throw new ValidationError(MESSAGES.NAME.REQUIRED);
      }
      return '';
    }

    const trimmedName = name.trim();
    if (!PATTERNS.NAME.test(trimmedName)) {
      throw new ValidationError(MESSAGES.NAME.INVALID);
    }

    return trimmedName;
  }

  /**
   * Validates a date string
   * @param date - Date string to validate
   * @param required - Whether the date is required
   * @throws ValidationError if validation fails
   */
  static validateDate(date: string | undefined, required = true): Date {
    if (!date) {
      if (required) {
        throw new ValidationError(MESSAGES.DATE.REQUIRED);
      }
      return new Date();
    }

    if (!PATTERNS.DATE.test(date)) {
      throw new ValidationError(MESSAGES.DATE.INVALID);
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      throw new ValidationError(MESSAGES.DATE.INVALID);
    }

    return parsedDate;
  }

  /**
   * Validates a time string
   * @param time - Time string to validate
   * @param required - Whether the time is required
   * @throws ValidationError if validation fails
   */
  static validateTime(time: string | undefined, required = true): string {
    if (!time) {
      if (required) {
        throw new ValidationError(MESSAGES.TIME.REQUIRED);
      }
      return '';
    }

    if (!PATTERNS.TIME.test(time)) {
      throw new ValidationError(MESSAGES.TIME.INVALID);
    }

    return time;
  }

  /**
   * Validates a string length
   * @param value - String to validate
   * @param minLength - Minimum length
   * @param maxLength - Maximum length
   * @param fieldName - Name of the field for error message
   * @throws ValidationError if validation fails
   */
  static validateLength(value: string | undefined, minLength: number, maxLength: number, fieldName: string): string {
    if (!value) {
      throw new ValidationError(`${fieldName} is required`);
    }

    const trimmed = value.trim();
    if (trimmed.length < minLength) {
      throw new ValidationError(`${fieldName} must be at least ${minLength} characters long`);
    }

    if (trimmed.length > maxLength) {
      throw new ValidationError(`${fieldName} must not exceed ${maxLength} characters`);
    }

    return trimmed;
  }

  /**
   * Validates a numeric value
   * @param value - Value to validate
   * @param min - Minimum value
   * @param max - Maximum value
   * @param fieldName - Name of the field for error message
   * @throws ValidationError if validation fails
   */
  static validateNumber(value: number | undefined, min: number, max: number, fieldName: string): number {
    if (value === undefined) {
      throw new ValidationError(`${fieldName} is required`);
    }

    if (typeof value !== 'number' || isNaN(value)) {
      throw new ValidationError(`${fieldName} must be a number`);
    }

    if (value < min) {
      throw new ValidationError(`${fieldName} must be at least ${min}`);
    }

    if (value > max) {
      throw new ValidationError(`${fieldName} must not exceed ${max}`);
    }

    return value;
  }

  /**
   * Validates a datetime object
   * @param datetime - DateTime object to validate
   * @throws ValidationError if validation fails
   */
  static validateDateTime(datetime: { 
    year: number; 
    month: number; 
    day: number; 
    hour: number; 
    minute: number; 
    second?: number; 
    timezone?: string; 
  }): void {
    if (!datetime) {
      throw new ValidationError('Date and time are required');
    }

    // Validate year
    this.validateNumber(datetime.year, 1900, 2100, 'Year');

    // Validate month
    this.validateNumber(datetime.month, 1, 12, 'Month');

    // Validate day
    const daysInMonth = new Date(datetime.year, datetime.month, 0).getDate();
    this.validateNumber(datetime.day, 1, daysInMonth, 'Day');

    // Validate hour
    this.validateNumber(datetime.hour, 0, 23, 'Hour');

    // Validate minute
    this.validateNumber(datetime.minute, 0, 59, 'Minute');

    // Validate second if provided
    if (datetime.second !== undefined) {
      this.validateNumber(datetime.second, 0, 59, 'Second');
    }

    // Validate timezone if provided
    if (datetime.timezone) {
      try {
        Intl.DateTimeFormat(undefined, { timeZone: datetime.timezone });
      } catch (e) {
        throw new ValidationError('Invalid timezone');
      }
    }
  }

  /**
   * Validates a geographic location
   * @param location - Location object to validate
   * @throws ValidationError if validation fails
   */
  static validateLocation(location: { latitude: number; longitude: number }): void {
    if (!location) {
      throw new ValidationError('Location is required');
    }

    this.validateNumber(location.latitude, -90, 90, 'Latitude');
    this.validateNumber(location.longitude, -180, 180, 'Longitude');
  }
} 