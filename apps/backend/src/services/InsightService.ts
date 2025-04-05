import { DateTime } from '../types/ephemeris.types';
import crypto from 'crypto';
import { Types } from 'mongoose';
import { InsightAnalysis, Insight, InsightType, InsightCategory, InsightSeverity, Dignity } from '../types/insight.types';
import { ICache } from '../infrastructure/cache/ICache';
import { EphemerisService } from './EphemerisService';
import { LifeThemeService } from './LifeThemeService';
import { NotFoundError, ValidationError } from '../types/errors';
import { IBirthChart } from '../models/BirthChart';
import { LifeThemeAnalysis } from '../types/lifeTheme.types';
import { TransitAspect, TransitWindow, TransitAnalysis } from '../types/transit.types';

interface CelestialBody {
  id: number;
  name: string;
  longitude: number;
  latitude: number;
  speed: number;
  house: number;
  sign: string;
  signLongitude: number;
}

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

export class InsightService {
  constructor(
    private cache: ICache,
    private ephemerisService: EphemerisService,
    private lifeThemeService: LifeThemeService
  ) {}

  async analyzeInsights(birthChartId: string): Promise<InsightAnalysis> {
    // Try cache first
    const cacheKey = `insights:${birthChartId}`;
    try {
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return cached as InsightAnalysis;
      }
    } catch (error) {
      console.warn('Cache get error:', error);
      // Continue without cache
    }

    // Get birth chart data
    const birthChart = await this.ephemerisService.getBirthChartById(birthChartId);
    if (!birthChart) {
      throw new NotFoundError('Birth chart not found');
    }

    // Get life themes and transits
    const [lifeThemes, transits] = await Promise.all([
      this.lifeThemeService.analyzeLifeThemes(birthChartId),
      this.ephemerisService.analyzeTransits(birthChartId, {
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        day: new Date().getDate(),
        hour: new Date().getHours(),
        minute: new Date().getMinutes(),
        second: new Date().getSeconds(),
        timezone: '0'
      })
    ]);

    // Generate insights
    const insights = [
      ...this.generateCoreIdentityInsights(birthChart),
      ...this.generateStrengthAndChallengeInsights(birthChart),
      ...this.generateLifeThemeInsights(lifeThemes),
      ...this.generatePatternInsights(birthChart),
      ...this.generateTransitInsights({
        date: {
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
          day: new Date().getDate(),
          hour: new Date().getHours(),
          minute: new Date().getMinutes(),
          second: new Date().getSeconds(),
          timezone: '0'
        },
        transits: transits.transits,
        windows: transits.windows
      })
    ];

    // Create analysis
    const analysis: InsightAnalysis = {
      birthChartId,
      userId: birthChart.userId.toString(),
      insights,
      overallSummary: this.generateOverallSummary(insights),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Try to cache the result
    try {
      await this.cache.set(cacheKey, analysis, 3600);
    } catch (error) {
      console.warn('Cache set error:', error);
      // Continue without caching
    }

    return analysis;
  }

  async getInsightsByUserId(userId: string): Promise<InsightAnalysis[]> {
    const birthCharts = await this.ephemerisService.getBirthChartsByUserId(userId);
    const analyses: InsightAnalysis[] = [];

    for (const chart of birthCharts) {
      analyses.push(await this.analyzeInsights(chart.id.toString()));
    }

    return analyses;
  }

  async getInsightsByCategory(birthChartId: string, category: InsightCategory): Promise<Insight[]> {
    const analysis = await this.analyzeInsights(birthChartId);
    return analysis.insights.filter(insight => insight.category === category);
  }

  async updateInsights(birthChartId: string, updates: Partial<InsightAnalysis>): Promise<InsightAnalysis> {
    const analysis = await this.analyzeInsights(birthChartId);
    const updatedAnalysis: InsightAnalysis = {
      ...analysis,
      ...updates,
      updatedAt: new Date()
    };

    await this.cache.set(`insights:${birthChartId}`, updatedAnalysis, 3600);
    return updatedAnalysis;
  }

  async getBirthChartInsights(birthChartId: string): Promise<Insight[]> {
    const analysis = await this.analyzeInsights(birthChartId);
    return analysis.insights.filter(insight => insight.type === InsightType.BIRTH_CHART);
  }

