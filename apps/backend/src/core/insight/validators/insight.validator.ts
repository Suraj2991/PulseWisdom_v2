import { ValidationError } from '../../../domain/errors';
import { CommonValidator } from '../../../shared/validation/common';
import { IInsight, InsightAnalysis, InsightType } from '../types/insight.types';

const VALID_INSIGHT_TYPES = Object.values(InsightType);
const MAX_TAGS = 10;

/**
 * Validates insight data
 * @param insightData - Insight data to validate
 * @throws ValidationError if any validation fails
 */
export function validateInsight(insightData: Partial<IInsight>): void {
  // Validate content
  if (!insightData.content) {
    throw new ValidationError('Insight content is required');
  }
  CommonValidator.validateLength(insightData.content, 20, 2000, 'Content');

  // Validate type
  if (!insightData.type) {
    throw new ValidationError('Insight type is required');
  }
  if (!Object.values(InsightType).includes(insightData.type as InsightType)) {
    throw new ValidationError(`Invalid insight type. Must be one of: ${VALID_INSIGHT_TYPES.join(', ')}`);
  }

  // Validate relevance if provided
  if (insightData.relevance !== undefined) {
    CommonValidator.validateNumber(insightData.relevance, 0, 1, 'Relevance');
  }

  // Validate tags if provided
  if (insightData.tags) {
    if (!Array.isArray(insightData.tags)) {
      throw new ValidationError('Tags must be an array');
    }
    if (insightData.tags.length > MAX_TAGS) {
      throw new ValidationError(`Maximum ${MAX_TAGS} tags allowed`);
    }
    insightData.tags.forEach(tag => {
      CommonValidator.validateLength(tag, 1, 50, 'Tag');
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
    CommonValidator.validateLength(updateData.content, 20, 2000, 'Content');
  }

  if (updateData.type) {
    if (!Object.values(InsightType).includes(updateData.type as InsightType)) {
      throw new ValidationError(`Invalid insight type. Must be one of: ${VALID_INSIGHT_TYPES.join(', ')}`);
    }
  }

  if (updateData.relevance !== undefined) {
    CommonValidator.validateNumber(updateData.relevance, 0, 1, 'Relevance');
  }

  if (updateData.tags) {
    if (!Array.isArray(updateData.tags)) {
      throw new ValidationError('Tags must be an array');
    }
    if (updateData.tags.length > MAX_TAGS) {
      throw new ValidationError(`Maximum ${MAX_TAGS} tags allowed`);
    }
    updateData.tags.forEach(tag => {
      CommonValidator.validateLength(tag, 1, 50, 'Tag');
    });
  }
}

/**
 * Validates insight request data
 * @param input - Request input data
 * @throws ValidationError if any validation fails
 */
export function validateInsightRequest(input: { birthChartId: string }): void {
  if (!input.birthChartId) {
    throw new ValidationError('Birth chart ID is required');
  }
  CommonValidator.validateLength(input.birthChartId, 1, 100, 'Birth chart ID');
}

/**
 * Validates insight update payload
 * @param payload - Update payload data
 * @throws ValidationError if any validation fails
 */
export function validateInsightUpdatePayload(payload: Partial<InsightAnalysis>): void {
  // Check for unsupported fields
  const allowedFields = ['content', 'type', 'relevance', 'tags', 'status'] as const;
  const providedFields = Object.keys(payload);
  
  const unsupportedFields = providedFields.filter(field => !allowedFields.includes(field as typeof allowedFields[number]));
  if (unsupportedFields.length > 0) {
    throw new ValidationError(`Unsupported fields in update payload: ${unsupportedFields.join(', ')}`);
  }

  // Validate fields if present
  if (payload.content) {
    CommonValidator.validateLength(payload.content, 20, 2000, 'Content');
  }

  if (payload.type) {
    if (!Object.values(InsightType).includes(payload.type as InsightType)) {
      throw new ValidationError(`Invalid insight type. Must be one of: ${VALID_INSIGHT_TYPES.join(', ')}`);
    }
  }

  if (payload.relevance !== undefined) {
    CommonValidator.validateNumber(payload.relevance, 0, 1, 'Relevance');
  }

  if (payload.tags) {
    if (!Array.isArray(payload.tags)) {
      throw new ValidationError('Tags must be an array');
    }
    if (payload.tags.length > MAX_TAGS) {
      throw new ValidationError(`Maximum ${MAX_TAGS} tags allowed`);
    }
    payload.tags.forEach(tag => {
      CommonValidator.validateLength(tag, 1, 50, 'Tag');
    });
  }

  if (payload.status && !['pending', 'reviewed', 'addressed'].includes(payload.status)) {
    throw new ValidationError('Invalid status');
  }
} 