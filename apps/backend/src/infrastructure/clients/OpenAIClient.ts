import { Configuration, OpenAIApi } from 'openai';
import { IAIClient, CompletionRequest, CompletionResponse } from '../../domain/ports/IAIClient';

export class OpenAIClient implements IAIClient {
  private client: OpenAIApi;

  constructor(apiKey: string) {
    const configuration = new Configuration({ apiKey });
    this.client = new OpenAIApi(configuration);
  }

  async generateCompletion(request: CompletionRequest): Promise<CompletionResponse> {
    const response = await this.client.createCompletion({
      model: 'text-davinci-003',
      prompt: request.prompt,
      max_tokens: request.maxTokens || 150,
      temperature: request.temperature || 0.7,
      top_p: request.topP || 1,
      frequency_penalty: request.frequencyPenalty || 0,
      presence_penalty: request.presencePenalty || 0
    });

    return {
      text: response.data.choices[0]?.text || '',
      usage: {
        promptTokens: response.data.usage?.prompt_tokens || 0,
        completionTokens: response.data.usage?.completion_tokens || 0,
        totalTokens: response.data.usage?.total_tokens || 0
      }
    };
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.client.createEmbedding({
      model: 'text-embedding-ada-002',
      input: text
    });

    return response.data.data[0]?.embedding || [];
  }
} 