  async getInsightsByDateRange(
    birthChartId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Insight[]> {
    const analysis = await this.analyzeInsights(birthChartId);
    return analysis.insights.filter(insight => {
      const insightDate = insight.date;
      return insightDate >= startDate && insightDate <= endDate;
    });
  }

  async getTransitInsights(birthChartId: string): Promise<Insight[]> {
    const analysis = await this.analyzeInsights(birthChartId);
    return analysis.insights.filter(insight => insight.type === InsightType.TRANSIT);
  }

  async getLifeThemeInsights(birthChartId: string): Promise<Insight[]> {
    const analysis = await this.analyzeInsights(birthChartId);
    return analysis.insights.filter(insight => insight.type === InsightType.LIFE_THEME);
  }

  private generateCoreIdentityInsights(birthChart: IBirthChart): Insight[] {
    const insights: Insight[] = [];
    const sun = birthChart.bodies.find(b => b.id === 0);
    const moon = birthChart.bodies.find(b => b.id === 1);
    const ascendant = birthChart.angles.ascendant;

    if (sun && moon) {
      insights.push({
        id: crypto.randomUUID(),
        type: InsightType.BIRTH_CHART,
        description: this.generateCoreIdentityDescription(sun, moon, ascendant),
        category: InsightCategory.PERSONALITY,
        title: 'Core Identity',
        severity: 'high',
        aspects: [],
        houses: [],
        supportingFactors: this.getCoreIdentityStrengths(sun, moon, ascendant),
        challenges: this.getCoreIdentityChallenges(sun, moon, ascendant),
        recommendations: this.getCoreIdentityRecommendations(sun, moon, ascendant),
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return insights;
  }

  private generateStrengthAndChallengeInsights(birthChart: IBirthChart): Insight[] {
    const insights: Insight[] = [];
    
    // Analyze planetary strengths
    birthChart.bodies.forEach(body => {
      const dignity = this.calculatePlanetaryDignity(body);
      if (dignity.score > 0) {
        insights.push({
          id: crypto.randomUUID(),
          type: InsightType.PLANETARY_POSITION,
          description: this.generatePlanetaryStrengthDescription(body, dignity),
          category: InsightCategory.OPPORTUNITIES,
          title: `Planetary Strength: ${this.getPlanetName(body.id)}`,
          severity: this.getDignitySeverity(dignity.score),
          aspects: [],
          houses: [],
          supportingFactors: this.getPlanetaryStrengths(body, dignity),
          challenges: [],
          recommendations: this.getPlanetaryRecommendations(body, dignity),
          date: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          bodyId: body.id,
          dignity
        });
      }
    });

    // Analyze house strengths
    if ('cusps' in birthChart.houses) {
      birthChart.houses.cusps.forEach((cusp, index) => {
        const house = {
          number: index + 1,
          cusp,
          nextCusp: birthChart.houses.cusps[(index + 1) % 12],
          size: 30,
          rulerId: this.getHouseRuler(index + 1)
        };
        const strength = this.calculateHouseStrength(house);
        if (strength > 0) {
          insights.push({
            id: crypto.randomUUID(),
            type: InsightType.HOUSE_POSITION,
            description: this.generateHouseStrengthDescription(house, strength),
            category: InsightCategory.OPPORTUNITIES,
            title: `House Strength: ${house.number}`,
            severity: this.getHouseStrengthSeverity(strength),
            aspects: [],
            houses: [house],
            supportingFactors: this.getHouseStrengths(house, strength),
            challenges: [],
            recommendations: this.getHouseRecommendations(house, strength),
            date: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      });
    }

    return insights;
  }

  private generatePatternInsights(birthChart: IBirthChart): Insight[] {
    const insights: Insight[] = [];
    const patterns = this.identifyPatterns(birthChart);

    patterns.forEach(pattern => {
      insights.push({
        id: crypto.randomUUID(),
        type: InsightType.BIRTH_CHART,
        description: pattern.description,
        category: InsightCategory.PERSONALITY,
        title: pattern.title,
        severity: pattern.severity,
        aspects: pattern.aspects,
        houses: pattern.houses,
        supportingFactors: pattern.strengths,
        challenges: pattern.challenges,
        recommendations: pattern.recommendations,
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });

    return insights;
  }

  private identifyPatterns(birthChart: IBirthChart): Array<{
    title: string;
    description: string;
    severity: InsightSeverity;
    aspects: any[];
    houses: any[];
    strengths: string[];
    challenges: string[];
    recommendations: string[];
  }> {
    const patterns = [];

    // Grand Trine Pattern
    const grandTrine = this.findGrandTrine(birthChart);
    if (grandTrine) {
      patterns.push({
        title: 'Grand Trine Pattern',
        description: 'A harmonious triangular pattern indicating natural talents and ease in certain areas',
        severity: 'high' as InsightSeverity,
        aspects: grandTrine.aspects,
        houses: grandTrine.houses,
        strengths: ['Natural talent', 'Ease of expression', 'Flow of energy'],
        challenges: ['Potential complacency', 'Need for challenge'],
        recommendations: ['Develop talents', 'Seek growth opportunities']
      });
    }

    // T-Square Pattern
    const tSquare = this.findTSquare(birthChart);
    if (tSquare) {
      patterns.push({
        title: 'T-Square Pattern',
        description: 'A challenging pattern indicating areas of tension and potential growth',
        severity: 'medium' as InsightSeverity,
        aspects: tSquare.aspects,
        houses: tSquare.houses,
        strengths: ['Drive for achievement', 'Motivation for growth'],
        challenges: ['Internal tension', 'Need for balance'],
        recommendations: ['Work on balance', 'Channel tension constructively']
      });
    }

    // Yod Pattern
    const yod = this.findYod(birthChart);
    if (yod) {
      patterns.push({
        title: 'Yod Pattern',
        description: 'A special configuration indicating unique talents and destiny',
        severity: 'high' as InsightSeverity,
        aspects: yod.aspects,
        houses: yod.houses,
        strengths: ['Unique talents', 'Special destiny'],
        challenges: ['Pressure to fulfill potential', 'Need for focus'],
        recommendations: ['Focus on special talents', 'Trust the process']
      });
    }

    return patterns;
  }

  private findGrandTrine(birthChart: IBirthChart): PatternResult | null {
    if (!birthChart.bodies || birthChart.bodies.length < 3) {
      return null;
    }

    // Find three planets forming a trine (120° apart)
    for (let i = 0; i < birthChart.bodies.length - 2; i++) {
      for (let j = i + 1; j < birthChart.bodies.length - 1; j++) {
        for (let k = j + 1; k < birthChart.bodies.length; k++) {
          const body1 = birthChart.bodies[i];
          const body2 = birthChart.bodies[j];
          const body3 = birthChart.bodies[k];

          const angle1 = Math.abs(body1.longitude - body2.longitude);
          const angle2 = Math.abs(body2.longitude - body3.longitude);
          const angle3 = Math.abs(body3.longitude - body1.longitude);

          // Check if angles are approximately 120° (with 8° orb)
          if (Math.abs(angle1 - 120) <= 8 && 
              Math.abs(angle2 - 120) <= 8 && 
              Math.abs(angle3 - 120) <= 8) {
            return {
              aspects: [
                { body1Id: body1.id, body2Id: body2.id, type: 'trine', angle: 120, orb: Math.abs(angle1 - 120), isApplying: false },
                { body1Id: body2.id, body2Id: body3.id, type: 'trine', angle: 120, orb: Math.abs(angle2 - 120), isApplying: false },
                { body1Id: body3.id, body2Id: body1.id, type: 'trine', angle: 120, orb: Math.abs(angle3 - 120), isApplying: false }
              ],
              houses: [
                this.getHouseForBody(body1, birthChart.houses),
                this.getHouseForBody(body2, birthChart.houses),
                this.getHouseForBody(body3, birthChart.houses)
              ]
            };
          }
        }
      }
    }
    return null;
  }

  private findTSquare(birthChart: IBirthChart): PatternResult | null {
    if (!birthChart.bodies || birthChart.bodies.length < 3) {
      return null;
    }

    // Find two planets in opposition with a third planet square to both
    for (let i = 0; i < birthChart.bodies.length - 2; i++) {
      for (let j = i + 1; j < birthChart.bodies.length - 1; j++) {
        for (let k = j + 1; k < birthChart.bodies.length; k++) {
          const body1 = birthChart.bodies[i];
          const body2 = birthChart.bodies[j];
          const body3 = birthChart.bodies[k];

          // Check for opposition between two planets
          const angle12 = Math.abs(body1.longitude - body2.longitude);
          const angle13 = Math.abs(body1.longitude - body3.longitude);
          const angle23 = Math.abs(body2.longitude - body3.longitude);

          if (Math.abs(angle12 - 180) <= 8) {
            // Check if third planet is square to both
            if (Math.abs(angle13 - 90) <= 8 && Math.abs(angle23 - 90) <= 8) {
              return {
                aspects: [
                  { body1Id: body1.id, body2Id: body2.id, type: 'opposition', angle: 180, orb: Math.abs(angle12 - 180), isApplying: false },
                  { body1Id: body1.id, body2Id: body3.id, type: 'square', angle: 90, orb: Math.abs(angle13 - 90), isApplying: false },
                  { body1Id: body2.id, body2Id: body3.id, type: 'square', angle: 90, orb: Math.abs(angle23 - 90), isApplying: false }
                ],
                houses: [
                  this.getHouseForBody(body1, birthChart.houses),
                  this.getHouseForBody(body2, birthChart.houses),
                  this.getHouseForBody(body3, birthChart.houses)
                ]
              };
            }
          }
        }
      }
    }
    return null;
  }

  private findYod(birthChart: IBirthChart): PatternResult | null {
    if (!birthChart.bodies || birthChart.bodies.length < 3) {
      return null;
    }

    // Find two planets sextile to each other, both quincunx to a third planet
    for (let i = 0; i < birthChart.bodies.length - 2; i++) {
      for (let j = i + 1; j < birthChart.bodies.length - 1; j++) {
        for (let k = j + 1; k < birthChart.bodies.length; k++) {
          const body1 = birthChart.bodies[i];
          const body2 = birthChart.bodies[j];
          const body3 = birthChart.bodies[k];

          // Check for sextile between two planets
          const angle12 = Math.abs(body1.longitude - body2.longitude);
          const angle13 = Math.abs(body1.longitude - body3.longitude);
          const angle23 = Math.abs(body2.longitude - body3.longitude);

          if (Math.abs(angle12 - 60) <= 6) {
            // Check if both planets are quincunx to the third
            if (Math.abs(angle13 - 150) <= 3 && Math.abs(angle23 - 150) <= 3) {
              return {
                aspects: [
                  { body1Id: body1.id, body2Id: body2.id, type: 'sextile', angle: 60, orb: Math.abs(angle12 - 60), isApplying: false },
                  { body1Id: body1.id, body2Id: body3.id, type: 'quincunx', angle: 150, orb: Math.abs(angle13 - 150), isApplying: false },
                  { body1Id: body2.id, body2Id: body3.id, type: 'quincunx', angle: 150, orb: Math.abs(angle23 - 150), isApplying: false }
                ],
                houses: [
                  this.getHouseForBody(body1, birthChart.houses),
                  this.getHouseForBody(body2, birthChart.houses),
                  this.getHouseForBody(body3, birthChart.houses)
                ]
              };
            }
          }
        }
      }
    }
    return null;
  }

  private calculatePlanetaryDignity(body: CelestialBody): Dignity {
    if (!body || typeof body.longitude !== 'number') {
      throw new ValidationError('Invalid celestial body data');
    }

    const sign = Math.floor(body.longitude / 30) + 1;
    const planetId = body.id;
    
    const rulerships = PLANETARY_DIGNITY.rulerships[planetId] || [];
    const exaltations = PLANETARY_DIGNITY.exaltations[planetId] || [];
    
    const detriments = rulerships.map((r: number) => (r + 6) % 12 || 12);
    const falls = exaltations.map((e: number) => (e + 6) % 12 || 12);
    
    let score = 0;
    if (rulerships.includes(sign)) score += 5;
    if (exaltations.includes(sign)) score += 4;
    if (detriments.includes(sign)) score -= 5;
    if (falls.includes(sign)) score -= 4;
    
    return {
      ruler: rulerships.includes(sign),
      exaltation: exaltations.includes(sign),
      detriment: detriments.includes(sign),
      fall: falls.includes(sign),
      score
    };
  }

  private calculateHouseStrength(house: House): number {
    if (!house || typeof house.number !== 'number' || house.number < 1 || house.number > 12) {
      throw new ValidationError('Invalid house data');
    }

    let strength = 0;
    
    // Angular houses (1, 4, 7, 10) are stronger
    if ([1, 4, 7, 10].includes(house.number)) {
      strength += 2;
    }
    
    // Succedent houses (2, 5, 8, 11) have medium strength
    if ([2, 5, 8, 11].includes(house.number)) {
      strength += 1;
    }
    
    // Cadent houses (3, 6, 9, 12) are weaker
    if ([3, 6, 9, 12].includes(house.number)) {
      strength += 0.5;
    }
    
    return strength;
  }

  private generateCoreIdentityDescription(sun: any, moon: any, ascendant: number): string {
    return `Your core identity is shaped by your Sun in ${this.getSignName(sun.longitude)}, Moon in ${this.getSignName(moon.longitude)}, and Ascendant in ${this.getSignName(ascendant)}.`;
  }

  private getCoreIdentityStrengths(sun: any, moon: any, ascendant: number): string[] {
    return [
      'Natural leadership abilities',
      'Emotional intelligence',
      'Adaptability'
    ];
  }

  private getCoreIdentityChallenges(sun: any, moon: any, ascendant: number): string[] {
    return [
      'Need for balance',
      'Potential for overextension',
      'Emotional sensitivity'
    ];
  }

  private getCoreIdentityRecommendations(sun: any, moon: any, ascendant: number): string[] {
    return [
      'Develop emotional awareness',
      'Practice self-care',
      'Balance action with reflection'
    ];
  }

  private generatePlanetaryStrengthDescription(body: any, dignity: Dignity): string {
    return `Your ${this.getPlanetName(body.id)} has strong dignity in ${this.getSignName(body.longitude)}.`;
  }

  private getPlanetaryStrengths(body: any, dignity: Dignity): string[] {
    return [
      'Natural talent',
      'Strong expression',
      'Favorable conditions'
    ];
  }

  private getPlanetaryRecommendations(body: any, dignity: Dignity): string[] {
    return [
      'Develop natural talents',
      'Use strengths wisely',
      'Maintain balance'
    ];
  }

  private generateHouseStrengthDescription(house: any, strength: number): string {
    return `Your ${house.number}th house has significant strength and influence.`;
  }

  private getHouseStrengths(house: any, strength: number): string[] {
    return [
      'Strong foundation',
      'Natural abilities',
      'Favorable conditions'
    ];
  }

  private getHouseRecommendations(house: any, strength: number): string[] {
    return [
      'Develop house themes',
      'Use strengths constructively',
      'Maintain balance'
    ];
  }

  private getDignitySeverity(score: number): InsightSeverity {
    if (score >= 5) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  }

  private getHouseStrengthSeverity(strength: number): InsightSeverity {
    if (strength >= 5) return 'high';
    if (strength >= 3) return 'medium';
    return 'low';
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

  private generateLifeThemeInsights(lifeThemes: LifeThemeAnalysis): Insight[] {
    const insights: Insight[] = [];

    // Core identity insight
    insights.push({
      id: crypto.randomUUID(),
      type: InsightType.LIFE_THEME,
      description: lifeThemes.themes.coreIdentity.description,
      category: InsightCategory.PERSONALITY,
      title: 'Core Identity',
      severity: 'high',
      aspects: [],
      houses: [],
      supportingFactors: [],
      challenges: [],
      recommendations: [],
      date: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Strengths as opportunities
    lifeThemes.themes.strengths.forEach(strength => {
      insights.push({
        id: crypto.randomUUID(),
        type: InsightType.LIFE_THEME,
        description: strength.description,
        category: InsightCategory.OPPORTUNITIES,
        title: `Strength: ${strength.area}`,
        severity: 'high',
        aspects: [],
        houses: [],
        supportingFactors: strength.supportingAspects,
        challenges: [],
        recommendations: [],
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });

    // Challenges
    lifeThemes.themes.challenges.forEach(challenge => {
      insights.push({
        id: crypto.randomUUID(),
        type: InsightType.LIFE_THEME,
        description: challenge.description,
        category: InsightCategory.CHALLENGES,
        title: `Challenge: ${challenge.area}`,
        severity: 'medium',
        aspects: [],
        houses: [],
        supportingFactors: [],
        challenges: challenge.growthOpportunities,
        recommendations: [],
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });

    return insights;
  }

  private generateTransitInsights(transitAnalysis: TransitAnalysis): Insight[] {
    const insights: Insight[] = [];

    // Transit aspects insights
    transitAnalysis.transits.forEach(transit => {
      insights.push({
        id: crypto.randomUUID(),
        type: InsightType.TRANSIT,
        description: `${transit.aspectType} aspect with ${transit.orb}° orb`,
        category: InsightCategory.OPPORTUNITIES,
        title: `Transit: ${transit.transitPlanet} to ${transit.natalPlanet}`,
        severity: transit.strength as InsightSeverity,
        aspects: [{
          body1Id: 0, // TODO: Map planet names to IDs
          body2Id: 0,
          type: transit.aspectType,
          angle: transit.angle,
          orb: transit.orb,
          isApplying: transit.isApplying
        }],
        houses: [],
        supportingFactors: [],
        challenges: [],
        recommendations: [],
        date: new Date(transitAnalysis.date.year, transitAnalysis.date.month - 1, transitAnalysis.date.day),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });

    // Transit windows insights
    transitAnalysis.windows.forEach(window => {
      const startDateTime = {
        year: window.startDate.year,
        month: window.startDate.month,
        day: window.startDate.day,
        hour: window.startDate.hour,
        minute: window.startDate.minute,
        second: window.startDate.second,
        timezone: window.startDate.timezone
      };
      const endDateTime = {
        year: window.endDate.year,
        month: window.endDate.month,
        day: window.endDate.day,
        hour: window.endDate.hour,
        minute: window.endDate.minute,
        second: window.endDate.second,
        timezone: window.endDate.timezone
      };
      insights.push({
        id: crypto.randomUUID(),
        type: InsightType.TRANSIT,
        description: window.description,
        category: InsightCategory.OPPORTUNITIES,
        title: `Transit Window: ${window.transitPlanet} ${window.aspectType} ${window.natalPlanet}`,
        severity: window.strength as InsightSeverity,
        aspects: [],
        houses: [],
        supportingFactors: [],
        challenges: [],
        recommendations: window.recommendations,
        date: new Date(startDateTime.year, startDateTime.month - 1, startDateTime.day),
        dateRange: {
          start: startDateTime,
          end: endDateTime
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });

    return insights;
  }

  private generateOverallSummary(insights: Insight[]): string {
    const highSeverityInsights = insights.filter(i => i.severity === 'high');
    const opportunities = insights.filter(i => i.category === InsightCategory.OPPORTUNITIES);
    const challenges = insights.filter(i => i.category === InsightCategory.CHALLENGES);

    return `Analysis reveals ${highSeverityInsights.length} significant insights, with ${opportunities.length} opportunities and ${challenges.length} challenges.`;
  }

  private getHouseRuler(houseNumber: number): number {
    const rulers: Record<number, number> = {
      1: 4,  // Mars rules Aries
      2: 3,  // Venus rules Taurus
      3: 2,  // Mercury rules Gemini
      4: 1,  // Moon rules Cancer
      5: 0,  // Sun rules Leo
      6: 2,  // Mercury rules Virgo
      7: 3,  // Venus rules Libra
      8: 4,  // Mars rules Scorpio
      9: 5,  // Jupiter rules Sagittarius
      10: 6, // Saturn rules Capricorn
      11: 7, // Uranus rules Aquarius
      12: 8  // Neptune rules Pisces
    };
    return rulers[houseNumber] || -1;
  }

  private getHouseForBody(body: CelestialBody, houses: Houses): House {
    if (!houses || !houses.cusps || !Array.isArray(houses.cusps) || houses.cusps.length !== 12) {
      throw new ValidationError('Invalid houses data');
    }

    if (!body || typeof body.longitude !== 'number') {
      throw new ValidationError('Invalid celestial body data');
    }

    const longitude = body.longitude;
    let houseNumber = 1;

    for (let i = 0; i < houses.cusps.length; i++) {
      const currentCusp = houses.cusps[i];
      const nextCusp = houses.cusps[(i + 1) % 12];

      if (nextCusp < currentCusp) {
        if (longitude >= currentCusp || longitude < nextCusp) {
          houseNumber = i + 1;
          break;
        }
      } else {
        if (longitude >= currentCusp && longitude < nextCusp) {
          houseNumber = i + 1;
          break;
        }
      }
    }

    return {
      number: houseNumber,
      cusp: houses.cusps[houseNumber - 1],
      nextCusp: houses.cusps[houseNumber % 12],
      size: 30,
      rulerId: this.getHouseRuler(houseNumber)
    };
  }
} 