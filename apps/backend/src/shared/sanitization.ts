import { ValidationError } from '../domain/errors';

type SanitizedValue = string | number | boolean | null | SanitizedObject | SanitizedValue[];
type SanitizedObject = { [key: string]: SanitizedValue };

export class Sanitizer {
  static sanitizeString(input: string): string {
    if (!input) return '';
    return input.trim()
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/[&<>"']/g, '') // Remove special characters
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  static sanitizeEmail(email: string): string {
    if (!email) throw new ValidationError('Email is required');
    return email.toLowerCase().trim();
  }

  static sanitizeLocation(location: {
    latitude: number;
    longitude: number;
    name?: string;
  }): typeof location {
    if (!location) throw new ValidationError('Location is required');
    
    return {
      latitude: Number(location.latitude.toFixed(6)),
      longitude: Number(location.longitude.toFixed(6)),
      name: location.name ? this.sanitizeString(location.name) : undefined
    };
  }

  static sanitizeDate(date: string): string {
    if (!date) throw new ValidationError('Date is required');
    return new Date(date).toISOString().split('T')[0];
  }

  static sanitizeTime(time: string): string {
    if (!time) throw new ValidationError('Time is required');
    return time.trim().replace(/[^0-9:]/g, '');
  }

  static sanitizeTags(tags: string[]): string[] {
    if (!Array.isArray(tags)) return [];
    return tags
      .map(tag => this.sanitizeString(tag))
      .filter(tag => tag.length > 0)
      .slice(0, 10); // Limit to 10 tags
  }

  static sanitizePreferences(preferences: SanitizedObject): SanitizedObject {
    if (!preferences) return {};
    
    const sanitized: SanitizedObject = {};
    for (const [key, value] of Object.entries(preferences)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => 
          typeof item === 'string' ? this.sanitizeString(item) : item
        );
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizePreferences(value as SanitizedObject);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  static sanitizeInsightContent(content: string): string {
    if (!content) throw new ValidationError('Content is required');
    return this.sanitizeString(content)
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/[&<>"']/g, '') // Remove special characters
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  static sanitizeMetadata(metadata: SanitizedObject): SanitizedObject {
    if (!metadata) return {};
    
    const sanitized: SanitizedObject = {};
    for (const [key, value] of Object.entries(metadata)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => 
          typeof item === 'string' ? this.sanitizeString(item) : item
        );
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeMetadata(value as SanitizedObject);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
} 