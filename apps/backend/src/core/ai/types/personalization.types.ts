import { InsightType } from '../../insight';
import { LifeArea } from '../../life-theme';

export interface InsightLog {
  id: string;
  userId: string;
  insightType: InsightType;
  content: string;
  generatedAt: Date;
  metadata?: {
    date?: Date;
    planet?: string;
    sign?: string;
    house?: number;
    orb?: number;
    lifeThemeKey?: string;
    lifeArea?: LifeArea;
    transitAspect?: string;
    transitCount?: number;
    themeCount?: number;
    birthChartId?: string;
    triggeredBy?: 'chiron' | 'node' | 'return' | 'retrograde' | 'natal';
    keyTransits?: Array<{
      planet: string;
      sign: string;
      house: number;
      orb: number;
    }>;
  };
  feedback?: UserFeedback;
}

export interface UserFeedback {
  rating?: number; // e.g. 1 to 5
  liked?: boolean;
  tags?: string[]; // e.g. ['resonated', 'too vague', 'career focus']
  notes?: string;  // optional user comment
} 