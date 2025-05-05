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
import { AIService, PromptBuilder } from '../../ai';

export class InsightGeneratorFactory {
  private static generators: Map<InsightType, IInsightGenerator<Insight>> = new Map();

  static initialize(aiService: AIService, promptBuilder: PromptBuilder): void {
    // Register all generators
    this.registerGenerator(InsightType.CORE_IDENTITY, new CoreIdentityInsightGenerator() as IInsightGenerator<CoreIdentityInsight>);
    this.registerGenerator(InsightType.ASPECT, new StrengthAndChallengeInsightGenerator() as IInsightGenerator<AspectInsight>);
    this.registerGenerator(InsightType.PATTERN, new PatternInsightGenerator() as IInsightGenerator<PatternInsight>);
    this.registerGenerator(InsightType.NODE_PATH, new NodePathInsightGenerator(aiService, promptBuilder) as IInsightGenerator<NodePathInsight>);
    this.registerGenerator(InsightType.LIFE_THEME, new LifeThemeInsightGenerator(aiService, promptBuilder) as IInsightGenerator<LifeThemeInsight>);
    this.registerGenerator(InsightType.TRANSIT, new TransitInsightGenerator() as IInsightGenerator<TransitInsight>);
    this.registerGenerator(InsightType.DAILY, new DailyInsightGenerator(aiService, promptBuilder) as IInsightGenerator<DailyInsight>);
    this.registerGenerator(InsightType.WEEKLY_DIGEST, new WeeklyDigestInsightGenerator(aiService, promptBuilder) as IInsightGenerator<WeeklyDigestInsight>);
    this.registerGenerator(InsightType.THEME_FORECAST, new ThemeForecastInsightGenerator(aiService, promptBuilder) as IInsightGenerator<ThemeForecastInsight>);
  }

  static getGenerator<T extends Insight>(type: InsightType): IInsightGenerator<T> {
    const generator = this.generators.get(type);
    if (!generator) {
      throw new Error(`No generator registered for type: ${type}`);
    }
    return generator as IInsightGenerator<T>;
  }

  static getAllGenerators(): IInsightGenerator<Insight>[] {
    return Array.from(this.generators.values());
  }

  static registerGenerator<T extends Insight>(type: InsightType, generator: IInsightGenerator<T>): void {
    this.generators.set(type, generator as IInsightGenerator<Insight>);
  }
} 