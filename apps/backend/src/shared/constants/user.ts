/**
 * User-related constants used across the application
 */

// Cache settings
export const USER_CACHE = {
  PREFIX: 'user:',
  TTL: 3600, // 1 hour in seconds
  SEARCH_PREFIX: 'user:search:',
  SEARCH_TTL: 300, // 5 minutes in seconds
} as const;

// Validation rules
export const USER_VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  EMAIL_MAX_LENGTH: 255,
  LOCATION_MAX_LENGTH: 100,
  BIO_MAX_LENGTH: 500,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
  USERNAME_PATTERN: /^[a-zA-Z0-9_-]+$/,
} as const;

// User roles and permissions
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  PREMIUM: 'premium',
  GUEST: 'guest',
} as const;

// Default user preferences
export const DEFAULT_USER_PREFERENCES = {
  timezone: 'UTC',
  houseSystem: 'placidus',
  aspectOrbs: 8,
  themePreferences: {
    colorScheme: 'light' as const,
    fontSize: 'medium' as const,
    showAspects: true,
    showHouses: true,
    showPlanets: true,
    showRetrogrades: true,
    showLunarPhases: true,
    showEclipses: true,
    showStations: true,
    showHeliacal: true,
    showCosmic: true
  },
  insightPreferences: {
    categories: [] as string[],
    severity: ['high', 'medium', 'low'] as const,
    types: [] as string[],
    showRetrogrades: true,
    showEclipses: true,
    showStations: true,
    showHeliacal: true,
    showCosmic: true,
    dailyInsights: true,
    progressionInsights: true,
    lifeThemeInsights: true,
    birthChartInsights: true
  },
  notificationPreferences: {
    email: {
      enabled: true,
      types: [] as string[]
    },
    push: {
      enabled: true,
      types: [] as string[]
    }
  }
};

// User activity types
export const USER_ACTIVITY = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  PROFILE_UPDATE: 'profile_update',
  PREFERENCES_UPDATE: 'preferences_update',
  PASSWORD_CHANGE: 'password_change',
  EMAIL_VERIFICATION: 'email_verification',
  ACCOUNT_DELETION: 'account_deletion',
} as const;

// User status
export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  DELETED: 'deleted',
} as const;

// Search and pagination
export const USER_SEARCH = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 50,
  MIN_PAGE_SIZE: 1,
  DEFAULT_SORT_FIELD: 'createdAt',
  DEFAULT_SORT_ORDER: 'desc',
} as const;

// Error messages
export const USER_ERROR_MESSAGES = {
  NOT_FOUND: 'User not found',
  ALREADY_EXISTS: 'User already exists',
  INVALID_CREDENTIALS: 'Invalid credentials',
  ACCOUNT_LOCKED: 'Account is locked',
  EMAIL_NOT_VERIFIED: 'Email not verified',
  INVALID_TOKEN: 'Invalid or expired token',
  PASSWORD_MISMATCH: 'Passwords do not match',
  INVALID_ROLE: 'Invalid user role',
  INVALID_STATUS: 'Invalid user status',
} as const;

// Rate limiting
export const USER_RATE_LIMITS = {
  LOGIN_ATTEMPTS: 5,
  LOGIN_WINDOW: 15 * 60, // 15 minutes in seconds
  PASSWORD_RESET_WINDOW: 24 * 60 * 60, // 24 hours in seconds
  EMAIL_VERIFICATION_WINDOW: 24 * 60 * 60, // 24 hours in seconds
} as const; 