import { BaseInsightGenerator } from './BaseInsightGenerator';
import { InsightAnalysis, ThemeForecastInsight, InsightType, InsightCategory, InsightSeverity } from '../types/insight.types';
import { AIService, PromptBuilder } from '../../ai';
import { logger } from '../../../shared/logger';
import { ServiceError } from '../../../domain/errors';
import { LifeTheme, LifeThemeKey, ThemeCategory, LifeArea } from '../../life-theme';

export class ThemeForecastInsightGenerator extends BaseInsightGenerator<ThemeForecastInsight> {
  constructor(
    private readonly aiService: AIService,
    private readonly promptBuilder: PromptBuilder
  ) {
    super(InsightType.THEME_FORECAST);
  }

  async generate(analysis: InsightAnalysis): Promise<ThemeForecastInsight[]> {
    try {
      const insights: ThemeForecastInsight[] = [];
      
      if (!analysis.birthChart || !analysis.transits || !analysis.themes) {
        logger.warn('Missing required data for theme forecast generation', {
          hasBirthChart: !!analysis.birthChart,
          hasTransits: !!analysis.transits,
          hasThemes: !!analysis.themes
        });
        return insights;
      }

      const startDate = new Date();
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

      // Convert themes to LifeTheme objects
      const themes = analysis.themes.map(theme => {
        // Determine the theme key based on the provided key or infer from title/description
        const themeKey = theme.themeKey || this.inferThemeKey(theme.title, theme.description);
        
        // Infer life areas from theme content
        const lifeAreas = this.inferLifeAreas(theme.title, theme.description);

        // Infer theme category based on key and content
        const category = this.inferThemeCategory(themeKey, theme.title, theme.description);
        
        return {
          id: theme.id,
          key: themeKey,
          title: theme.title,
          description: theme.description,
          metadata: {
            requiresUserAction: false,
            associatedPlanets: [],
            lifeAreas,
            category,
            intensity: theme.impact === InsightSeverity.HIGH ? 'high' : 
                      theme.impact === InsightSeverity.MEDIUM ? 'medium' : 'low',
            duration: 'medium'
          },
          birthChartId: analysis.birthChartId,
          userId: analysis.userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
          insights: [],
          supportingAspects: []
        };
      }) as LifeTheme[];

      // Generate theme forecast using AI service
      const { insight: forecastInsight, log: insightLog } = await this.aiService.generateThemeForecast(
        analysis.birthChart,
        themes,
        analysis.transits
      );

      const baseInsight = this.createBaseInsight(
        forecastInsight,
        InsightCategory.THEME_GUIDANCE,
        InsightSeverity.MEDIUM
      );

      const insight: ThemeForecastInsight = {
        ...baseInsight,
        type: this.type,
        forecastPeriod: {
          start: startDate,
          end: endDate
        },
        themes: analysis.themes?.map(theme => ({
          id: theme.id,
          title: theme.title,
          description: theme.description,
          probability: theme.probability || 0.5,
          impact: theme.impact || InsightSeverity.MEDIUM
        })) || [],
        supportingFactors: analysis.supportingFactors || [],
        challenges: analysis.challenges || [],
        recommendations: analysis.recommendations || [],
        generationMetadata: {
          promptTokens: insightLog.promptTokens || 0,
          completionTokens: insightLog.completionTokens || 0,
          totalTokens: insightLog.totalTokens || 0,
          generationTime: insightLog.generationTime || 0
        }
      };

      insights.push(insight);
      this.logGeneration(analysis, insights.length);
      return insights;
    } catch (error) {
      logger.error('Failed to generate theme forecast', { error });
      throw new ServiceError(`Failed to generate theme forecast: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private inferLifeAreas(title: string, description: string): LifeArea[] {
    const titleLower = title.toLowerCase();
    const descLower = description.toLowerCase();
    const areas: Set<LifeArea> = new Set();

    // Career and Work
    if (this.containsAny(titleLower, descLower, ['career', 'work', 'job', 'profession', 'business', 'vocation'])) {
      areas.add(LifeArea.CAREER);
    }

    // Relationships
    if (this.containsAny(titleLower, descLower, ['relationship', 'love', 'partnership', 'marriage', 'family', 'social'])) {
      areas.add(LifeArea.RELATIONSHIPS);
    }

    // Health
    if (this.containsAny(titleLower, descLower, ['health', 'wellness', 'physical', 'body', 'vitality', 'medical'])) {
      areas.add(LifeArea.HEALTH);
    }

    // Spirituality
    if (this.containsAny(titleLower, descLower, ['spiritual', 'meditation', 'soul', 'divine', 'sacred', 'enlightenment', 'awakening'])) {
      areas.add(LifeArea.SPIRITUALITY);
    }

    // Personal Growth
    if (this.containsAny(titleLower, descLower, ['growth', 'development', 'learning', 'self-improvement', 'transformation'])) {
      areas.add(LifeArea.PERSONAL_GROWTH);
    }

    // Finances
    if (this.containsAny(titleLower, descLower, ['money', 'finance', 'wealth', 'abundance', 'investment', 'financial'])) {
      areas.add(LifeArea.FINANCES);
    }

    // Emotional
    if (this.containsAny(titleLower, descLower, ['emotion', 'feeling', 'mood', 'psychological', 'mental', 'inner'])) {
      areas.add(LifeArea.EMOTIONAL);
    }

    // Creativity
    if (this.containsAny(titleLower, descLower, ['creative', 'artistic', 'expression', 'art', 'music', 'writing', 'creation'])) {
      areas.add(LifeArea.CREATIVITY);
    }

    // If no specific areas were identified, default to personal growth
    if (areas.size === 0) {
      areas.add(LifeArea.PERSONAL_GROWTH);
    }

    return Array.from(areas);
  }

  private containsAny(title: string, description: string, keywords: string[]): boolean {
    return keywords.some(keyword => 
      title.includes(keyword) || description.includes(keyword)
    );
  }

  private inferThemeKey(title: string, description: string): LifeThemeKey {
    const titleLower = title.toLowerCase();
    const descLower = description.toLowerCase();
    
    // Map common themes to appropriate keys
    if (titleLower.includes('growth') || descLower.includes('personal development')) {
      return LifeThemeKey.PERSONAL_MASTERY;
    }
    if (titleLower.includes('relationship') || descLower.includes('partnership')) {
      return LifeThemeKey.RELATIONSHIP_GROWTH;
    }
    if (titleLower.includes('career') || descLower.includes('profession')) {
      return LifeThemeKey.CAREER_EVOLUTION;
    }
    if (titleLower.includes('spiritual') || descLower.includes('awakening')) {
      return LifeThemeKey.SPIRITUAL_AWAKENING;
    }
    if (titleLower.includes('heal') || descLower.includes('healing')) {
      return LifeThemeKey.HEALING_JOURNEY;
    }
    if (titleLower.includes('creative') || descLower.includes('expression')) {
      return LifeThemeKey.CREATIVE_EXPRESSION;
    }
    if (titleLower.includes('karma') || descLower.includes('past life')) {
      return LifeThemeKey.KARMIC_LESSONS;
    }
    
    // Default to personal mastery if no specific match is found
    return LifeThemeKey.PERSONAL_MASTERY;
  }

  private inferThemeCategory(themeKey: LifeThemeKey, title: string, description: string): ThemeCategory {
    // First check based on theme key
    switch (themeKey) {
      case LifeThemeKey.KARMIC_PATTERNS:
      case LifeThemeKey.NORTH_NODE_PATH:
      case LifeThemeKey.SOUTH_NODE_RELEASE:
      case LifeThemeKey.KARMIC_LESSONS:
        return ThemeCategory.KARMIC;

      case LifeThemeKey.CHIRON_WOUND:
      case LifeThemeKey.EMOTIONAL_HEALING:
      case LifeThemeKey.SPIRITUAL_HEALING:
      case LifeThemeKey.HEALING_JOURNEY:
        return ThemeCategory.HEALING;

      case LifeThemeKey.NATURAL_TALENTS:
      case LifeThemeKey.SPIRITUAL_GIFTS:
      case LifeThemeKey.LIFE_PURPOSE:
        return ThemeCategory.STRENGTHS;
    }

    // If not determined by key, check content
    const titleLower = title.toLowerCase();
    const descLower = description.toLowerCase();

    // Check for karmic themes
    if (this.containsAny(titleLower, descLower, [
      'karma', 'past life', 'destiny', 'dharma', 'nodes', 'reincarnation',
      'soul purpose', 'life lesson', 'ancestral'
    ])) {
      return ThemeCategory.KARMIC;
    }

    // Check for healing themes
    if (this.containsAny(titleLower, descLower, [
      'healing', 'wound', 'trauma', 'recovery', 'integration', 'shadow work',
      'therapy', 'emotional release', 'inner child'
    ])) {
      return ThemeCategory.HEALING;
    }

    // Check for strength themes
    if (this.containsAny(titleLower, descLower, [
      'talent', 'gift', 'strength', 'power', 'mastery', 'skill',
      'ability', 'excellence', 'expertise', 'potential'
    ])) {
      return ThemeCategory.STRENGTHS;
    }

    // Default to growth for themes focused on development and evolution
    return ThemeCategory.GROWTH;
  }
} 