import { Types } from 'mongoose';
import { ICache } from '../infrastructure/cache/ICache';
import { LifeTheme, LifeThemeAnalysis } from '../types/lifeTheme.types';
import { NotFoundError } from '../types/errors';
import { EphemerisService } from './EphemerisService';
import { AIService } from './AIService';
import { BirthChart as EphemerisBirthChart } from '../types/ephemeris.types';

export class LifeThemeService {
  constructor(
    private cache: ICache,
    private ephemerisService: EphemerisService,
    private aiService: AIService
  ) {}

  async analyzeLifeThemes(birthChartId: string): Promise<LifeThemeAnalysis> {
    const cacheKey = `lifeTheme:${birthChartId}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached as LifeThemeAnalysis;
    }

    const birthChart = await this.ephemerisService.getBirthChartById(birthChartId);
    if (!birthChart) {
      throw new NotFoundError('Birth chart not found');
    }

    const calculatedBirthChart = await this.ephemerisService.calculateBirthChart(
      birthChart.datetime,
      birthChart.location,
      birthChart.houseSystem
    );

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

  private async generateLifeThemes(birthChart: EphemerisBirthChart): Promise<LifeTheme> {
    const sun = birthChart.bodies.find(b => b.id === 0);
    const moon = birthChart.bodies.find(b => b.id === 1);
    const ascendant = birthChart.angles.ascendant;

    if (!sun || !moon) {
      throw new Error('Required celestial bodies not found in birth chart');
    }

    // Use AI service for analysis
    const [strengths, challenges, patterns, lifeThemes, houseLords] = await Promise.all([
      this.aiService.analyzeStrengths(birthChart),
      this.aiService.analyzeChallenges(birthChart),
      this.aiService.identifyPatterns(birthChart),
      this.aiService.analyzeHouseThemes(birthChart),
      this.aiService.analyzeHouseLords(birthChart)
    ]);

    return {
      coreIdentity: {
        ascendant: this.getSignName(ascendant),
        sunSign: this.getSignName(sun.longitude),
        moonSign: this.getSignName(moon.longitude),
        description: await this.aiService.generateCoreIdentityDescription(sun, moon, ascendant)
      },
      strengths,
      challenges,
      patterns,
      lifeThemes,
      houseLords,
      overallSummary: await this.aiService.generateOverallSummary(strengths, challenges, patterns)
    };
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
    const birthCharts = await this.ephemerisService.getBirthChartsByUserId(userId);
    const analyses: LifeThemeAnalysis[] = [];

    for (const chart of birthCharts) {
      if (chart._id) {
        const analysis = await this.analyzeLifeThemes(chart._id.toString());
        analyses.push(analysis);
      }
    }

    return analyses;
  }

  async updateLifeThemes(birthChartId: string, themes: Partial<LifeTheme>): Promise<LifeThemeAnalysis> {
    const analysis = await this.analyzeLifeThemes(birthChartId);
    const updatedAnalysis: LifeThemeAnalysis = {
      ...analysis,
      themes: {
        ...analysis.themes,
        ...themes
      },
      updatedAt: new Date()
    };

    await this.cache.set(`lifeTheme:${birthChartId}`, updatedAnalysis, 3600);
    return updatedAnalysis;
  }
} 