import { OpenAI } from 'openai';
import { IAIClient, CompletionRequest, CompletionResponse } from '../ports/IAIClient';

export class OpenAIClient implements IAIClient {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generateCompletion(request: CompletionRequest): Promise<CompletionResponse> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: request.prompt }],
      max_tokens: request.maxTokens || 150,
      temperature: request.temperature || 0.7,
      top_p: request.topP || 1,
      frequency_penalty: request.frequencyPenalty || 0,
      presence_penalty: request.presencePenalty || 0
    });

    return {
      text: response.choices[0]?.message?.content || '',
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0
      }
    };
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text
    });

    return response.data[0]?.embedding || [];
  }
} 