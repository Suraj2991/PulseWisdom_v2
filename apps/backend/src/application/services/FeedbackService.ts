import { ICache } from '../../infrastructure/cache/ICache';
import { IFeedbackBase, IFeedback } from '../../domain/models/Feedback';
import { AppError } from '../../domain/errors';
import { logger } from '../../shared/logger';
import { validateFeedbackInput } from '../../domain/validators/feedback.validator';
import { Sanitizer } from '../../shared/sanitization';
import { Types } from 'mongoose';

type FeedbackCategory = 'bug' | 'feature' | 'improvement' | 'other';

interface StoredFeedback extends Omit<IFeedbackBase, '_id'> {
  _id: string;
}

export class FeedbackService {
  constructor(private readonly cache: ICache) {}

  async createFeedback(feedback: Omit<IFeedbackBase, 'createdAt' | 'updatedAt'>): Promise<StoredFeedback> {
    try {
      const newFeedback: StoredFeedback = {
        ...feedback,
        comment: feedback.comment ? Sanitizer.sanitizeString(feedback.comment) : undefined,
        category: feedback.category as FeedbackCategory,
        _id: new Date().getTime().toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.cache.set(`feedback:${newFeedback._id}`, newFeedback);
      return newFeedback;
    } catch (error) {
      logger.error('Failed to create feedback', { error });
      throw new AppError('Failed to create feedback');
    }
  }

  async getFeedbackById(id: string): Promise<StoredFeedback | null> {
    try {
      return await this.cache.get<StoredFeedback>(`feedback:${id}`);
    } catch (error) {
      logger.error('Failed to get feedback', { error, id });
      throw new AppError('Failed to get feedback');
    }
  }

  async updateFeedback(id: string, feedback: Partial<IFeedbackBase>): Promise<StoredFeedback | null> {
    try {
      const existingFeedback = await this.getFeedbackById(id);
      if (!existingFeedback) {
        return null;
      }

      const updatedFeedback: StoredFeedback = {
        ...existingFeedback,
        ...feedback,
        comment: feedback.comment ? Sanitizer.sanitizeString(feedback.comment) : existingFeedback.comment,
        category: feedback.category as FeedbackCategory,
        updatedAt: new Date()
      };

      await this.cache.set(`feedback:${id}`, updatedFeedback);
      return updatedFeedback;
    } catch (error) {
      logger.error('Failed to update feedback', { error, id });
      throw new AppError('Failed to update feedback');
    }
  }

  async deleteFeedback(id: string): Promise<boolean> {
    try {
      await this.cache.delete(`feedback:${id}`);
      return true;
    } catch (error) {
      logger.error('Failed to delete feedback', { error, id });
      throw new AppError('Failed to delete feedback');
    }
  }

  async submitFeedback(feedbackData: Omit<IFeedbackBase, 'createdAt' | 'updatedAt'>): Promise<StoredFeedback> {
    // Validate feedback data
    validateFeedbackInput(feedbackData);
    return this.createFeedback(feedbackData);
  }
}

export default FeedbackService; 