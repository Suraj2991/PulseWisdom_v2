import { IInsightGenerator } from './IInsightGenerator';
import { 
  InsightType, 
  Insight, 
  CoreIdentityInsight, 
  AspectInsight, 
  PatternInsight, 
  NodePathInsight, 
  LifeThemeInsight, 
  TransitInsight,
  DailyInsight,
  WeeklyDigestInsight,
  ThemeForecastInsight
} from '../types/insight.types';
import { CoreIdentityInsightGenerator } from './CoreIdentityInsightGenerator';
import { StrengthAndChallengeInsightGenerator } from './StrengthAndChallengeInsightGenerator';
import { PatternInsightGenerator } from './PatternInsightGenerator';
import { NodePathInsightGenerator } from './NodePathInsightGenerator';
import { LifeThemeInsightGenerator } from './LifeThemeInsightGenerator';
import { TransitInsightGenerator } from './TransitInsightGenerator';
import { DailyInsightGenerator } from './DailyInsightGenerator';
import { WeeklyDigestInsightGenerator } from './WeeklyDigestInsightGenerator';
import { ThemeForecastInsightGenerator } from './ThemeForecastInsightGenerator';
import { AIService, PromptBuilder, ChartAnalysisService } from '../../ai';
import { BirthChartService } from '../../birthchart/services/BirthChartService';
import { ICache } from '../../../infrastructure/cache/ICache';
import { LLMClient } from '../../ai';

export class InsightGeneratorFactory {
  private static generators: Map<InsightType, IInsightGenerator<Insight>> = new Map();

  static initialize(aiService: AIService, promptBuilder: PromptBuilder, birthChartService: BirthChartService, cache: ICache, llmClient: LLMClient): void {
    // Create chart analysis service
    const chartAnalysisService = new ChartAnalysisService(llmClient, cache);

    // Register all generators
    this.registerGenerator(InsightType.CORE_IDENTITY, new CoreIdentityInsightGenerator(aiService) as IInsightGenerator<CoreIdentityInsight>);
    this.registerGenerator(InsightType.ASPECT, new StrengthAndChallengeInsightGenerator(chartAnalysisService) as IInsightGenerator<AspectInsight>);
    this.registerGenerator(InsightType.PATTERN, new PatternInsightGenerator(aiService, promptBuilder) as IInsightGenerator<PatternInsight>);
    this.registerGenerator(InsightType.NODE_PATH, new NodePathInsightGenerator(aiService, promptBuilder, birthChartService) as IInsightGenerator<NodePathInsight>);
    this.registerGenerator(InsightType.LIFE_THEME, new LifeThemeInsightGenerator(aiService, promptBuilder) as IInsightGenerator<LifeThemeInsight>);
    this.registerGenerator(InsightType.TRANSIT, new TransitInsightGenerator(aiService, promptBuilder) as IInsightGenerator<TransitInsight>);
    this.registerGenerator(InsightType.DAILY, new DailyInsightGenerator(aiService, promptBuilder) as IInsightGenerator<DailyInsight>);
    this.registerGenerator(InsightType.WEEKLY_DIGEST, new WeeklyDigestInsightGenerator(aiService, promptBuilder) as IInsightGenerator<WeeklyDigestInsight>);
    this.registerGenerator(InsightType.THEME_FORECAST, new ThemeForecastInsightGenerator(aiService, promptBuilder) as IInsightGenerator<ThemeForecastInsight>);
  }

  static getGenerator<T extends Insight>(type: InsightType): IInsightGenerator<T> {
    const generator = this.generators.get(type);
    if (!generator) {
      throw new Error(`No generator registered for insight type: ${type}`);
    }
    return generator as IInsightGenerator<T>;
  }

  static getAllGenerators(): IInsightGenerator<Insight>[] {
    return Array.from(this.generators.values());
  }

  static registerGenerator<T extends Insight>(type: InsightType, generator: IInsightGenerator<T>): void {
    this.generators.set(type, generator);
  }
} 