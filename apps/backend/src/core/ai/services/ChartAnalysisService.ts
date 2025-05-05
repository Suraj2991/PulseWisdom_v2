import { BirthChartDocument } from '../../birthchart';
import { BirthChart } from '../../ephemeris';
import { Strength, Challenge, Pattern } from '../../ephemeris';
import { LLMClient } from '..';
import { ICache } from '../../../infrastructure/cache/ICache';
import { logger } from '../../../shared/logger';
import { ServiceError } from '../../../domain/errors';
import { PromptBuilder } from '../prompts/PromptBuilder';
import { adaptBirthChartData } from '../../birthchart';
import { InsightType, InsightLog } from '../../insight/types/insight.types';
import { LifeArea } from '../../life-theme';

export class ChartAnalysisService {
  private readonly CACHE_PREFIX = 'ai:chart:';
  private readonly CACHE_TTL = 3600; // 1 hour in seconds

  constructor(
    private readonly llmClient: LLMClient,
    private readonly cache: ICache
  ) {}

  private getCacheKey(type: string, id: string): string {
    return `${this.CACHE_PREFIX}${type}:${id}`;
  }

  async analyzeStrengths(birthChart: BirthChartDocument): Promise<Strength[]> {
    try {
      const chart = adaptBirthChartData(birthChart);
      const prompt = PromptBuilder.buildStrengthsAnalysisPrompt(chart, true);
      const aiAnalysis = await this.llmClient.generateInsight(prompt);
      return this.parseAIStrengthAnalysis(aiAnalysis, chart);
    } catch (error) {
      logger.error('Failed to analyze strengths', { 
        error, 
        birthChartId: birthChart._id.toString(),
        userId: birthChart.userId.toString(),
        insightType: 'strengths'
      });
      throw new ServiceError(`Failed to analyze strengths: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async analyzeChallenges(birthChart: BirthChartDocument): Promise<Challenge[]> {
    try {
      const chart = adaptBirthChartData(birthChart);
      const prompt = PromptBuilder.buildChallengesAnalysisPrompt(chart, true);
      const aiAnalysis = await this.llmClient.generateInsight(prompt);
      return this.parseAIChallengeAnalysis(aiAnalysis, chart);
    } catch (error) {
      logger.error('Failed to analyze challenges', { 
        error, 
        birthChartId: birthChart._id.toString(),
        userId: birthChart.userId.toString(),
        insightType: 'challenges'
      });
      throw new ServiceError(`Failed to analyze challenges: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async analyzePatterns(birthChart: BirthChartDocument): Promise<Pattern[]> {
    try {
      const chart = adaptBirthChartData(birthChart);
      const prompt = PromptBuilder.buildPatternsAnalysisPrompt(chart, true);
      const aiAnalysis = await this.llmClient.generateInsight(prompt);
      return this.parseAIPatternAnalysis(aiAnalysis, chart);
    } catch (error) {
      logger.error('Failed to analyze patterns', { 
        error, 
        birthChartId: birthChart._id.toString(),
        userId: birthChart.userId.toString(),
        insightType: 'patterns'
      });
      throw new ServiceError(`Failed to analyze patterns: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private parseAIStrengthAnalysis(aiAnalysis: string, chart: BirthChart): Strength[] {
    const strengths: Strength[] = [];
    const sections = aiAnalysis.split(/Strength \d+:/g).filter(Boolean);
    
    for (const section of sections) {
      try {
        const areaMatch = section.match(/Area:\s*([^\n.]+)/i);
        const descMatch = section.match(/Description:\s*([^\n.]+\.)/i);
        
        if (!areaMatch || !descMatch) continue;
        
        // Validate area against chart houses and planets
        const area = areaMatch[1].trim();
        const isValidArea = this.validateAreaAgainstChart(area, chart);
        if (!isValidArea) {
          logger.warn('Invalid area detected in strength analysis', { area });
          continue;
        }

        strengths.push({
          area,
          description: descMatch[1].trim(),
          supportingAspects: this.extractAspectsFromLine(section, chart)
        });
      } catch (error) {
        logger.warn('Error parsing strength analysis section', { error, section });
      }
    }
    
    return strengths;
  }

  private parseAIChallengeAnalysis(aiAnalysis: string, chart: BirthChart): Challenge[] {
    const challenges: Challenge[] = [];
    const sections = aiAnalysis.split(/Challenge \d+:/g).filter(Boolean);
    
    for (const section of sections) {
      try {
        const areaMatch = section.match(/Area:\s*([^\n.]+)/i);
        const descMatch = section.match(/Description:\s*([^\n.]+\.)/i);
        
        if (!areaMatch || !descMatch) continue;
        
        // Validate area against chart houses and planets
        const area = areaMatch[1].trim();
        const isValidArea = this.validateAreaAgainstChart(area, chart);
        if (!isValidArea) {
          logger.warn('Invalid area detected in challenge analysis', { area });
          continue;
        }

        challenges.push({
          area,
          description: descMatch[1].trim(),
          growthOpportunities: this.extractGrowthOpportunities(section),
          supportingAspects: this.extractAspectsFromLine(section, chart)
        });
      } catch (error) {
        logger.warn('Error parsing challenge analysis section', { error, section });
      }
    }
    
    return challenges;
  }

  private parseAIPatternAnalysis(aiAnalysis: string, chart: BirthChart): Pattern[] {
    const patterns: Pattern[] = [];
    const sections = aiAnalysis.split(/Pattern \d+:/g).filter(Boolean);
    
    for (const section of sections) {
      try {
        const typeMatch = section.match(/Type:\s*([^\n.]+)/i);
        const descMatch = section.match(/Description:\s*([^\n.]+\.)/i);
        
        if (!typeMatch || !descMatch) continue;
        
        const planets = this.extractPlanetsFromLine(section);
        // Validate that all mentioned planets exist in the chart
        const validPlanets = planets.filter(planet => 
          chart.bodies.some(body => body.name === planet)
        );

        const houses = this.extractHousesFromLine(section);
        // Validate house numbers
        const validHouses = houses.filter(house => 
          house > 0 && house <= 12
        );

        patterns.push({
          type: typeMatch[1].trim(),
          description: descMatch[1].trim(),
          planets: validPlanets,
          houses: validHouses
        });
      } catch (error) {
        logger.warn('Error parsing pattern analysis section', { error, section });
      }
    }
    
    return patterns;
  }

  private validateAreaAgainstChart(area: string, chart: BirthChart): boolean {
    // Convert area to lowercase for case-insensitive comparison
    const normalizedArea = area.toLowerCase();
    
    // Check if area mentions any planets in the chart
    const hasPlanet = chart.bodies.some(body => 
      normalizedArea.includes(body.name.toLowerCase())
    );
    
    // Check if area mentions any houses
    const hasHouse = Array.from({ length: 12 }, (_, i) => i + 1).some(houseNumber =>
      normalizedArea.includes(`house ${houseNumber}`) ||
      normalizedArea.includes(`${houseNumber}th house`)
    );
    
    // Check if area mentions any signs
    const hasSign = chart.bodies.some(body => 
      normalizedArea.includes(body.sign.toLowerCase())
    );
    
    return hasPlanet || hasHouse || hasSign;
  }

  private extractAspectsFromLine(line: string, chart: BirthChart): string[] {
    const aspects: string[] = [];
    // Get actual aspects from the chart
    const validAspectTypes = Array.from(new Set(
      chart.aspects.map(aspect => aspect.type.toLowerCase())
    ));
    
    for (const aspect of validAspectTypes) {
      if (line.toLowerCase().includes(aspect)) {
        aspects.push(aspect);
      }
    }
    return aspects;
  }

  private extractGrowthOpportunities(line: string): string[] {
    const opportunities: string[] = [];
    if (line.toLowerCase().includes('learn')) opportunities.push('Learning');
    if (line.toLowerCase().includes('develop')) opportunities.push('Development');
    if (line.toLowerCase().includes('transform')) opportunities.push('Transformation');
    if (line.toLowerCase().includes('heal')) opportunities.push('Healing');
    return opportunities;
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

  private extractHousesFromLine(line: string): number[] {
    const houses: number[] = [];
    const houseMatches = line.match(/(?:house|houses)\s+(\d+(?:,\s*\d+)*)/i);
    if (houseMatches) {
      houses.push(...houseMatches[1].split(',').map(h => parseInt(h.trim())));
    }
    return houses;
  }

  async generateNatalChartInsight(birthChart: BirthChartDocument): Promise<{ insight: string; log: InsightLog }> {
    try {
      const adaptedChart = adaptBirthChartData(birthChart);
      const sun = birthChart.bodies.find(b => b.name === 'Sun');
      const moon = birthChart.bodies.find(b => b.name === 'Moon');
      const ascendant = birthChart.bodies.find(b => b.name === 'Ascendant');
      
      const moonAspects = birthChart.aspects.filter(a => 
        a.body1 === 'Moon' || a.body2 === 'Moon'
      );
      const ascendantAspects = birthChart.aspects.filter(a => 
        a.body1 === 'Ascendant' || a.body2 === 'Ascendant'
      );

      const prompt = PromptBuilder.buildNatalChartPrompt(adaptedChart, true);
      const insight = await this.llmClient.generateInsight(prompt);
      
      const log = {
        id: birthChart._id.toString(),
        userId: birthChart.userId.toString(),
        insightType: InsightType.BIRTH_CHART,
        content: insight,
        generatedAt: new Date(),
        metadata: {
          date: new Date(),
          lifeArea: LifeArea.PERSONAL_GROWTH,
          planet: sun?.name,
          sign: sun?.sign,
          house: sun?.house,
          planets: ['Moon', 'Ascendant'],
          activePlanets: Array.from(new Set([
            ...moonAspects.map(a => a.body1 === 'Moon' ? a.body2 : a.body1),
            ...ascendantAspects.map(a => a.body1 === 'Ascendant' ? a.body2 : a.body1)
          ])),
          keyTransits: [
            ...moonAspects.map(a => ({
              planet: a.body1 === 'Moon' ? a.body2 : a.body1,
              sign: moon?.sign || '',
              house: moon?.house || 0,
              orb: a.orb
            })),
            ...ascendantAspects.map(a => ({
              planet: a.body1 === 'Ascendant' ? a.body2 : a.body1,
              sign: ascendant?.sign || '',
              house: ascendant?.house || 0,
              orb: a.orb
            }))
          ],
          lifeThemeKey: 'core_identity',
          triggeredBy: 'natal' as const
        }
      };

      return { insight, log };
    } catch (error) {
      logger.error('Failed to generate natal chart insight', { 
        error, 
        birthChartId: birthChart._id.toString(),
        userId: birthChart.userId.toString(),
        insightType: 'birth_chart'
      });
      throw new ServiceError(`Failed to generate natal chart insight: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 