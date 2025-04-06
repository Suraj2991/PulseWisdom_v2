import { LLMClient } from '../../infrastructure/ai/LLMClient';
import { PromptBuilder } from '../../utils/PromptBuilder';
import { LifeTheme } from '../../domain/types/lifeTheme.types';
import { Transit } from '../../domain/types/transit.types';
import { BirthChart, NodePlacement } from '../../domain/types/ephemeris.types';
import { HouseTheme, HouseLord } from '../../domain/types/insight.types';
import { TimingWindow } from '../../domain/types/timing.types';
import { InsightLog } from '../../domain/types/personalization.types';

interface CelestialBody {
  longitude: number;
}

interface Strength {
  area: string;
  description: string;
  supportingAspects: string[];
}

interface Challenge {
  area: string;
  description: string;
  growthOpportunities: string[];
  supportingAspects: string[];
}

interface Pattern {
  type: string;
  description: string;
  planets: string[];
  houses: number[];
}

export class AIService {
  private llmClient: LLMClient;
  private promptBuilder: typeof PromptBuilder;

  constructor(llmClient: LLMClient, promptBuilder: typeof PromptBuilder) {
    this.llmClient = llmClient;
    this.promptBuilder = promptBuilder;
  }

  async generateLifeThemeInsight(themeData: LifeTheme): Promise<string> {
    const prompt = this.promptBuilder.buildLifeThemePrompt(themeData, true);
    return this.llmClient.generateInsight(prompt);
  }

  async generateTransitInsight(transitData: Transit): Promise<{ insight: string; log: Partial<InsightLog> }> {
    const prompt = this.promptBuilder.buildTransitPrompt(transitData, true);
    const insight = await this.llmClient.generateInsight(prompt);
    const log: Partial<InsightLog> = {
      insightType: 'Transit',
      content: insight,
      generatedAt: new Date(),
      metadata: { planet: transitData.planet, sign: transitData.sign }
    };
    return { insight, log };
  }

  async generateNatalChartInsight(birthChart: BirthChart): Promise<string> {
    const prompt = this.promptBuilder.buildNatalChartPrompt(birthChart, true);
    return this.llmClient.generateInsight(prompt);
  }

  async analyzeStrengths(birthChart: BirthChart): Promise<Strength[]> {
    return [
      {
        area: 'Communication',
        description: 'Strong ability to express ideas clearly',
        supportingAspects: ['Mercury in Gemini', 'Third house emphasis']
      },
      {
        area: 'Leadership',
        description: 'Natural leadership qualities',
        supportingAspects: ['Sun in Leo', 'First house emphasis']
      }
    ];
  }

  async analyzeChallenges(birthChart: BirthChart): Promise<Challenge[]> {
    return [
      {
        area: 'Emotional Expression',
        description: 'Learning to express emotions openly',
        growthOpportunities: ['Moon in Capricorn', 'Fourth house challenges'],
        supportingAspects: ['Saturn aspects to Moon']
      }
    ];
  }

  async identifyPatterns(birthChart: BirthChart): Promise<Pattern[]> {
    return [
      {
        type: 'Grand Trine',
        description: 'A harmonious pattern indicating natural talents',
        planets: ['Sun', 'Moon', 'Jupiter'],
        houses: [1, 5, 9]
      }
    ];
  }

  async analyzeHouseThemes(birthChart: BirthChart): Promise<any[]> {
    return [
      {
        theme: 'Self and Identity',
        description: 'Strong focus on personal development',
        supportingFactors: ['Sun in first house', 'Mars conjunct Ascendant'],
        manifestation: 'Through leadership roles and personal initiatives'
      }
    ];
  }

  async analyzeHouseLords(birthChart: BirthChart): Promise<any[]> {
    return [
      {
        house: 1,
        lord: 'Mars',
        dignity: { score: 5, ruler: true },
        influence: 'Strong drive for self-expression',
        aspects: ['Conjunction with Sun', 'Trine with Jupiter']
      }
    ];
  }

