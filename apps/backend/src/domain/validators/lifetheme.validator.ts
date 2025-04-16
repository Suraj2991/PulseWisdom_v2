import { ValidationError } from '../errors';
import { LifeTheme } from '../types/lifeTheme.types';
import { FocusArea } from '../types/focusArea.types';

/**
 * Validates life theme data
 * @param themeData - Life theme data to validate
 * @throws ValidationError if any validation fails
 */
export function validateLifeTheme(themeData: Partial<LifeTheme>): void {
  if (!themeData.title) {
    throw new ValidationError('Theme title is required');
  }

  const title = themeData.title.trim();
  if (title.length < 3) {
    throw new ValidationError('Theme title must be at least 3 characters long');
  }

  if (title.length > 100) {
    throw new ValidationError('Theme title must not exceed 100 characters');
  }

  if (!themeData.description) {
    throw new ValidationError('Theme description is required');
  }

  const description = themeData.description.trim();
  if (description.length < 20) {
    throw new ValidationError('Theme description must be at least 20 characters long');
  }

  if (description.length > 1000) {
    throw new ValidationError('Theme description must not exceed 1000 characters');
  }

  if (themeData.category) {
    const category = themeData.category.trim().toLowerCase();
    const validCategories = ['personal', 'professional', 'spiritual', 'relationships', 'health'];
    if (!validCategories.includes(category)) {
      throw new ValidationError('Invalid theme category');
    }
  }

  if (themeData.severity) {
    const severity = themeData.severity.trim().toLowerCase();
    const validSeverities = ['low', 'medium', 'high'];
    if (!validSeverities.includes(severity)) {
      throw new ValidationError('Invalid theme severity');
    }
  }
}

/**
 * Validates life theme update data
 * @param updateData - Life theme update data
 * @throws ValidationError if any validation fails
 */
export function validateLifeThemeUpdate(updateData: Partial<LifeTheme>): void {
  if (updateData.title) {
    const title = updateData.title.trim();
    if (title.length < 3) {
      throw new ValidationError('Theme title must be at least 3 characters long');
    }
    if (title.length > 100) {
      throw new ValidationError('Theme title must not exceed 100 characters');
    }
  }

  if (updateData.description) {
    const description = updateData.description.trim();
    if (description.length < 20) {
      throw new ValidationError('Theme description must be at least 20 characters long');
    }
    if (description.length > 1000) {
      throw new ValidationError('Theme description must not exceed 1000 characters');
    }
  }

  if (updateData.category) {
    const category = updateData.category.trim().toLowerCase();
    const validCategories = ['personal', 'professional', 'spiritual', 'relationships', 'health'];
    if (!validCategories.includes(category)) {
      throw new ValidationError('Invalid theme category');
    }
  }

  if (updateData.severity) {
    const severity = updateData.severity.trim().toLowerCase();
    const validSeverities = ['low', 'medium', 'high'];
    if (!validSeverities.includes(severity)) {
      throw new ValidationError('Invalid theme severity');
    }
  }
}

export function validateLifeThemeRequest(input: any): void {
  if (!input.birthChartId || typeof input.birthChartId !== 'string' || input.birthChartId.trim().length === 0) {
    throw new ValidationError('Valid birth chart ID is required');
  }

  if (input.focusAreas !== undefined) {
    if (!Array.isArray(input.focusAreas)) {
      throw new ValidationError('Focus areas must be an array');
    }

    input.focusAreas.forEach((area: any) => {
      if (!Object.values(FocusArea).includes(area)) {
        throw new ValidationError(`Invalid focus area: ${area}. Must be one of: ${Object.values(FocusArea).join(', ')}`);
      }
    });
  }
} 