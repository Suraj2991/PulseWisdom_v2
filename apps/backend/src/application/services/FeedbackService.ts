import { UserFeedback } from '../../domain/types/personalization.types';

class FeedbackService {
  async recordFeedback(insightId: string, feedback: UserFeedback): Promise<void> {
    // Implement logic to save feedback
    console.log(`Feedback recorded for insight ${insightId}:`, feedback);
  }
}

export default FeedbackService; 