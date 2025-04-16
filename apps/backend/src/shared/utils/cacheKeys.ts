import { DateTime } from '../../domain/types/ephemeris.types';

export class CacheKeyGenerator {
  static readonly PREFIXES = {
    BIRTH_CHART: 'birthChart',
    TRANSIT: 'transit',
    LIFE_THEME: 'lifeTheme',
    INSIGHT: 'insight',
    USER: 'user',
    AUTH: 'auth'
  };

  static getBirthChartKey(id: string): string {
    return `${this.PREFIXES.BIRTH_CHART}:${id}`;
  }

  static getTransitKey(birthChartId: string, date: DateTime): string {
    return `${this.PREFIXES.TRANSIT}:${birthChartId}:${date.toISOString()}`;
  }

  static getLifeThemeKey(birthChartId: string): string {
    return `${this.PREFIXES.LIFE_THEME}:${birthChartId}`;
  }

  static getInsightKey(birthChartId: string, type: string): string {
    return `${this.PREFIXES.INSIGHT}:${birthChartId}:${type}`;
  }

  static getUserKey(id: string): string {
    return `${this.PREFIXES.USER}:${id}`;
  }

  static getAuthKey(token: string): string {
    return `${this.PREFIXES.AUTH}:${token}`;
  }
} 