export interface UserDTO {
  id: string;
  email: string;
  role: 'user' | 'admin';
  firstName?: string;
  lastName?: string;
  birthDate: Date;
  birthTime?: string;
  birthLocation: {
    latitude: number;
    longitude: number;
    placeName: string;
  };
  isEmailVerified: boolean;
  preferences: {
    timezone: string;
    houseSystem: 'placidus' | 'equal';
    aspectOrbs: number;
    themePreferences: {
      colorScheme: 'light' | 'dark';
      fontSize: 'small' | 'medium' | 'large';
      showAspects: boolean;
      showHouses: boolean;
      showPlanets: boolean;
      showRetrogrades: boolean;
      showLunarPhases: boolean;
      showEclipses: boolean;
      showStations: boolean;
      showHeliacal: boolean;
      showCosmic: boolean;
    };
    insightPreferences: {
      categories: string[];
      severity: ('high' | 'medium' | 'low')[];
      types: string[];
      showRetrogrades: boolean;
      showEclipses: boolean;
      showStations: boolean;
      showHeliacal: boolean;
      showCosmic: boolean;
      dailyInsights: boolean;
      progressionInsights: boolean;
      lifeThemeInsights: boolean;
      birthChartInsights: boolean;
    };
    notificationPreferences: {
      email: {
        dailyInsights: boolean;
        eclipseAlerts: boolean;
        retrogradeAlerts: boolean;
        stationAlerts: boolean;
        heliacalAlerts: boolean;
        cosmicAlerts: boolean;
      };
      push: {
        dailyInsights: boolean;
        eclipseAlerts: boolean;
        retrogradeAlerts: boolean;
        stationAlerts: boolean;
        heliacalAlerts: boolean;
        cosmicAlerts: boolean;
      };
      frequency: 'daily' | 'weekly' | 'monthly';
      quietHours: {
        enabled: boolean;
        start: string;
        end: string;
      };
    };
  };
  createdAt: Date;
  updatedAt: Date;
} 