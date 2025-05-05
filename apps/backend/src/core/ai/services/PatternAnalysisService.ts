import { BirthChartDocument } from '../../birthchart';
import { NodePlacement, CelestialBody } from '../../ephemeris';
import { LLMClient } from '..';
import { ICache } from '../../../infrastructure/cache/ICache';
import { logger } from '../../../shared/logger';
import { ServiceError } from '../../../domain/errors';
import { PromptBuilder } from '../prompts/PromptBuilder';
import { InsightType, InsightLog } from '../../insight/types/insight.types';
import { LifeTheme, LifeArea } from '../../life-theme';

export class PatternAnalysisService {
  private readonly CACHE_PREFIX = 'ai:pattern:';
  private readonly CACHE_TTL = 3600; // 1 hour in seconds

  constructor(
    private readonly llmClient: LLMClient,
    private readonly cache: ICache
  ) {}

  private getCacheKey(type: string, id: string): string {
    return `${this.CACHE_PREFIX}${type}:${id}`;
  }

  async generateNodeInsight(birthChart: BirthChartDocument): Promise<{ insight: string; log: InsightLog }> {
    try {
      const northNode = birthChart.bodies.find(body => body.name === 'North Node');
      const southNode = birthChart.bodies.find(body => body.name === 'South Node');
      
      const prompt = PromptBuilder.buildNodeInsightPrompt({
        northNode: this.getNodePlacement(northNode),
        southNode: this.getNodePlacement(southNode)
      }, true);
      
      const insight = await this.llmClient.generateInsight(prompt);
      
      const log = {
        id: birthChart._id.toString(),
        userId: birthChart.userId.toString(),
        insightType: InsightType.NODE_PATH,
        content: insight,
        generatedAt: new Date(),
        metadata: {
          date: new Date(),
          lifeArea: LifeArea.SPIRITUALITY,
          planet: 'North Node',
          sign: northNode?.sign,
          house: northNode?.house,
          lifeThemeKey: 'life_purpose',
          triggeredBy: 'node' as const,
          northNode: northNode ? {
            sign: northNode.sign,
            house: northNode.house
          } : undefined,
          southNode: southNode ? {
            sign: southNode.sign,
            house: southNode.house
          } : undefined
        }
      };

      return { insight, log };
    } catch (error) {
      logger.error('Failed to generate node insight', { 
        error, 
        birthChartId: birthChart._id.toString(),
        userId: birthChart.userId.toString(),
        insightType: 'node_path'
      });
      throw new ServiceError(`Failed to generate node insight: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateCoreIdentityDescription(birthChart: BirthChartDocument): Promise<string> {
    try {
      const sun = birthChart.bodies.find(b => b.name === 'Sun');
      const moon = birthChart.bodies.find(b => b.name === 'Moon');
      const ascendant = birthChart.bodies.find(b => b.name === 'Ascendant');

      if (!sun || !moon || !ascendant) {
        throw new Error('Missing required celestial bodies for core identity');
      }

      const cacheKey = this.getCacheKey('coreIdentity', `${sun.name}-${moon.name}-${ascendant.longitude}`);
      const cached = await this.cache.get<string>(cacheKey);
      if (cached) {
        logger.info('Retrieved core identity description from cache', { 
          sun: sun.name, 
          moon: moon.name, 
          ascendant: ascendant.longitude,
          insightType: 'core_identity'
        });
        return cached;
      }

      const prompt = PromptBuilder.buildCoreIdentityPrompt(sun, moon, ascendant.longitude, true);
      const description = await this.llmClient.generateInsight(prompt);
      
      await this.cache.set(cacheKey, description, this.CACHE_TTL);
      logger.info('Cached core identity description', { 
        sun: sun.name, 
        moon: moon.name, 
        ascendant: ascendant.longitude,
        insightType: 'core_identity'
      });
      return description;
    } catch (error) {
      logger.error('Failed to generate core identity description', { 
        error,
        insightType: 'core_identity'
      });
      throw new ServiceError(`Failed to generate core identity description: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateLifeThemeInsight(themeData: LifeTheme): Promise<{ insight: string; log: Partial<InsightLog> }> {
    try {
      const prompt = PromptBuilder.buildLifeThemePrompt(themeData, true);
      const insight = await this.llmClient.generateInsight(prompt);
      
      const log = {
        id: themeData.id,
        userId: themeData.id,
        insightType: InsightType.LIFE_THEME,
        content: insight,
        generatedAt: new Date(),
        metadata: {
          lifeThemeKey: themeData.key,
          lifeArea: themeData.metadata?.lifeAreas?.[0],
          date: new Date()
        }
      };

      return { insight, log };
    } catch (error) {
      logger.error('Failed to generate life theme insight', { 
        error, 
        themeId: themeData.id,
        insightType: 'life_theme'
      });
      throw new ServiceError(`Failed to generate life theme insight: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generatePatternInsight(patternData: {
    type: string;
    sign: string;
    count: number;
    planets: Array<{
      id: number;
      sign: string;
      house: number;
      degree: number;
      retrograde: boolean;
    }>;
    birthChart: BirthChartDocument;
  }): Promise<{ insight: string; log: Partial<InsightLog> }> {
    try {
      const prompt = PromptBuilder.buildPatternInsightPrompt(patternData, true);
      const insight = await this.llmClient.generateInsight(prompt);
      
      const log = {
        id: patternData.birthChart._id.toString(),
        userId: patternData.birthChart.userId.toString(),
        insightType: InsightType.PATTERN,
        content: insight,
        generatedAt: new Date(),
        metadata: {
          date: new Date(),
          planets: patternData.planets.map(p => p.id.toString()),
          sign: patternData.sign,
          house: patternData.planets[0]?.house,
          birthChartId: patternData.birthChart._id.toString()
        }
      };

      return { insight, log };
    } catch (error) {
      logger.error('Failed to generate pattern insight', { 
        error, 
        patternType: patternData.type,
        sign: patternData.sign,
        planetCount: patternData.count,
        insightType: 'pattern'
      });
      throw new ServiceError(`Failed to generate pattern insight: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private getNodePlacement(node: CelestialBody | undefined): NodePlacement {
    return {
      sign: node ? node.sign : '',
      house: node ? node.house : 0,
      degree: node ? node.longitude % 30 : 0
    };
  }
} 