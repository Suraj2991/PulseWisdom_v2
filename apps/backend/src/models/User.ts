import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
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
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
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
        start: string; // Format: "HH:mm"
        end: string;   // Format: "HH:mm"
      };
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  firstName: {
    type: String,
    trim: true,
  },
  lastName: {
    type: String,
    trim: true,
  },
  birthDate: {
    type: Date,
    required: true,
  },
  birthTime: {
    type: String,
    required: false,
  },
  birthLocation: {
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    placeName: {
      type: String,
      required: true,
    },
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  resetPasswordToken: {
    type: String,
    select: false,
  },
  resetPasswordExpires: {
    type: Date,
    select: false,
  },
  emailVerificationToken: {
    type: String,
    select: false,
  },
  emailVerificationExpires: {
    type: Date,
    select: false,
  },
  preferences: {
    timezone: {
      type: String,
      required: true,
      default: 'UTC',
    },
    houseSystem: {
      type: String,
      enum: ['placidus', 'equal'],
      default: 'placidus',
    },
    aspectOrbs: {
      type: Number,
      required: true,
      default: 8,
    },
    themePreferences: {
      colorScheme: {
        type: String,
        enum: ['light', 'dark'],
        default: 'light',
      },
      fontSize: {
        type: String,
        enum: ['small', 'medium', 'large'],
        default: 'medium',
      },
      showAspects: {
        type: Boolean,
        default: true,
      },
      showHouses: {
        type: Boolean,
        default: true,
      },
      showPlanets: {
        type: Boolean,
        default: true,
      },
      showRetrogrades: {
        type: Boolean,
        default: true,
      },
      showLunarPhases: {
        type: Boolean,
        default: true,
      },
      showEclipses: {
        type: Boolean,
        default: true,
      },
      showStations: {
        type: Boolean,
        default: true,
      },
      showHeliacal: {
        type: Boolean,
        default: true,
      },
      showCosmic: {
        type: Boolean,
        default: true,
      },
    },
    insightPreferences: {
      categories: [{
        type: String,
        enum: ['personality', 'career', 'relationships', 'health', 'spirituality', 'life_purpose', 'challenges', 'opportunities', 'finances', 'personal_growth'],
      }],
      severity: [{
        type: String,
        enum: ['high', 'medium', 'low'],
      }],
      types: [{
        type: String,
        enum: ['PLANETARY_POSITION', 'HOUSE_POSITION', 'ASPECT', 'RETROGRADE', 'LUNAR_PHASE', 'SOLAR_ECLIPSE', 'LUNAR_ECLIPSE', 'STATION', 'HELIACAL', 'COSMIC', 'DAILY', 'PROGRESSION', 'LIFE_THEME', 'BIRTH_CHART'],
      }],
      showRetrogrades: {
        type: Boolean,
        default: true,
      },
      showEclipses: {
        type: Boolean,
        default: true,
      },
      showStations: {
        type: Boolean,
        default: true,
      },
      showHeliacal: {
        type: Boolean,
        default: true,
      },
      showCosmic: {
        type: Boolean,
        default: true,
      },
      dailyInsights: {
        type: Boolean,
        default: true,
      },
      progressionInsights: {
        type: Boolean,
        default: true,
      },
      lifeThemeInsights: {
        type: Boolean,
        default: true,
      },
      birthChartInsights: {
        type: Boolean,
        default: true,
      },
    },
    notificationPreferences: {
      email: {
        dailyInsights: {
          type: Boolean,
          default: true,
        },
        eclipseAlerts: {
          type: Boolean,
          default: true,
        },
        retrogradeAlerts: {
          type: Boolean,
          default: true,
        },
        stationAlerts: {
          type: Boolean,
          default: true,
        },
        heliacalAlerts: {
          type: Boolean,
          default: true,
        },
        cosmicAlerts: {
          type: Boolean,
          default: true,
        },
      },
      push: {
        dailyInsights: {
          type: Boolean,
          default: true,
        },
        eclipseAlerts: {
          type: Boolean,
          default: true,
        },
        retrogradeAlerts: {
          type: Boolean,
          default: true,
        },
        stationAlerts: {
          type: Boolean,
          default: true,
        },
        heliacalAlerts: {
          type: Boolean,
          default: true,
        },
        cosmicAlerts: {
          type: Boolean,
          default: true,
        },
      },
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
        default: 'daily',
      },
      quietHours: {
        enabled: {
          type: Boolean,
          default: false,
        },
        start: {
          type: String,
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
          default: '22:00',
        },
        end: {
          type: String,
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
          default: '07:00',
        },
      },
    },
  },
}, {
  timestamps: true,
});

export const User = model<IUser>('User', userSchema); 