import { IInsight } from '../models/Insight';
import { InsightDTO, InsightAnalysisDTO } from '../dtos/InsightDTO';
import { Types } from 'mongoose';
import { InsightAnalysis, Insight, InsightType, BaseInsight } from '../types/insight.types';

interface InsightAspect {
  bodyId: number;
  type: string;
  orb: number;
}

interface InsightDetail {
  bodyId?: number;
  type: string;
  aspects?: InsightAspect[];
  description: string;
}

export class InsightTransformer {
  static toDTO(insight: IInsight & { _id: Types.ObjectId }): InsightDTO {
    return {
      id: insight._id.toString(),
      content: insight.content,
      type: insight.type as InsightType,
      relevance: insight.relevance,
      tags: insight.tags,
      userId: insight.userId.toString(),
      birthChartId: insight.birthChartId.toString(),
      insights: insight.insights.map(insight => ({
        bodyId: insight.bodyId,
        type: insight.type,
        aspects: insight.aspects?.map(aspect => ({
          bodyId: aspect.bodyId,
          type: aspect.type,
          orb: aspect.orb
        })),
        description: insight.description
      })),
      timestamp: insight.timestamp,
      createdAt: insight.createdAt,
      updatedAt: insight.updatedAt
    };
  }

  static toDTOList(insights: (IInsight & { _id: Types.ObjectId })[]): InsightDTO[] {
    return insights.map(insight => this.toDTO(insight));
  }

  static analysisToDTO(analysis: InsightAnalysis): InsightAnalysisDTO {
    return {
      birthChartId: analysis.birthChartId,
      userId: analysis.userId,
      content: analysis.content,
      type: analysis.type,
      relevance: analysis.relevance,
      tags: analysis.tags,
      status: analysis.status,
      insights: analysis.insights.map(insight => ({
        id: insight.id,
        content: insight.description,
        type: insight.type,
        relevance: 1, // Default relevance for now
        tags: [],
        userId: analysis.userId,
        birthChartId: analysis.birthChartId,
        insights: [], // No nested insights in the DTO
        timestamp: insight.date,
        createdAt: new Date(),
        updatedAt: new Date()
      })),
      overallSummary: analysis.overallSummary,
      createdAt: analysis.createdAt,
      updatedAt: analysis.updatedAt
    };
  }
} 