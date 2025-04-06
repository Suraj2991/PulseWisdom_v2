import { Types } from 'mongoose';
import { ICache } from '../../infrastructure/cache/ICache';
import { LifeTheme } from '../../domain/types/lifeTheme.types';
import { LifeThemeAnalysis } from '../../domain/types/lifeThemeAnalysis.types';
import { NotFoundError } from '../../domain/errors';
import { EphemerisService } from './EphemerisService';
import { AIService } from './AIService';
import { BirthChart } from '../../domain/types/ephemeris.types';
import { BirthChartService } from './BirthChartService';

export class LifeThemeService {
  constructor(
    private cache: ICache,
    private ephemerisService: EphemerisService,
    private birthChartService: BirthChartService,
    private aiService: AIService
  ) {}

  async analyzeLifeThemes(birthChartId: string): Promise<LifeThemeAnalysis> {
    const cacheKey = `lifeTheme:${birthChartId}`;
    const cached = await this.cache.get<LifeThemeAnalysis>(cacheKey);
    if (cached) {
      return cached;
    }

    const birthChart = await this.birthChartService.getBirthChartById(birthChartId);
    if (!birthChart) {
      throw new NotFoundError('Birth chart not found');
    }

    const positions = await this.ephemerisService.getPlanetaryPositions(
      birthChart.datetime,
      birthChart.location.latitude,
      birthChart.location.longitude
    );

    const aspects = await this.ephemerisService.calculateAspects(positions);
    const houses = await this.ephemerisService.calculateHouses(
      birthChart.datetime,
      birthChart.location.latitude,
      birthChart.location.longitude
    );

    const calculatedBirthChart: BirthChart = {
      ...birthChart,
      positions,
      aspects,
      houses
    };

    const themes = await this.generateLifeThemes(calculatedBirthChart);

    const analysis: LifeThemeAnalysis = {
      birthChartId,
      userId: birthChart.userId.toString(),
      themes,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.cache.set(cacheKey, analysis, 3600);
    return analysis;
  }

  private async generateLifeThemes(birthChart: BirthChart): Promise<LifeTheme[]> {
    const themes: LifeTheme[] = [];

    // Example logic:
    if (birthChart.aspects.some(a => a.planet1 === 'Sun' && a.planet2 === 'Pluto' && a.aspect === 'Conjunction')) {
      themes.push({
        theme: 'Transformation & Empowerment',
        description: 'You carry a deep capacity for inner transformation...',
        influences: ['Sun conjunct Pluto'],
        planetaryAspects: [
          { planet: 'Sun', aspect: 'Conjunction Pluto', influence: 'Creates a profound inner force for renewal and rebirth' }
        ]
      });
    }

    return themes;
  }

  async generateLifeThemeInsights(birthChart: BirthChart): Promise<string> {
    const themes = await this.generateLifeThemes(birthChart);
    const insights = await Promise.all(
      themes.map(theme => this.aiService.generateLifeThemeInsight(theme))
    );
    return insights.join('\n\n');
  }

  private getSignName(longitude: number): string {
    const signs = [
      'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
      'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
    ];
    return signs[Math.floor(longitude / 30)];
  }

  private getPlanetName(planetId: number): string {
    const planets: Record<number, string> = {
      0: 'Sun',
      1: 'Moon',
      2: 'Mercury',
      3: 'Venus',
      4: 'Mars',
      5: 'Jupiter',
      6: 'Saturn',
      7: 'Uranus',
      8: 'Neptune',
      9: 'Pluto'
    };
    return planets[planetId] || `Planet ${planetId}`;
  }

  async getLifeThemesByUserId(userId: string): Promise<LifeThemeAnalysis[]> {
    const birthCharts = await this.birthChartService.getBirthChartsByUserId(userId);
    const analyses: LifeThemeAnalysis[] = [];

    for (const chart of birthCharts) {
      if (chart._id) {
        const analysis = await this.analyzeLifeThemes(chart._id.toString());
        analyses.push(analysis);
      }
    }

    return analyses;
  }

  async updateLifeThemes(birthChartId: string, themes: LifeTheme[]): Promise<LifeThemeAnalysis> {
    const analysis = await this.analyzeLifeThemes(birthChartId);
    const updatedAnalysis: LifeThemeAnalysis = {
      ...analysis,
      themes,
      updatedAt: new Date()
    };

    await this.cache.set(`lifeTheme:${birthChartId}`, updatedAnalysis, 3600);
    return updatedAnalysis;
  }
} 