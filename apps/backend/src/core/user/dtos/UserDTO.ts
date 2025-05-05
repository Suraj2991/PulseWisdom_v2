import { USER_ROLES } from '../../../shared/constants/user';

export interface UserDTO {
  id: string;
  email: string;
  role: keyof typeof USER_ROLES;
  firstName: string;
  lastName: string;
  birthDate?: Date;
  birthTime?: `${number}:${number}`;
  birthLocation?: {
    latitude: number;
    longitude: number;
    placeName?: string;
  };
  isEmailVerified: boolean;
  preferences?: {
    timezone?: string;
    houseSystem?: 'placidus' | 'koch' | 'equal' | 'whole' | 'campanus' | 'regiomontanus';
    aspectOrbs?: number;
    themePreferences?: {
      colorScheme?: 'light' | 'dark';
      fontSize?: 'small' | 'medium' | 'large';
      showAspects?: boolean;
      showHouses?: boolean;
      showPlanets?: boolean;
      showRetrogrades?: boolean;
      showLunarPhases?: boolean;
      showEclipses?: boolean;
      showStations?: boolean;
      showHeliacal?: boolean;
      showCosmic?: boolean;
    };
    insightPreferences?: {
      categories?: string[];
      severity?: ('high' | 'medium' | 'low')[];
      types?: string[];
      showRetrogrades?: boolean;
      showEclipses?: boolean;
      showStations?: boolean;
      showHeliacal?: boolean;
      showCosmic?: boolean;
      dailyInsights?: boolean;
      progressionInsights?: boolean;
      lifeThemeInsights?: boolean;
      birthChartInsights?: boolean;
    };
    notificationPreferences?: {
      email?: {
        enabled?: boolean;
        types?: string[];
      };
      push?: {
        enabled?: boolean;
        types?: string[];
      };
    };
  };
  createdAt: Date;
  updatedAt: Date;
} 