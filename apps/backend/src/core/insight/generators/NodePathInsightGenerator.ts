import { BaseInsightGenerator } from './BaseInsightGenerator';
import { AIService, PromptBuilder } from '../../ai';
import { logger } from '../../../shared/logger';
import { ServiceError } from '../../../domain/errors';
import { NodePathInsight, InsightType, InsightCategory, InsightSeverity, InsightAnalysis } from '../types/insight.types';
import { BirthChartService } from '../../birthchart';

export class NodePathInsightGenerator extends BaseInsightGenerator<NodePathInsight> {
  constructor(
    private readonly aiService: AIService,
    private readonly promptBuilder: PromptBuilder,
    private readonly birthChartService: BirthChartService
  ) {
    super(InsightType.NODE_PATH);
  }

  async generate(analysis: InsightAnalysis): Promise<NodePathInsight[]> {
    try {
      logger.info('Generating node path insight', { birthChartId: analysis.birthChartId });
      
      if (!analysis.planets) {
        return [];
      }

      const northNode = analysis.planets.find(p => p.id === 10); // North Node
      const southNode = analysis.planets.find(p => p.id === 11); // South Node
      
      if (!northNode || !southNode) {
        return [];
      }
      
      // Get birth chart document
      const birthChart = await this.birthChartService.getBirthChartById(analysis.birthChartId);
      if (!birthChart) {
        throw new ServiceError(`Birth chart not found: ${analysis.birthChartId}`);
      }

      const { insight } = await this.aiService.generateNodeInsight(birthChart);
      
      const baseInsight = this.createBaseInsight(
        insight,
        InsightCategory.PERSONAL_GROWTH,
        InsightSeverity.MEDIUM
      );

      const nodePathInsight: NodePathInsight = {
        ...baseInsight,
        type: this.type,
        northNodeSign: northNode.sign,
        northNodeHouse: northNode.house,
        southNodeSign: southNode.sign,
        southNodeHouse: southNode.house
      };

      this.logGeneration(analysis, 1);
      return [nodePathInsight];
    } catch (error) {
      logger.error('Failed to generate node path insight', { error, birthChartId: analysis.birthChartId });
      throw new ServiceError(`Failed to generate node path insight: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 