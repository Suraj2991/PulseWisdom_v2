import { IUser } from '../models/UserModel';
import { UserDTO } from '../dtos/UserDTO';
import { ObjectId } from 'mongodb';
import { USER_ROLES } from '../../../shared/constants/user';

type HouseSystem = 'placidus' | 'koch' | 'equal' | 'whole' | 'campanus' | 'regiomontanus';

const DEFAULT_PREFERENCES = {
  timezone: 'UTC',
  houseSystem: 'placidus' as HouseSystem,
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
    severity: ['high', 'medium', 'low'] as ('high' | 'medium' | 'low')[],
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
} as const;

export class UserTransformer {
  static toDTO(user: IUser & { _id: ObjectId }): UserDTO {
    const preferences = user.preferences ? {
      timezone: user.preferences.timezone || DEFAULT_PREFERENCES.timezone,
      houseSystem: (user.preferences.houseSystem || DEFAULT_PREFERENCES.houseSystem) as HouseSystem,
      aspectOrbs: user.preferences.aspectOrbs || DEFAULT_PREFERENCES.aspectOrbs,
      themePreferences: {
        colorScheme: user.preferences.themePreferences?.colorScheme || DEFAULT_PREFERENCES.themePreferences.colorScheme,
        fontSize: user.preferences.themePreferences?.fontSize || DEFAULT_PREFERENCES.themePreferences.fontSize,
        showAspects: user.preferences.themePreferences?.showAspects ?? DEFAULT_PREFERENCES.themePreferences.showAspects,
        showHouses: user.preferences.themePreferences?.showHouses ?? DEFAULT_PREFERENCES.themePreferences.showHouses,
        showPlanets: user.preferences.themePreferences?.showPlanets ?? DEFAULT_PREFERENCES.themePreferences.showPlanets,
        showRetrogrades: user.preferences.themePreferences?.showRetrogrades ?? DEFAULT_PREFERENCES.themePreferences.showRetrogrades,
        showLunarPhases: user.preferences.themePreferences?.showLunarPhases ?? DEFAULT_PREFERENCES.themePreferences.showLunarPhases,
        showEclipses: user.preferences.themePreferences?.showEclipses ?? DEFAULT_PREFERENCES.themePreferences.showEclipses,
        showStations: user.preferences.themePreferences?.showStations ?? DEFAULT_PREFERENCES.themePreferences.showStations,
        showHeliacal: user.preferences.themePreferences?.showHeliacal ?? DEFAULT_PREFERENCES.themePreferences.showHeliacal,
        showCosmic: user.preferences.themePreferences?.showCosmic ?? DEFAULT_PREFERENCES.themePreferences.showCosmic
      },
      insightPreferences: {
        categories: user.preferences.insightPreferences?.categories || [...DEFAULT_PREFERENCES.insightPreferences.categories],
        severity: user.preferences.insightPreferences?.severity || [...DEFAULT_PREFERENCES.insightPreferences.severity],
        types: user.preferences.insightPreferences?.types || [...DEFAULT_PREFERENCES.insightPreferences.types],
        showRetrogrades: user.preferences.insightPreferences?.showRetrogrades ?? DEFAULT_PREFERENCES.insightPreferences.showRetrogrades,
        showEclipses: user.preferences.insightPreferences?.showEclipses ?? DEFAULT_PREFERENCES.insightPreferences.showEclipses,
        showStations: user.preferences.insightPreferences?.showStations ?? DEFAULT_PREFERENCES.insightPreferences.showStations,
        showHeliacal: user.preferences.insightPreferences?.showHeliacal ?? DEFAULT_PREFERENCES.insightPreferences.showHeliacal,
        showCosmic: user.preferences.insightPreferences?.showCosmic ?? DEFAULT_PREFERENCES.insightPreferences.showCosmic,
        dailyInsights: user.preferences.insightPreferences?.dailyInsights ?? DEFAULT_PREFERENCES.insightPreferences.dailyInsights,
        progressionInsights: user.preferences.insightPreferences?.progressionInsights ?? DEFAULT_PREFERENCES.insightPreferences.progressionInsights,
        lifeThemeInsights: user.preferences.insightPreferences?.lifeThemeInsights ?? DEFAULT_PREFERENCES.insightPreferences.lifeThemeInsights,
        birthChartInsights: user.preferences.insightPreferences?.birthChartInsights ?? DEFAULT_PREFERENCES.insightPreferences.birthChartInsights
      },
      notificationPreferences: {
        email: {
          enabled: user.preferences.notificationPreferences?.email?.enabled ?? DEFAULT_PREFERENCES.notificationPreferences.email.enabled,
          types: user.preferences.notificationPreferences?.email?.types || [...DEFAULT_PREFERENCES.notificationPreferences.email.types]
        },
        push: {
          enabled: user.preferences.notificationPreferences?.push?.enabled ?? DEFAULT_PREFERENCES.notificationPreferences.push.enabled,
          types: user.preferences.notificationPreferences?.push?.types || [...DEFAULT_PREFERENCES.notificationPreferences.push.types]
        }
      }
    } : undefined;

    return {
      id: user._id.toString(),
      email: user.email,
      role: (user.role || USER_ROLES.USER) as keyof typeof USER_ROLES,
      firstName: user.firstName,
      lastName: user.lastName,
      birthDate: user.birthDate,
      birthTime: user.birthTime,
      birthLocation: user.birthLocation,
      isEmailVerified: user.isEmailVerified || false,
      preferences,
      createdAt: user.createdAt || new Date(),
      updatedAt: user.updatedAt || new Date()
    };
  }

  static toDTOList(users: (IUser & { _id: ObjectId })[]): UserDTO[] {
    return users.map(user => this.toDTO(user));
  }
} 