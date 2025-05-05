export interface TimingWindow {
  type: 'Opportunity' | 'Challenge' | 'Integration';
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  involvedPlanets: string[];
  aspectType: string;
  keywords: string[];
} 