export interface InsightLog {
  id: string;
  userId: string;
  insightType:
    | 'LifeTheme'
    | 'Transit'
    | 'NatalChart'
    | 'Strength'
    | 'Challenge'
    | 'Pattern'
    | 'HouseTheme'
    | 'HouseLord'
    | 'CoreIdentity'
    | 'OverallSummary'
    | 'NodeInsight'
    | 'Daily'
    | 'TimingWindow';
  content: string; // full generated insight
  generatedAt: Date;
  metadata?: Record<string, any>; // optional, for tagging transits, planets, themes etc.
  feedback?: UserFeedback;
}

export interface UserFeedback {
  rating?: number; // e.g. 1 to 5
  liked?: boolean;
  tags?: string[]; // e.g. ['resonated', 'too vague', 'career focus']
  notes?: string;  // optional user comment
} 