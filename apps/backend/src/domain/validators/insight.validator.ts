import { ValidationError } from '../errors';
import { IInsight } from '../models/Insight';
import { InsightAnalysis } from '../types/insight.types';

/**
 * Validates insight data
 * @param insightData - Insight data to validate
 * @throws ValidationError if any validation fails
 */
export function validateInsight(insightData: Partial<IInsight>): void {
  if (!insightData.content) {
    throw new ValidationError('Insight content is required');
  }

  const content = insightData.content.trim();
  if (content.length < 20) {
    throw new ValidationError('Insight content must be at least 20 characters long');
  }

  if (content.length > 2000) {
    throw new ValidationError('Insight content must not exceed 2000 characters');
  }

  if (!insightData.type) {
    throw new ValidationError('Insight type is required');
  }

  const type = insightData.type.trim().toLowerCase();
  const validTypes = ['daily', 'weekly', 'monthly', 'yearly', 'life'];
  if (!validTypes.includes(type)) {
    throw new ValidationError('Invalid insight type');
  }

  if (insightData.relevance) {
    if (typeof insightData.relevance !== 'number' || insightData.relevance < 0 || insightData.relevance > 1) {
      throw new ValidationError('Relevance must be a number between 0 and 1');
    }
  }

  if (insightData.tags) {
    if (!Array.isArray(insightData.tags)) {
      throw new ValidationError('Tags must be an array');
    }
    if (insightData.tags.length > 10) {
      throw new ValidationError('Maximum 10 tags allowed');
    }
    insightData.tags.forEach(tag => {
      if (typeof tag !== 'string' || tag.trim().length === 0) {
        throw new ValidationError('Invalid tag format');
      }
    });
  }
}

/**
 * Validates insight update data
 * @param updateData - Insight update data
 * @throws ValidationError if any validation fails
 */
export function validateInsightUpdate(updateData: Partial<IInsight>): void {
  if (updateData.content) {
    const content = updateData.content.trim();
    if (content.length < 20) {
      throw new ValidationError('Insight content must be at least 20 characters long');
    }
    if (content.length > 2000) {
      throw new ValidationError('Insight content must not exceed 2000 characters');
    }
  }

  if (updateData.type) {
    const type = updateData.type.trim().toLowerCase();
    const validTypes = ['daily', 'weekly', 'monthly', 'yearly', 'life'];
    if (!validTypes.includes(type)) {
      throw new ValidationError('Invalid insight type');
    }
  }

  if (updateData.relevance) {
    if (typeof updateData.relevance !== 'number' || updateData.relevance < 0 || updateData.relevance > 1) {
      throw new ValidationError('Relevance must be a number between 0 and 1');
    }
  }

  if (updateData.tags) {
    if (!Array.isArray(updateData.tags)) {
      throw new ValidationError('Tags must be an array');
    }
    if (updateData.tags.length > 10) {
      throw new ValidationError('Maximum 10 tags allowed');
    }
    updateData.tags.forEach(tag => {
      if (typeof tag !== 'string' || tag.trim().length === 0) {
        throw new ValidationError('Invalid tag format');
      }
    });
  }
}

export function validateInsightRequest(input: { birthChartId: string }): void {
  if (!input.birthChartId || typeof input.birthChartId !== 'string' || input.birthChartId.trim().length === 0) {
    throw new ValidationError('Valid birth chart ID is required');
  }
}

export function validateInsightUpdatePayload(payload: Partial<InsightAnalysis>): void {
  // Check for unsupported fields
  const allowedFields = ['content', 'type', 'relevance', 'tags', 'status'];
  const providedFields = Object.keys(payload);
  
  const unsupportedFields = providedFields.filter(field => !allowedFields.includes(field));
  if (unsupportedFields.length > 0) {
    throw new ValidationError(`Unsupported fields in update payload: ${unsupportedFields.join(', ')}`);
  }

  // Validate fields if present
  if (payload.content && (typeof payload.content !== 'string' || payload.content.trim().length === 0)) {
    throw new ValidationError('Content must be a non-empty string');
  }

  if (payload.type && !['daily', 'weekly', 'monthly', 'yearly', 'life'].includes(payload.type)) {
    throw new ValidationError('Invalid insight type');
  }

  if (payload.relevance !== undefined) {
    const relevance = Number(payload.relevance);
    if (isNaN(relevance) || relevance < 0 || relevance > 1) {
      throw new ValidationError('Relevance must be a number between 0 and 1');
    }
  }

  if (payload.tags !== undefined) {
    if (!Array.isArray(payload.tags)) {
      throw new ValidationError('Tags must be an array');
    }
    if (payload.tags.length > 10) {
      throw new ValidationError('Maximum 10 tags allowed');
    }
  }

  if (payload.status && !['pending', 'reviewed', 'addressed'].includes(payload.status)) {
    throw new ValidationError('Invalid status');
  }
} 