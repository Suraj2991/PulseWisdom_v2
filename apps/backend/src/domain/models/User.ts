import { ObjectId } from 'mongodb';

export interface IUser {
  _id?: ObjectId;
  /** User's email address, used for login and communication */
  email: string;
  /** Hashed password for authentication */
  password: string;
  /** User's role in the system */
  role: 'user' | 'admin';
  /** User's first name */
  firstName?: string;
  /** User's last name */
  lastName?: string;
  /** User's date of birth */
  birthDate: Date;
  /** User's time of birth in HH:mm format */
  birthTime?: string;
  /** User's birth location details */
  birthLocation: {
    /** Latitude of birth location */
    latitude: number;
    /** Longitude of birth location */
    longitude: number;
    /** Name of the birth place */
    placeName: string;
  };
  /** Whether the user's email has been verified */
  isEmailVerified: boolean;
  /** Token for password reset */
  resetPasswordToken?: string;
  /** Expiration date for password reset token */
  resetPasswordExpires?: Date;
  /** Token for email verification */
  emailVerificationToken?: string;
  /** Expiration date for email verification token */
  emailVerificationExpires?: Date;
  /** User's preferences and settings */
  preferences: {
    /** User's timezone */
    timezone: string;
    /** Preferred house system for astrological calculations */
    houseSystem: 'placidus' | 'equal';
    /** Orb size for aspect calculations */
    aspectOrbs: number;
    /** Theme and display preferences */
    themePreferences: {
      /** Color scheme preference */
      colorScheme: 'light' | 'dark';
      /** Font size preference */
      fontSize: 'small' | 'medium' | 'large';
      /** Whether to show aspects */
      showAspects: boolean;
      /** Whether to show houses */
      showHouses: boolean;
      /** Whether to show planets */
      showPlanets: boolean;
      /** Whether to show retrogrades */
      showRetrogrades: boolean;
      /** Whether to show lunar phases */
      showLunarPhases: boolean;
      /** Whether to show eclipses */
      showEclipses: boolean;
      /** Whether to show stations */
      showStations: boolean;
      /** Whether to show heliacal events */
      showHeliacal: boolean;
      /** Whether to show cosmic events */
      showCosmic: boolean;
    };
    /** Insight generation preferences */
    insightPreferences: {
      /** Categories of insights to generate */
      categories: string[];
      /** Severity levels of insights to show */
      severity: ('high' | 'medium' | 'low')[];
      /** Types of insights to generate */
      types: string[];
      /** Whether to show retrograde insights */
      showRetrogrades: boolean;
      /** Whether to show eclipse insights */
      showEclipses: boolean;
      /** Whether to show station insights */
      showStations: boolean;
      /** Whether to show heliacal insights */
      showHeliacal: boolean;
      /** Whether to show cosmic insights */
      showCosmic: boolean;
      /** Whether to receive daily insights */
      dailyInsights: boolean;
      /** Whether to receive progression insights */
      progressionInsights: boolean;
      /** Whether to receive life theme insights */
      lifeThemeInsights: boolean;
      /** Whether to receive birth chart insights */
      birthChartInsights: boolean;
    };
    /** Notification preferences */
    notificationPreferences: {
      /** Email notification settings */
      email: {
        /** Whether to receive email notifications */
        enabled: boolean;
        /** Types of email notifications to receive */
        types: string[];
      };
      /** Push notification settings */
      push: {
        /** Whether to receive push notifications */
        enabled: boolean;
        /** Types of push notifications to receive */
        types: string[];
      };
    };
  };
  /** User's activity history */
  activityHistory: Array<{
    /** Type of activity */
    type: string;
    /** Timestamp of the activity */
    timestamp: Date;
    /** Additional data about the activity */
    data?: Record<string, unknown>;
  }>;
  /** User's subscription information */
  subscription?: {
    /** Type of subscription */
    type: 'free' | 'premium' | 'enterprise';
    /** Subscription start date */
    startDate: Date;
    /** Subscription end date */
    endDate?: Date;
    /** Whether the subscription is active */
    isActive: boolean;
    /** Subscription payment information */
    payment?: {
      /** Payment method */
      method: string;
      /** Last payment date */
      lastPaymentDate: Date;
      /** Next payment date */
      nextPaymentDate?: Date;
    };
  };
  /** User's API usage information */
  apiUsage?: {
    /** Number of API calls made */
    calls: number;
    /** Last API call timestamp */
    lastCall: Date;
    /** API call limit */
    limit: number;
  };
  /** User's created timestamp */
  createdAt: Date;
  /** User's last updated timestamp */
  updatedAt: Date;
  /** Token for refreshing authentication */
  refreshToken?: string;
}

export type UserDocument = IUser & { _id: ObjectId }; 