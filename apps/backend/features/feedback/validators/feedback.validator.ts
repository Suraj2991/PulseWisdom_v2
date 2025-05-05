import { ValidationError } from '../../../domain/errors';
import { CommonValidator } from '../../../shared/validation/common';
import { IFeedback } from '../models/FeedbackModel';

/**
 * Validates feedback submission data
 * @param feedback - Feedback data to validate
 * @throws ValidationError if any validation fails
 */
export function validateFeedbackSubmission(feedback: Partial<IFeedback>): void {
  // Validate required fields
  if (!feedback.userId) {
    throw new ValidationError('User ID is required');
  }

  if (!feedback.insightId) {
    throw new ValidationError('Insight ID is required');
  }

  // Validate rating
  CommonValidator.validateNumber(feedback.rating, 1, 5, 'Rating');

  // Validate comment if provided
  if (feedback.comment) {
    CommonValidator.validateLength(feedback.comment, 1, 1000, 'Comment');
  }

  // Validate category if provided
  if (feedback.category) {
    const validCategories = ['bug', 'feature', 'improvement', 'other'];
    if (!validCategories.includes(feedback.category)) {
      throw new ValidationError('Invalid feedback category');
    }
  }
}

/**
 * Validates feedback update data
 * @param updateData - Feedback update data
 * @throws ValidationError if any validation fails
 */
export function validateFeedbackUpdate(updateData: Partial<IFeedback>): void {
  // Validate rating if provided
  if (updateData.rating !== undefined) {
    CommonValidator.validateNumber(updateData.rating, 1, 5, 'Rating');
  }

  // Validate comment if provided
  if (updateData.comment) {
    CommonValidator.validateLength(updateData.comment, 1, 1000, 'Comment');
  }

  // Validate category if provided
  if (updateData.category) {
    const validCategories = ['bug', 'feature', 'improvement', 'other'];
    if (!validCategories.includes(updateData.category)) {
      throw new ValidationError('Invalid feedback category');
    }
  }
}

/**
 * Validates feedback input data
 * @param feedback - Feedback input data
 * @throws ValidationError if any validation fails
 */
export function validateFeedbackInput(feedback: Partial<IFeedback>): void {
  // Check required fields
  if (!feedback.userId) {
    throw new ValidationError('User ID is required');
  }

  if (!feedback.insightId) {
    throw new ValidationError('Insight ID is required');
  }

  if (!feedback.rating) {
    throw new ValidationError('Rating is required');
  }

  // Validate rating
  const rating = Number(feedback.rating);
  if (isNaN(rating) || rating < 1 || rating > 5) {
    throw new ValidationError('Rating must be a number between 1 and 5');
  }

  // Validate comment if present
  if (feedback.comment) {
    const comment = feedback.comment.trim();
    if (comment.length > 1000) {
      throw new ValidationError('Comment must not exceed 1000 characters');
    }
  }

  // Validate category if present
  if (feedback.category) {
    const validCategories = ['bug', 'feature', 'improvement', 'other'] as const;
    if (!validCategories.includes(feedback.category)) {
      throw new ValidationError('Invalid feedback category');
    }
  }
} 