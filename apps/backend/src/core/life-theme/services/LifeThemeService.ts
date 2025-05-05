import { ICache } from '../../../infrastructure/cache/ICache';
import { LifeTheme
  , validateLifeThemeRequest
  , LifeThemeModel
  , LifeThemeKey
  , ThemeCategory
  , LifeArea
  , ThemeMetadata
  , LifeThemeAnalysis
 } from '../../life-theme';
import { InsightCategory } from '../../insight/types/insight.types';
import { NotFoundError, AppError } from '../../../domain/errors';
import { AIService } from '../../ai';
import { BirthChartService, BirthChartDocument } from '../../birthchart';
import { logger } from '../../../shared/logger';
import { AspectService, BirthChart, CelestialBodyService } from '../../ephemeris';
import { ObjectId } from 'mongodb';
import { AstrologyUtils } from '../../../shared/utils/astrology';
import { adaptBirthChartData } from '../../birthchart/adapters/BirthChart.adapters';


interface LifeThemeRequest {
  birthChartId: string;
}

export class LifeThemeService {
  private readonly CACHE_PREFIX = 'life-theme:';
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor(
    private readonly cache: ICache,
    private readonly birthChartService: BirthChartService,
    private readonly aiService: AIService,
    private readonly celestialBodyService: CelestialBodyService,
    private readonly aspectService: AspectService
  ) {}

  private async cacheAnalysis(birthChartId: string, analysis: LifeThemeAnalysis): Promise<void> {
    try {
      const cacheKey = `${this.CACHE_PREFIX}${birthChartId}`;
      await this.cache.set(cacheKey, analysis, this.CACHE_TTL);
      this.logDebug('Cached life themes', { birthChartId });
    } catch (error) {
      this.logError('Cache set error', error, { birthChartId });
    }
  }

  private logInfo(message: string, context: Record<string, unknown>): void {
    logger.info(message, context);
  }

  private logDebug(message: string, context: Record<string, unknown>): void {
    logger.debug(message, context);
  }

  private logError(message: string, error: unknown, context: Record<string, unknown>): void {
    logger.error(message, { error, ...context });
  }

