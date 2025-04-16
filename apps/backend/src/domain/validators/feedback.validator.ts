import { ValidationError } from '../errors';
import { IFeedback, IFeedbackBase } from '../models/Feedback';
import { ObjectId } from 'mongodb';

/**
 * Validates feedback submission data
 * @param feedbackData - Feedback data to validate
 * @throws ValidationError if any validation fails
 */
export function validateFeedbackSubmission(feedbackData: Partial<IFeedbackBase>): void {
  if (!feedbackData.userId || !feedbackData.insightId) {
    throw new ValidationError('User ID and Insight ID are required');
  }

  if (!feedbackData.rating) {
    throw new ValidationError('Rating is required');
  }

  if (typeof feedbackData.rating !== 'number' || feedbackData.rating < 1 || feedbackData.rating > 5) {
    throw new ValidationError('Rating must be a number between 1 and 5');
  }

  if (feedbackData.comment) {
    const comment = feedbackData.comment.trim();
    if (comment.length > 1000) {
      throw new ValidationError('Comment must not exceed 1000 characters');
    }
  }

  if (feedbackData.category) {
    const validCategories = ['bug', 'feature', 'improvement', 'other'] as const;
    if (!validCategories.includes(feedbackData.category)) {
      throw new ValidationError('Invalid feedback category');
    }
  }
}

/**
 * Validates feedback update data
 * @param updateData - Feedback update data
 * @throws ValidationError if any validation fails
 */
export function validateFeedbackUpdate(updateData: Partial<IFeedbackBase>): void {
  if (updateData.rating !== undefined) {
    if (typeof updateData.rating !== 'number' || updateData.rating < 1 || updateData.rating > 5) {
      throw new ValidationError('Rating must be a number between 1 and 5');
    }
  }

  if (updateData.comment) {
    const comment = updateData.comment.trim();
    if (comment.length > 1000) {
      throw new ValidationError('Comment must not exceed 1000 characters');
    }
  }

  if (updateData.category) {
    const validCategories = ['bug', 'feature', 'improvement', 'other'] as const;
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
export function validateFeedbackInput(feedback: Partial<IFeedbackBase>): void {
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