  async generateCoreIdentityDescription(sun: CelestialBody, moon: CelestialBody, ascendant: number): Promise<string> {
    return `Your core identity combines the creative energy of ${this.getSignName(sun.longitude)} Sun with the emotional depth of ${this.getSignName(moon.longitude)} Moon, rising in ${this.getSignName(ascendant)}.`;
  }

  async generateOverallSummary(strengths: Strength[], challenges: Challenge[], patterns: Pattern[]): Promise<string> {
    return `Your birth chart reveals ${strengths.length} key strengths, ${challenges.length} areas for growth, and ${patterns.length} significant patterns that shape your life journey.`;
  }

  async generateNodeInsight(birthChart: BirthChart): Promise<string> {
    const prompt = this.promptBuilder.buildNodeInsightPrompt({
      northNode: birthChart.northNode,
      southNode: birthChart.southNode
    }, true);
    return this.llmClient.generateInsight(prompt);
  }

  async generateHouseThemesInsight(houseThemes: HouseTheme[]): Promise<string> {
    const prompt = this.promptBuilder.buildHouseThemesPrompt(houseThemes, true);
    return this.llmClient.generateInsight(prompt);
  }

  async generateHouseLordsInsight(houseLords: HouseLord[]): Promise<string> {
    const prompt = this.promptBuilder.buildHouseLordsPrompt(houseLords, true);
    return this.llmClient.generateInsight(prompt);
  }

  async generateDailyInsight(birthChart: BirthChart, transits: Transit[], currentDate: Date): Promise<{ insight: string; log: Partial<InsightLog> }> {
    const prompt = this.promptBuilder.buildDailyInsightPrompt(birthChart, transits, currentDate, true);
    const insight = await this.llmClient.generateInsight(prompt);
    const log: Partial<InsightLog> = {
      insightType: 'Daily',
      content: insight,
      generatedAt: new Date(),
      metadata: { date: currentDate.toISOString() }
    };
    return { insight, log };
  }

  async analyzeSmartTimingWindows(birthChart: BirthChart, transits: Transit[], currentDate: Date): Promise<TimingWindow[]> {
    const prompt = this.promptBuilder.buildSmartTimingPrompt(birthChart, transits, currentDate, true);
    const insight = await this.llmClient.generateInsight(prompt);
    return JSON.parse(insight) as TimingWindow[];
  }

  private getSignName(longitude: number): string {
    const signs = [
      'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
      'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
    ];
    return signs[Math.floor(longitude / 30)];
  }

  async generateWeeklyDigest(
    birthChart: BirthChart,
    transits: Transit[],
    startDate: Date,
    transitInsights: string[] = []
  ): Promise<string> {
    const prompt = `You are an expert astrologer. Generate a weekly astrological digest for the week starting ${startDate.toISOString()}. 
    Consider the following transits and their interpretations:
    
    Birth Chart: ${JSON.stringify(birthChart)}
    Transits: ${JSON.stringify(transits)}
    Individual Transit Insights: ${transitInsights.join('\n')}
    
    Provide a comprehensive weekly overview that includes:
    1. Key themes and energies
    2. Important dates and timing
    3. Areas of focus and opportunity
    4. Potential challenges and growth points
    5. Practical guidance and recommendations`;

    return this.llmClient.generateInsight(prompt);
  }

  async generateThemeForecast(
    birthChart: BirthChart,
    themes: LifeTheme[],
    transits: Transit[]
  ): Promise<string> {
    const prompt = `You are an expert astrologer. Generate a thematic forecast based on the natal chart themes and current transits.
    
    Birth Chart: ${JSON.stringify(birthChart)}
    Life Themes: ${JSON.stringify(themes)}
    Current Transits: ${JSON.stringify(transits)}
    
    Analyze how current transits are activating or challenging the established life themes.
    Include:
    1. Theme activation and timing
    2. Growth opportunities
    3. Potential challenges
    4. Integration strategies
    5. Key dates and windows of opportunity`;

    return this.llmClient.generateInsight(prompt);
  }
} 