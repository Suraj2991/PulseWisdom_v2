import { LifeTheme } from '../../life-theme';

export interface LifeThemeAnalysis {
  birthChartId: string;
  userId: string;
  themes: LifeTheme[];
  createdAt: Date;
  updatedAt: Date;
} 