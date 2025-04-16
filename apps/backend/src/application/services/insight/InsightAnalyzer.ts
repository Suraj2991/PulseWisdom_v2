import { LifeThemeService } from '../LifeThemeService';
import { TransitService } from '../TransitService';
import { logger } from '../../../shared/logger';
import { AppError } from '../../../domain/errors';
import { InsightAnalysis } from '../../../domain/types/insight.types';
import { EphemerisAdapter } from '../../../domain/adapters/ephemeris.adapters';
import { ICache } from '../../../infrastructure/cache/ICache';

interface House {
  number: number;
  cusp: number;
  nextCusp: number;
  size: number;
  rulerId: number;
}

interface Houses {
  cusps: number[];
  system: string;
}

interface PatternResult {
  aspects: Array<{
    body1Id: number;
    body2Id: number;
    type: string;
    angle: number;
    orb: number;
    isApplying: boolean;
  }>;
  houses: Array<{
    number: number;
    cusp: number;
    nextCusp: number;
    size: number;
    rulerId: number;
  }>;
}

const PLANETARY_DIGNITY = {
  rulerships: {
    0: [4, 5],    // Sun rules Leo and Aries
    1: [2, 3],    // Moon rules Cancer and Taurus
    2: [3, 6],    // Mercury rules Gemini and Virgo
    3: [2, 7],    // Venus rules Taurus and Libra
    4: [1, 8],    // Mars rules Aries and Scorpio
    5: [9, 12],   // Jupiter rules Sagittarius and Pisces
    6: [10, 11],  // Saturn rules Capricorn and Aquarius
    7: [11],      // Uranus rules Aquarius
    8: [12],      // Neptune rules Pisces
    9: [1]        // Pluto rules Aries
  } as Record<number, number[]>,
  exaltations: {
    0: [5],       // Sun exalted in Aries
    1: [2],       // Moon exalted in Taurus
    2: [6],       // Mercury exalted in Virgo
    3: [12],      // Venus exalted in Pisces
    4: [10],      // Mars exalted in Capricorn
    5: [4],       // Jupiter exalted in Leo
    6: [7],       // Saturn exalted in Libra
    7: [4],       // Uranus exalted in Leo
    8: [7],       // Neptune exalted in Libra
    9: [4]        // Pluto exalted in Leo
  } as Record<number, number[]>
};

export class InsightAnalyzer {
  constructor(
    private readonly cache: ICache,
    private readonly lifeThemeService: LifeThemeService,
    private readonly transitService: TransitService
  ) {}

  async analyzeInsights(birthChartId: string, date: Date): Promise<InsightAnalysis> {
    try {
      logger.info('Analyzing life themes and transits', { birthChartId });
      
      // Get birth chart to extract user ID
      const birthChart = await this.lifeThemeService.getBirthChart(birthChartId);
      if (!birthChart) {
        throw new AppError(`Birth chart not found for ID: ${birthChartId}`);
      }

      const [lifeThemes, transits] = await Promise.all([
        this.lifeThemeService.analyzeLifeThemes({ birthChartId }),
        this.transitService.analyzeTransits(birthChartId, EphemerisAdapter.toDateTime(date))
      ]);

      // Get planetary positions
      const planets = await this.transitService.getPlanetaryPositions(
        EphemerisAdapter.toDateTime(date),
        birthChart.location.latitude,
        birthChart.location.longitude
      );

      return {
        birthChartId,
        userId: birthChart.userId,
        content: 'Insight analysis',
        type: 'analysis',
        insights: [],
        overallSummary: '', // Will be populated by InsightGenerator
        createdAt: new Date(),
        updatedAt: new Date(),
        planets: planets.map(body => ({
          id: body.id,
          name: body.name,
          sign: body.sign,
          house: body.house,
          degree: body.longitude % 30,
          retrograde: body.speed < 0
        })),
        aspects: transits.windows.flatMap(window => window.transits.map(transit => ({
          body1Id: transit.aspectingNatal?.id || 0,
          body2Id: 0, // TODO: Get actual planet ID
          type: transit.influence,
          angle: transit.orb,
          orb: transit.orb,
          isApplying: true // TODO: Calculate if applying
        }))),
        lifeThemes,
        transits: [transits]
      };
    } catch (error) {
      logger.error('Failed to analyze insights', { error, birthChartId });
      throw new AppError('Failed to analyze insights: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  // ... rest of the analysis methods ...
} 