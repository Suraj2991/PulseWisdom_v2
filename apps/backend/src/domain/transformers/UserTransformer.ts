import { IUser } from '../models/User';
import { UserDTO } from '../dtos/UserDTO';
import { ObjectId } from 'mongodb';

export class UserTransformer {
  static toDTO(user: IUser & { _id: ObjectId }): UserDTO {
    return {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      birthDate: user.birthDate,
      birthTime: user.birthTime,
      birthLocation: {
        latitude: user.birthLocation.latitude,
        longitude: user.birthLocation.longitude,
        placeName: user.birthLocation.placeName
      },
      isEmailVerified: user.isEmailVerified,
      preferences: {
        timezone: user.preferences.timezone,
        houseSystem: user.preferences.houseSystem,
        aspectOrbs: user.preferences.aspectOrbs,
        themePreferences: {
          colorScheme: user.preferences.themePreferences.colorScheme,
          fontSize: user.preferences.themePreferences.fontSize,
          showAspects: user.preferences.themePreferences.showAspects,
          showHouses: user.preferences.themePreferences.showHouses,
          showPlanets: user.preferences.themePreferences.showPlanets,
          showRetrogrades: user.preferences.themePreferences.showRetrogrades,
          showLunarPhases: user.preferences.themePreferences.showLunarPhases,
          showEclipses: user.preferences.themePreferences.showEclipses,
          showStations: user.preferences.themePreferences.showStations,
          showHeliacal: user.preferences.themePreferences.showHeliacal,
          showCosmic: user.preferences.themePreferences.showCosmic
        },
        insightPreferences: {
          categories: user.preferences.insightPreferences.categories,
          severity: user.preferences.insightPreferences.severity,
          types: user.preferences.insightPreferences.types,
          showRetrogrades: user.preferences.insightPreferences.showRetrogrades,
          showEclipses: user.preferences.insightPreferences.showEclipses,
          showStations: user.preferences.insightPreferences.showStations,
          showHeliacal: user.preferences.insightPreferences.showHeliacal,
          showCosmic: user.preferences.insightPreferences.showCosmic,
          dailyInsights: user.preferences.insightPreferences.dailyInsights,
          progressionInsights: user.preferences.insightPreferences.progressionInsights,
          lifeThemeInsights: user.preferences.insightPreferences.lifeThemeInsights,
          birthChartInsights: user.preferences.insightPreferences.birthChartInsights
        },
        notificationPreferences: {
          email: {
            dailyInsights: user.preferences.notificationPreferences.email.types.includes('dailyInsights'),
            eclipseAlerts: user.preferences.notificationPreferences.email.types.includes('eclipseAlerts'),
            retrogradeAlerts: user.preferences.notificationPreferences.email.types.includes('retrogradeAlerts'),
            stationAlerts: user.preferences.notificationPreferences.email.types.includes('stationAlerts'),
            heliacalAlerts: user.preferences.notificationPreferences.email.types.includes('heliacalAlerts'),
            cosmicAlerts: user.preferences.notificationPreferences.email.types.includes('cosmicAlerts')
          },
          push: {
            dailyInsights: user.preferences.notificationPreferences.push.types.includes('dailyInsights'),
            eclipseAlerts: user.preferences.notificationPreferences.push.types.includes('eclipseAlerts'),
            retrogradeAlerts: user.preferences.notificationPreferences.push.types.includes('retrogradeAlerts'),
            stationAlerts: user.preferences.notificationPreferences.push.types.includes('stationAlerts'),
            heliacalAlerts: user.preferences.notificationPreferences.push.types.includes('heliacalAlerts'),
            cosmicAlerts: user.preferences.notificationPreferences.push.types.includes('cosmicAlerts')
          },
          frequency: 'daily',
          quietHours: {
            enabled: false,
            start: '22:00',
            end: '08:00'
          }
        }
      },
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  static toDTOList(users: (IUser & { _id: ObjectId })[]): UserDTO[] {
    return users.map(user => this.toDTO(user));
  }
} 