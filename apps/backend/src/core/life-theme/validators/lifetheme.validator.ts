import { ValidationError } from '../../../domain/errors';
import { CommonValidator } from '../../../shared/validation/common';
import { LifeTheme, ThemeCategory, LifeArea } from '../types/lifeTheme.types';

interface LifeThemeRequest {
  birthChartId: string;
  lifeAreas?: LifeArea[];
}

/**
 * Validates life theme data
 * @param themeData - Life theme data to validate
 * @throws ValidationError if any validation fails
 */
export function validateLifeThemeData(themeData: Partial<LifeTheme>): void {
  // Validate title
  CommonValidator.validateLength(themeData.title, 3, 100, 'Title');

  // Validate description
  CommonValidator.validateLength(themeData.description, 20, 1000, 'Description');

  // Validate metadata if provided
  if (themeData.metadata) {
    // Validate category
    if (themeData.metadata.category) {
      const validCategories = Object.values(ThemeCategory);
      if (!validCategories.includes(themeData.metadata.category)) {
        throw new ValidationError('Invalid life theme category');
      }
    }

    // Validate intensity
    if (themeData.metadata.intensity) {
      const validIntensities = ['low', 'medium', 'high'] as const;
      if (!validIntensities.includes(themeData.metadata.intensity)) {
        throw new ValidationError('Invalid intensity level');
      }
    }

    // Validate life areas
    if (themeData.metadata.lifeAreas) {
      if (!Array.isArray(themeData.metadata.lifeAreas)) {
        throw new ValidationError('Life areas must be an array');
      }

      const validAreas = Object.values(LifeArea);
      for (const area of themeData.metadata.lifeAreas) {
        if (!validAreas.includes(area)) {
          throw new ValidationError(`Invalid life area: ${area}`);
        }
      }
    }
  }
}

/**
 * Validates life theme update data
 * @param updateData - Life theme update data
 * @throws ValidationError if any validation fails
 */
export function validateLifeThemeUpdate(updateData: Partial<LifeTheme>): void {
  // Validate title if provided
  if (updateData.title) {
    CommonValidator.validateLength(updateData.title, 3, 100, 'Title');
  }

  // Validate description if provided
  if (updateData.description) {
    CommonValidator.validateLength(updateData.description, 20, 1000, 'Description');
  }

  // Validate metadata if provided
  if (updateData.metadata) {
    // Validate category if provided
    if (updateData.metadata.category) {
      const validCategories = Object.values(ThemeCategory);
      if (!validCategories.includes(updateData.metadata.category)) {
        throw new ValidationError('Invalid life theme category');
      }
    }

    // Validate intensity if provided
    if (updateData.metadata.intensity) {
      const validIntensities = ['low', 'medium', 'high'] as const;
      if (!validIntensities.includes(updateData.metadata.intensity)) {
        throw new ValidationError('Invalid intensity level');
      }
    }

    // Validate life areas if provided
    if (updateData.metadata.lifeAreas) {
      if (!Array.isArray(updateData.metadata.lifeAreas)) {
        throw new ValidationError('Life areas must be an array');
      }

      const validAreas = Object.values(LifeArea);
      for (const area of updateData.metadata.lifeAreas) {
        if (!validAreas.includes(area)) {
          throw new ValidationError(`Invalid life area: ${area}`);
        }
      }
    }
  }
}

export function validateLifeThemeRequest(input: LifeThemeRequest): void {
  if (!input.birthChartId || typeof input.birthChartId !== 'string' || input.birthChartId.trim().length === 0) {
    throw new ValidationError('Valid birth chart ID is required');
  }

  if (input.lifeAreas !== undefined) {
    if (!Array.isArray(input.lifeAreas)) {
      throw new ValidationError('Life areas must be an array');
    }

    input.lifeAreas.forEach((area) => {
      if (!Object.values(LifeArea).includes(area)) {
        throw new ValidationError(`Invalid life area: ${area}. Must be one of: ${Object.values(LifeArea).join(', ')}`);
      }
    });
  }
} 