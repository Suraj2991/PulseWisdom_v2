import { LifeTheme } from './lifeTheme.types';

export interface LifeThemeAnalysis {
  birthChartId: string;
  userId: string;
  themes: LifeTheme[];
  createdAt: Date;
  updatedAt: Date;
} 