import { ObjectId } from 'mongodb';

// Base feedback interface without Mongoose-specific properties
export interface IFeedbackBase {
  /** ID of the user who provided the feedback */
  userId: ObjectId;
  /** ID of the insight being feedback on */
  insightId: ObjectId;
  /** Rating given (1-5) */
  rating: number;
  /** Optional comment about the feedback */
  comment?: string;
  /** Category of feedback */
  category?: 'bug' | 'feature' | 'improvement' | 'other';
  /** Document creation timestamp */
  createdAt: Date;
  /** Document last update timestamp */
  updatedAt: Date;
}

// Mongoose document interface
export interface IFeedback extends IFeedbackBase {
  /** MongoDB document ID */
  _id: ObjectId;
}

export type FeedbackDocument = IFeedback & { _id: ObjectId }; 