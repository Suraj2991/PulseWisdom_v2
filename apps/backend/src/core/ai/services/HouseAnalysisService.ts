import { BirthChartDocument } from '../../birthchart';
import { BirthChart } from '../../ephemeris';
import { HouseTheme, HouseLord } from '../../insight';
import { LLMClient } from '..';
import { ICache } from '../../../infrastructure/cache/ICache';
import { logger } from '../../../shared/logger';
import { ServiceError } from '../../../domain/errors';
import { PromptBuilder } from '../prompts/PromptBuilder';
import { adaptBirthChartData } from '../../birthchart';

export class HouseAnalysisService {
  private readonly CACHE_PREFIX = 'ai:house:';
  private readonly CACHE_TTL = 3600; // 1 hour in seconds

  constructor(
    private readonly llmClient: LLMClient,
    private readonly cache: ICache
  ) {}

  private getCacheKey(type: string, id: string): string {
    return `${this.CACHE_PREFIX}${type}:${id}`;
  }

  async analyzeHouseThemes(birthChart: BirthChartDocument): Promise<HouseTheme[]> {
    try {
      const chart = adaptBirthChartData(birthChart);
      const prompt = PromptBuilder.buildHouseThemesAnalysisPrompt(chart, true);
      const aiAnalysis = await this.llmClient.generateInsight(prompt);
      return this.parseAIHouseThemeAnalysis(aiAnalysis, chart);
    } catch (error) {
      logger.error('Failed to analyze house themes', { 
        error, 
        birthChartId: birthChart._id.toString(),
        userId: birthChart.userId.toString(),
        insightType: 'house_themes'
      });
      throw new ServiceError(`Failed to analyze house themes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async analyzeHouseLords(birthChart: BirthChartDocument): Promise<HouseLord[]> {
    try {
      const cacheKey = this.getCacheKey('houseLords', birthChart._id.toString());
      const cached = await this.cache.get<HouseLord[]>(cacheKey);
      if (cached) {
        logger.info('Retrieved house lords from cache', { 
          birthChartId: birthChart._id.toString(),
          userId: birthChart.userId.toString(),
          insightType: 'house_lords'
        });
        return cached;
      }

      const chart = adaptBirthChartData(birthChart);
      const prompt = PromptBuilder.buildHouseLordsAnalysisPrompt(chart, true);
      const aiAnalysis = await this.llmClient.generateInsight(prompt);
      const houseLords = this.parseAIHouseLordAnalysis(aiAnalysis);

      await this.cache.set(cacheKey, houseLords, this.CACHE_TTL);
      logger.info('Cached house lords analysis', { 
        birthChartId: birthChart._id.toString(),
        userId: birthChart.userId.toString(),
        insightType: 'house_lords'
      });
      return houseLords;
    } catch (error) {
      logger.error('Failed to analyze house lords', { 
        error, 
        birthChartId: birthChart._id.toString(),
        userId: birthChart.userId.toString(),
        insightType: 'house_lords'
      });
      throw new ServiceError(`Failed to analyze house lords: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private parseAIHouseThemeAnalysis(aiAnalysis: string, chart: BirthChart): HouseTheme[] {
    const houseThemes: HouseTheme[] = [];
    const houseAnalyses = aiAnalysis.split(/House \d+:/g).filter(Boolean);
    
    for (const analysis of houseAnalyses) {
      try {
        const houseMatch = analysis.match(/(\d+)/);
        const themeMatch = analysis.match(/Theme:\s*([^\n.]+)/i);
        const descMatch = analysis.match(/Description:\s*([^\n.]+\.)/i);
        
        if (!houseMatch || !themeMatch || !descMatch) continue;
        
        const houseNumber = parseInt(houseMatch[1]);
        
        houseThemes.push({
          house: houseNumber,
          theme: themeMatch[1].trim(),
          description: descMatch[1].trim(),
          planets: this.extractPlanetsFromLine(analysis),
          aspects: this.extractHouseAspects(analysis, chart, houseNumber)
        });
      } catch (error) {
        logger.warn('Error parsing house theme analysis section', { error, section: analysis });
      }
    }
    
    return houseThemes;
  }

  private parseAIHouseLordAnalysis(aiAnalysis: string): HouseLord[] {
    const houseLords: HouseLord[] = [];
    const houseAnalyses = aiAnalysis.split(/House \d+:/g).filter(Boolean);
    
    for (const analysis of houseAnalyses) {
      try {
        const houseMatch = analysis.match(/(\d+)/);
        const lordMatch = analysis.match(/ruler[:\s]+([A-Za-z]+)/i);
        
        if (!houseMatch || !lordMatch) continue;
        
        const houseNumber = parseInt(houseMatch[1]);
        const lord = lordMatch[1];
        
        const dignity = {
          ruler: /\bruler\b/i.test(analysis),
          exaltation: /\bexalt(ed|ation)\b/i.test(analysis),
          detriment: /\bdetriment\b/i.test(analysis),
          fall: /\bfall\b/i.test(analysis),
          score: this.calculateDignityScore(analysis)
        };
        
        houseLords.push({
          house: houseNumber,
          lord,
          dignity,
          influence: this.extractInfluence(analysis),
          aspects: this.extractAspects(analysis)
        });
      } catch (error) {
        logger.warn('Error parsing house lord analysis section', { error, section: analysis });
      }
    }
    
    return houseLords;
  }

  private extractHouseAspects(analysis: string, chart: BirthChart, houseNumber: number): Array<{
    body1Id: number;
    body2Id: number;
    type: string;
    angle: number;
    orb: number;
    isApplying: boolean;
  }> {
    const aspects: Array<{
      body1Id: number;
      body2Id: number;
      type: string;
      angle: number;
      orb: number;
      isApplying: boolean;
    }> = [];
    
    const housePlanets = chart.bodies.filter(body => body.house === houseNumber);
    
    for (const aspect of chart.aspects) {
      const body1 = chart.bodies.find(b => b.id === Number(aspect.body1));
      const body2 = chart.bodies.find(b => b.id === Number(aspect.body2));
      
      if (body1 && body2 && 
          (housePlanets.some(p => p.id === body1.id) || 
           housePlanets.some(p => p.id === body2.id))) {
        aspects.push({
          body1Id: Number(aspect.body1),
          body2Id: Number(aspect.body2),
          type: aspect.type,
          angle: this.getAspectAngle(aspect.type),
          orb: aspect.orb || 0,
          isApplying: aspect.isApplying || false
        });
      }
    }
    
    return aspects;
  }

  private getAspectAngle(aspectType: string): number {
    const aspectAngles: Record<string, number> = {
      conjunction: 0,
      sextile: 60,
      square: 90,
      trine: 120,
      opposition: 180
    };
    return aspectAngles[aspectType.toLowerCase()] || 0;
  }

  private calculateDignityScore(analysis: string): number {
    let score = 0.5; // Base score
    
    if (/\bruler\b/i.test(analysis)) score += 0.2;
    if (/\bexalt(ed|ation)\b/i.test(analysis)) score += 0.2;
    if (/\bdetriment\b/i.test(analysis)) score -= 0.2;
    if (/\bfall\b/i.test(analysis)) score -= 0.2;
    if (/\bstrong(er|est)?\b/i.test(analysis)) score += 0.1;
    if (/\bweak(er|est)?\b/i.test(analysis)) score -= 0.1;
    
    return Math.max(0, Math.min(1, score));
  }

  private extractInfluence(analysis: string): string {
    if (/\bvery strong\b/i.test(analysis)) return 'Very Strong';
    if (/\bstrong\b/i.test(analysis)) return 'Strong';
    if (/\bmoderate\b/i.test(analysis)) return 'Moderate';
    if (/\bweak\b/i.test(analysis)) return 'Weak';
    if (/\bvery weak\b/i.test(analysis)) return 'Very Weak';
    return 'Moderate';
  }

  private extractAspects(analysis: string): string[] {
    const aspects: string[] = [];
    const aspectTypes = ['conjunction', 'trine', 'square', 'opposition', 'sextile'];
    
    for (const aspect of aspectTypes) {
      const regex = new RegExp(`${aspect}\\s+(?:to|with)\\s+([A-Za-z]+)`, 'gi');
      let match;
      while ((match = regex.exec(analysis)) !== null) {
        aspects.push(`${aspect} with ${match[1]}`);
      }
    }
    
    return aspects;
  }

  private extractPlanetsFromLine(line: string): string[] {
    const planets: string[] = [];
    const planetNames = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 
                        'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
    for (const planet of planetNames) {
      if (line.includes(planet)) {
        planets.push(planet);
      }
    }
    return planets;
  }
} 