  private handleError(message: string, error: unknown, context: Record<string, unknown>): never {
    logger.error(message, { error, ...context });
    throw new AppError(`${message}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  async getBirthChart(birthChartId: string): Promise<BirthChartDocument> {
    try {
      this.logInfo('Getting birth chart', { birthChartId });
      const birthChart = await this.birthChartService.getBirthChartById(birthChartId);
      if (!birthChart) {
        throw new NotFoundError('Birth chart not found');
      }
      return birthChart;
    } catch (error) {
      this.handleError('Failed to get birth chart', error, { birthChartId });
    }
  }

  async analyzeLifeThemes(input: LifeThemeRequest): Promise<LifeTheme[]> {
    validateLifeThemeRequest(input);

    try {
      this.logInfo('Analyzing life themes', { birthChartId: input.birthChartId });
      const birthChart = await this.getBirthChart(input.birthChartId);
      return await this.generateLifeThemes(birthChart);
    } catch (error) {
      this.handleError('Failed to analyze life themes', error, { birthChartId: input.birthChartId });
    }
  }

  private async generateLifeThemes(birthChart: BirthChartDocument): Promise<LifeTheme[]> {
    try {
      this.logInfo('Starting life theme generation', { birthChartId: birthChart._id.toString() });
      
      const themes: LifeTheme[] = [];
      const now = new Date();

      // Check for Chiron themes
      if (this.hasChironWoundTheme(birthChart)) {
        const metadata = await this.getThemeMetadata(LifeThemeKey.HEALING_JOURNEY);
        themes.push({
          id: new ObjectId().toString(),
          key: LifeThemeKey.HEALING_JOURNEY,
          title: 'Healing Journey',
          description: 'You are being called to heal deep wounds and transform pain into wisdom.',
          metadata: metadata || {
            requiresUserAction: true,
            associatedPlanets: ['Chiron', 'Neptune'],
            lifeAreas: [LifeArea.HEALTH, LifeArea.EMOTIONAL],
            category: ThemeCategory.HEALING,
            intensity: 'high',
            duration: 'medium'
          },
          birthChartId: birthChart._id.toString(),
          userId: birthChart.userId,
          createdAt: now,
          updatedAt: now,
          isActive: true,
          insights: [],
          supportingAspects: birthChart.aspects.filter(aspect => 
            aspect.body1 === 'Chiron' || aspect.body2 === 'Chiron'
          )
        });
      }

      // Check for Node themes
      if (this.hasNodePathTension(birthChart)) {
        const metadata = await this.getThemeMetadata(LifeThemeKey.KARMIC_LESSONS);
        themes.push({
          id: new ObjectId().toString(),
          key: LifeThemeKey.KARMIC_LESSONS,
          title: 'Karmic Lessons',
          description: 'You are working through significant karmic patterns and soul lessons.',
          metadata: metadata || {
            requiresUserAction: true,
            associatedPlanets: ['Saturn', 'Ketu'],
            lifeAreas: [LifeArea.CAREER, LifeArea.RELATIONSHIPS],
            category: ThemeCategory.KARMIC,
            intensity: 'medium',
            duration: 'long'
          },
          birthChartId: birthChart._id.toString(),
          userId: birthChart.userId,
          createdAt: now,
          updatedAt: now,
          isActive: true,
          insights: [],
          supportingAspects: birthChart.aspects.filter(aspect => 
            aspect.body1.includes('Node') || aspect.body2.includes('Node')
          )
        });
      }

      // Add Spiritual Gifts theme if positive aspects are present
      if (this.hasPositiveAspects(birthChart)) {
        const metadata = await this.getThemeMetadata(LifeThemeKey.SPIRITUAL_GIFTS);
        themes.push({
          id: new ObjectId().toString(),
          key: LifeThemeKey.SPIRITUAL_GIFTS,
          title: 'Spiritual Gifts',
          description: 'You possess natural spiritual gifts and talents that can be developed and shared.',
          metadata: metadata || {
            requiresUserAction: false,
            associatedPlanets: ['Jupiter', 'Neptune'],
            lifeAreas: [LifeArea.SPIRITUALITY, LifeArea.CREATIVITY],
            category: ThemeCategory.STRENGTHS,
            intensity: 'medium',
            duration: 'long'
          },
          birthChartId: birthChart._id.toString(),
          userId: birthChart.userId,
          createdAt: now,
          updatedAt: now,
          isActive: true,
          insights: [],
          supportingAspects: birthChart.aspects.filter(aspect => 
            ['trine', 'sextile', 'conjunction'].includes(aspect.type)
          )
        });
      }

      // Add Creative Expression theme
      if (this.hasCreativeAspects(birthChart)) {
        const metadata = await this.getThemeMetadata(LifeThemeKey.CREATIVE_EXPRESSION);
        themes.push({
          id: new ObjectId().toString(),
          key: LifeThemeKey.CREATIVE_EXPRESSION,
          title: 'Creative Expression',
          description: 'You have a natural gift for creative expression and artistic pursuits.',
          metadata: metadata || {
            requiresUserAction: false,
            associatedPlanets: ['Venus', 'Neptune', 'Moon'],
            lifeAreas: [LifeArea.CREATIVITY, LifeArea.SPIRITUALITY],
            category: ThemeCategory.STRENGTHS,
            intensity: 'medium',
            duration: 'long'
          },
          birthChartId: birthChart._id.toString(),
          userId: birthChart.userId,
          createdAt: now,
          updatedAt: now,
          isActive: true,
          insights: [],
          supportingAspects: birthChart.aspects.filter(aspect => 
            ['Venus', 'Neptune', 'Moon'].includes(aspect.body1) &&
            ['Venus', 'Neptune', 'Moon'].includes(aspect.body2)
          )
        });
      }

      // Add Intuitive Abilities theme
      if (this.hasIntuitiveAspects(birthChart)) {
        const metadata = await this.getThemeMetadata(LifeThemeKey.SPIRITUAL_AWAKENING);
        themes.push({
          id: new ObjectId().toString(),
          key: LifeThemeKey.SPIRITUAL_AWAKENING,
          title: 'Intuitive Abilities',
          description: 'You possess strong intuitive abilities and spiritual sensitivity.',
          metadata: metadata || {
            requiresUserAction: false,
            associatedPlanets: ['Moon', 'Neptune', 'Mercury'],
            lifeAreas: [LifeArea.SPIRITUALITY, LifeArea.EMOTIONAL],
            category: ThemeCategory.STRENGTHS,
            intensity: 'medium',
            duration: 'long'
          },
          birthChartId: birthChart._id.toString(),
          userId: birthChart.userId,
          createdAt: now,
          updatedAt: now,
          isActive: true,
          insights: [],
          supportingAspects: birthChart.aspects.filter(aspect => 
            ['Moon', 'Neptune', 'Mercury'].includes(aspect.body1) &&
            ['Moon', 'Neptune', 'Mercury'].includes(aspect.body2)
          )
        });
      }

      // Add Natural Talents theme
      if (this.hasNaturalTalents(birthChart)) {
        const metadata = await this.getThemeMetadata(LifeThemeKey.NATURAL_TALENTS);
        themes.push({
          id: new ObjectId().toString(),
          key: LifeThemeKey.NATURAL_TALENTS,
          title: 'Natural Talents',
          description: 'You have innate talents and abilities that come naturally to you.',
          metadata: metadata || {
            requiresUserAction: false,
            associatedPlanets: ['Mercury', 'Venus', 'Jupiter'],
            lifeAreas: [LifeArea.CAREER, LifeArea.CREATIVITY],
            category: ThemeCategory.STRENGTHS,
            intensity: 'medium',
            duration: 'long'
          },
          birthChartId: birthChart._id.toString(),
          userId: birthChart.userId,
          createdAt: now,
          updatedAt: now,
          isActive: true,
          insights: [],
          supportingAspects: birthChart.aspects.filter(aspect => 
            ['Mercury', 'Venus', 'Jupiter'].includes(aspect.body1) &&
            ['Mercury', 'Venus', 'Jupiter'].includes(aspect.body2)
          )
        });
      }

      // Add Leadership Potential theme
      if (this.hasLeadershipAspects(birthChart)) {
        const metadata = await this.getThemeMetadata(LifeThemeKey.LIFE_PURPOSE);
        themes.push({
          id: new ObjectId().toString(),
          key: LifeThemeKey.LIFE_PURPOSE,
          title: 'Leadership Potential',
          description: 'You have natural leadership abilities and the potential to inspire others.',
          metadata: metadata || {
            requiresUserAction: false,
            associatedPlanets: ['Sun', 'Mars', 'Jupiter'],
            lifeAreas: [LifeArea.CAREER, LifeArea.RELATIONSHIPS],
            category: ThemeCategory.STRENGTHS,
            intensity: 'high',
            duration: 'long'
          },
          birthChartId: birthChart._id.toString(),
          userId: birthChart.userId,
          createdAt: now,
          updatedAt: now,
          isActive: true,
          insights: [],
          supportingAspects: birthChart.aspects.filter(aspect => 
            ['Sun', 'Mars', 'Jupiter'].includes(aspect.body1) &&
            ['Sun', 'Mars', 'Jupiter'].includes(aspect.body2)
          )
        });
      }

      // Add Healing Abilities theme
      if (this.hasHealingAspects(birthChart)) {
        const metadata = await this.getThemeMetadata(LifeThemeKey.SPIRITUAL_HEALING);
        themes.push({
          id: new ObjectId().toString(),
          key: LifeThemeKey.SPIRITUAL_HEALING,
          title: 'Healing Abilities',
          description: 'You have natural healing abilities and the capacity to help others transform.',
          metadata: metadata || {
            requiresUserAction: false,
            associatedPlanets: ['Chiron', 'Neptune', 'Moon'],
            lifeAreas: [LifeArea.HEALTH, LifeArea.SPIRITUALITY],
            category: ThemeCategory.STRENGTHS,
            intensity: 'medium',
            duration: 'long'
          },
          birthChartId: birthChart._id.toString(),
          userId: birthChart.userId,
          createdAt: now,
          updatedAt: now,
          isActive: true,
          insights: [],
          supportingAspects: birthChart.aspects.filter(aspect => 
            ['Chiron', 'Neptune', 'Moon'].includes(aspect.body1) &&
            ['Chiron', 'Neptune', 'Moon'].includes(aspect.body2)
          )
        });
      }

      // Add Communication Skills theme
      if (this.hasCommunicationAspects(birthChart)) {
        const metadata = await this.getThemeMetadata(LifeThemeKey.RELATIONSHIP_GROWTH);
        themes.push({
          id: new ObjectId().toString(),
          key: LifeThemeKey.RELATIONSHIP_GROWTH,
          title: 'Communication Skills',
          description: 'You have exceptional communication abilities and the gift of connecting with others.',
          metadata: metadata || {
            requiresUserAction: false,
            associatedPlanets: ['Mercury', 'Venus', 'Jupiter'],
            lifeAreas: [LifeArea.RELATIONSHIPS, LifeArea.CAREER],
            category: ThemeCategory.STRENGTHS,
            intensity: 'medium',
            duration: 'long'
          },
          birthChartId: birthChart._id.toString(),
          userId: birthChart.userId,
          createdAt: now,
          updatedAt: now,
          isActive: true,
          insights: [],
          supportingAspects: birthChart.aspects.filter(aspect => 
            ['Mercury', 'Venus', 'Jupiter'].includes(aspect.body1) &&
            ['Mercury', 'Venus', 'Jupiter'].includes(aspect.body2)
          )
        });
      }

      // Add Financial Abundance theme
      if (this.hasFinancialAspects(birthChart)) {
        const metadata = await this.getThemeMetadata(LifeThemeKey.CAREER_EVOLUTION);
        themes.push({
          id: new ObjectId().toString(),
          key: LifeThemeKey.CAREER_EVOLUTION,
          title: 'Financial Abundance',
          description: 'You have the potential for financial success and material abundance.',
          metadata: metadata || {
            requiresUserAction: false,
            associatedPlanets: ['Venus', 'Jupiter', 'Saturn'],
            lifeAreas: [LifeArea.CAREER, LifeArea.RELATIONSHIPS],
            category: ThemeCategory.STRENGTHS,
            intensity: 'high',
            duration: 'long'
          },
          birthChartId: birthChart._id.toString(),
          userId: birthChart.userId,
          createdAt: now,
          updatedAt: now,
          isActive: true,
          insights: [],
          supportingAspects: birthChart.aspects.filter(aspect => 
            ['Venus', 'Jupiter', 'Saturn'].includes(aspect.body1) &&
            ['Venus', 'Jupiter', 'Saturn'].includes(aspect.body2)
          )
        });
      }

      // Add Emotional Intelligence theme
      if (this.hasEmotionalIntelligenceAspects(birthChart)) {
        const metadata = await this.getThemeMetadata(LifeThemeKey.RELATIONSHIP_GROWTH);
        themes.push({
          id: new ObjectId().toString(),
          key: LifeThemeKey.RELATIONSHIP_GROWTH,
          title: 'Emotional Intelligence',
          description: 'You have a natural understanding of emotions and strong interpersonal skills.',
          metadata: metadata || {
            requiresUserAction: false,
            associatedPlanets: ['Moon', 'Venus', 'Mercury'],
            lifeAreas: [LifeArea.RELATIONSHIPS, LifeArea.EMOTIONAL],
            category: ThemeCategory.STRENGTHS,
            intensity: 'medium',
            duration: 'long'
          },
          birthChartId: birthChart._id.toString(),
          userId: birthChart.userId,
          createdAt: now,
          updatedAt: now,
          isActive: true,
          insights: [],
          supportingAspects: birthChart.aspects.filter(aspect => 
            ['Moon', 'Venus', 'Mercury'].includes(aspect.body1) &&
            ['Moon', 'Venus', 'Mercury'].includes(aspect.body2)
          )
        });
      }

      // Add Spiritual Wisdom theme
      if (this.hasSpiritualWisdomAspects(birthChart)) {
        const metadata = await this.getThemeMetadata(LifeThemeKey.SPIRITUAL_AWAKENING);
        themes.push({
          id: new ObjectId().toString(),
          key: LifeThemeKey.SPIRITUAL_AWAKENING,
          title: 'Spiritual Wisdom',
          description: 'You possess deep spiritual wisdom and the ability to guide others.',
          metadata: metadata || {
            requiresUserAction: false,
            associatedPlanets: ['Jupiter', 'Neptune', 'Saturn'],
            lifeAreas: [LifeArea.SPIRITUALITY, LifeArea.RELATIONSHIPS],
            category: ThemeCategory.STRENGTHS,
            intensity: 'high',
            duration: 'long'
          },
          birthChartId: birthChart._id.toString(),
          userId: birthChart.userId,
          createdAt: now,
          updatedAt: now,
          isActive: true,
          insights: [],
          supportingAspects: birthChart.aspects.filter(aspect => 
            ['Jupiter', 'Neptune', 'Saturn'].includes(aspect.body1) &&
            ['Jupiter', 'Neptune', 'Saturn'].includes(aspect.body2)
          )
        });
      }

      this.logInfo('Completed life theme generation', { 
        birthChartId: birthChart._id.toString(),
        themeCount: themes.length 
      });
      
      return themes;
    } catch (error) {
      this.handleError('Failed to generate life themes', error, { birthChartId: birthChart._id.toString() });
    }
  }

  private hasChironWoundTheme(chart: BirthChartDocument): boolean {
    const chiron = chart.bodies.find(body => body.name === 'Chiron');
    if (!chiron) return false;

    // Check for Chiron aspects to personal planets
    const personalPlanets = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars'];
    const chironAspects = chart.aspects.filter(aspect => 
      (aspect.body1 === 'Chiron' && personalPlanets.includes(aspect.body2)) ||
      (aspect.body2 === 'Chiron' && personalPlanets.includes(aspect.body1))
    );

    // Check for Chiron in challenging houses (4th, 8th, 12th)
    const challengingHouses = [4, 8, 12];
    const hasChallengingPlacement = challengingHouses.includes(chiron.house);

    return chironAspects.length > 0 || hasChallengingPlacement;
  }

  private hasNodePathTension(chart: BirthChartDocument): boolean {
    const northNode = chart.bodies.find(body => body.name === 'North Node');
    const southNode = chart.bodies.find(body => body.name === 'South Node');
    if (!northNode || !southNode) return false;

    // Check for challenging aspects to nodes
    return chart.aspects.some(aspect => {
      const body1 = chart.bodies.find(b => b.name === aspect.body1);
      const body2 = chart.bodies.find(b => b.name === aspect.body2);
      if (!body1 || !body2) return false;
      
      return (this.aspectService.isAspectApplying(body1, northNode, aspect.type as 'conjunction' | 'opposition' | 'square' | 'trine' | 'sextile' | 'semiSquare' | 'sesquisquare' | 'quincunx' | 'semiSextile') || 
              this.aspectService.isAspectApplying(body2, northNode, aspect.type as 'conjunction' | 'opposition' | 'square' | 'trine' | 'sextile' | 'semiSquare' | 'sesquisquare' | 'quincunx' | 'semiSextile')) &&
             ['Saturn', 'Pluto', 'Uranus'].includes(body1.name);
    });
  }

  private hasPositiveAspects(chart: BirthChartDocument): boolean {
    const positiveAspects = chart.aspects.filter(aspect => 
      ['trine', 'sextile', 'conjunction'].includes(aspect.type) &&
      !['Saturn', 'Pluto', 'Uranus'].includes(aspect.body1) &&
      !['Saturn', 'Pluto', 'Uranus'].includes(aspect.body2)
    );
    return positiveAspects.length > 0;
  }

  private hasCreativeAspects(chart: BirthChartDocument): boolean {
    const creativePlanets = ['Venus', 'Neptune', 'Moon'];
    return chart.aspects.some(aspect => 
      ['trine', 'sextile', 'conjunction'].includes(aspect.type) &&
      creativePlanets.includes(aspect.body1) &&
      creativePlanets.includes(aspect.body2)
    );
  }

  private hasIntuitiveAspects(chart: BirthChartDocument): boolean {
    const intuitivePlanets = ['Moon', 'Neptune', 'Mercury'];
    return chart.aspects.some(aspect => 
      ['trine', 'sextile', 'conjunction'].includes(aspect.type) &&
      intuitivePlanets.includes(aspect.body1) &&
      intuitivePlanets.includes(aspect.body2)
    );
  }

  private hasNaturalTalents(chart: BirthChartDocument): boolean {
    const talentPlanets = ['Mercury', 'Venus', 'Jupiter'];
    return chart.aspects.some(aspect => 
      ['trine', 'sextile', 'conjunction'].includes(aspect.type) &&
      talentPlanets.includes(aspect.body1) &&
      talentPlanets.includes(aspect.body2)
    );
  }

  private hasLeadershipAspects(chart: BirthChartDocument): boolean {
    const leadershipPlanets = ['Sun', 'Mars', 'Jupiter'];
    return chart.aspects.some(aspect => 
      ['trine', 'sextile', 'conjunction'].includes(aspect.type) &&
      leadershipPlanets.includes(aspect.body1) &&
      leadershipPlanets.includes(aspect.body2)
    );
  }

  private hasHealingAspects(chart: BirthChartDocument): boolean {
    const healingPlanets = ['Chiron', 'Neptune', 'Moon'];
    return chart.aspects.some(aspect => 
      ['trine', 'sextile', 'conjunction'].includes(aspect.type) &&
      healingPlanets.includes(aspect.body1) &&
      healingPlanets.includes(aspect.body2)
    );
  }

  private hasCommunicationAspects(chart: BirthChartDocument): boolean {
    const communicationPlanets = ['Mercury', 'Venus', 'Jupiter'];
    return chart.aspects.some(aspect => 
      ['trine', 'sextile', 'conjunction'].includes(aspect.type) &&
      communicationPlanets.includes(aspect.body1) &&
      communicationPlanets.includes(aspect.body2)
    );
  }

  private hasFinancialAspects(chart: BirthChartDocument): boolean {
    const financialPlanets = ['Venus', 'Jupiter', 'Saturn'];
    return chart.aspects.some(aspect => 
      ['trine', 'sextile', 'conjunction'].includes(aspect.type) &&
      financialPlanets.includes(aspect.body1) &&
      financialPlanets.includes(aspect.body2)
    );
  }

  private hasEmotionalIntelligenceAspects(chart: BirthChartDocument): boolean {
    const emotionalPlanets = ['Moon', 'Venus', 'Mercury'];
    return chart.aspects.some(aspect => 
      ['trine', 'sextile', 'conjunction'].includes(aspect.type) &&
      emotionalPlanets.includes(aspect.body1) &&
      emotionalPlanets.includes(aspect.body2)
    );
  }

  private hasSpiritualWisdomAspects(chart: BirthChartDocument): boolean {
    const spiritualPlanets = ['Jupiter', 'Neptune', 'Saturn'];
    return chart.aspects.some(aspect => 
      ['trine', 'sextile', 'conjunction'].includes(aspect.type) &&
      spiritualPlanets.includes(aspect.body1) &&
      spiritualPlanets.includes(aspect.body2)
    );
  }

  private async generateLifeThemeInsights(birthChart: BirthChartDocument, birthChartId: string): Promise<string> {
    try {
      this.logInfo('Starting life theme insight generation', { birthChartId });
      
      const themes = await this.generateLifeThemes(birthChart);
      const results = await Promise.all(
        themes.map(theme => this.aiService.generateLifeThemeInsight(theme))
      );
      
      // Update each theme with its generated insight and save to database
      const updatedThemes = await Promise.all(
        themes.map((theme, index) => {
          theme.insights.push(results[index].insight);
          return LifeThemeModel.update(theme.id, { insights: theme.insights });
        })
      );
      
      this.logInfo('Completed life theme insight generation', { 
        birthChartId,
        themeCount: updatedThemes.length 
      });
      
      return updatedThemes.map(theme => theme.insights[theme.insights.length - 1]).join('\n\n');
    } catch (error) {
      this.handleError('Failed to generate life theme insights', error, { birthChartId });
    }
  }

  private getSignName(longitude: number): string {
    return AstrologyUtils.getSignName(longitude);
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
    try {
      const birthCharts = await this.birthChartService.getBirthChartsByUserId(userId);
      return this.analyzeThemesForBirthCharts(birthCharts);
    } catch (error) {
      this.handleError('Failed to get life themes by user ID', error, { userId });
    }
  }

  private async analyzeThemesForBirthCharts(birthCharts: BirthChartDocument[]): Promise<LifeThemeAnalysis[]> {
    return Promise.all(
      birthCharts.map(chart => {
        const convertedChart = adaptBirthChartData(chart);
        return this.createThemeAnalysis(convertedChart, chart);
      })
    );
  }

  private async createThemeAnalysis(chart: BirthChart, originalChart: BirthChartDocument): Promise<LifeThemeAnalysis> {
    return {
      birthChartId: originalChart._id.toString(),
      userId: originalChart.userId,
      themes: await this.analyzeLifeThemes({ birthChartId: originalChart._id.toString() }),
      createdAt: originalChart.createdAt,
      updatedAt: originalChart.updatedAt
    };
  }

  async updateLifeThemes(birthChartId: string, updates: Partial<LifeThemeAnalysis>): Promise<LifeThemeAnalysis> {
    try {
      const [themes, birthChart] = await this.getThemesAndBirthChart(birthChartId);
      const updatedAnalysis = await this.createUpdatedAnalysis(birthChart, themes, updates);
      await this.cacheAnalysis(birthChartId, updatedAnalysis);
      return updatedAnalysis;
    } catch (error) {
      this.handleError('Failed to update life themes', error, { birthChartId });
    }
  }

  private async getThemesAndBirthChart(birthChartId: string): Promise<[LifeTheme[], BirthChartDocument]> {
    const themes = await this.analyzeLifeThemes({ birthChartId });
    const birthChart = await this.birthChartService.getBirthChartById(birthChartId);
    
    if (!birthChart) {
      throw new NotFoundError('Birth chart not found');
    }
    
    return [themes, birthChart];
  }

  private async createUpdatedAnalysis(
    birthChart: BirthChartDocument,
    themes: LifeTheme[],
    updates: Partial<LifeThemeAnalysis>
  ): Promise<LifeThemeAnalysis> {
    return {
      birthChartId: birthChart._id.toString(),
      userId: birthChart.userId,
      themes,
      createdAt: birthChart.createdAt,
      updatedAt: new Date(),
      ...updates
    };
  }

  async getThemeMetadata(key: LifeThemeKey): Promise<ThemeMetadata | null> {
    const theme = await LifeThemeModel.find({ key });
    return theme[0]?.metadata || null;
  }
}