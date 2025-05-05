import OpenAI from 'openai';
import { config } from '../../../shared/config';
import { ServiceUnavailableError } from '../../../domain/errors';
import { IAIClient, CompletionRequest, CompletionResponse } from '../ports/IAIClient';
import { ICache } from '../../../infrastructure/cache/ICache';

// Define the type for chat messages
interface ChatCompletionRequestMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class LLMClient implements IAIClient {
  private openai: OpenAI;
  private model: string;

  constructor(
    private readonly cache: ICache,
    private apiKey: string
  ) {
    this.openai = new OpenAI({
      apiKey: this.apiKey,
      timeout: config.ai.timeoutMs,
      maxRetries: config.ai.maxRetries
    });
    this.model = config.ai.model;
  }

  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    operation: string,
    retries = config.ai.maxRetries
  ): Promise<T> {
    let lastError: unknown;
    for (let i = 0; i < retries; i++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, config.ai.retryDelayMs));
        }
      }
    }
    throw this.handleOpenAIError(lastError, operation);
  }

  private handleOpenAIError(error: unknown, operation: string): never {
    if (error instanceof Error) {
      throw new ServiceUnavailableError(
        `Failed to ${operation}: ${error.message}`,
        { originalError: error }
      );
    }
    throw new ServiceUnavailableError(
      `Failed to ${operation}: Unknown error occurred`,
      { originalError: error }
    );
  }

  async generateCompletion(request: CompletionRequest): Promise<CompletionResponse> {
    return this.retryRequest(
      async () => {
        const response = await this.openai.completions.create({
          model: this.model,
          prompt: request.prompt,
          max_tokens: request.maxTokens || 150,
          temperature: request.temperature || 0.7,
          top_p: request.topP,
          frequency_penalty: request.frequencyPenalty,
          presence_penalty: request.presencePenalty
        });

        return {
          text: response.choices[0].text.trim(),
          usage: {
            promptTokens: response.usage?.prompt_tokens || 0,
            completionTokens: response.usage?.completion_tokens || 0,
            totalTokens: response.usage?.total_tokens || 0
          }
        };
      },
      'generate completion'
    );
  }

  async generateEmbedding(text: string): Promise<number[]> {
    return this.retryRequest(
      async () => {
        const response = await this.openai.embeddings.create({
          model: 'text-embedding-ada-002',
          input: text
        });
        return response.data[0].embedding;
      },
      'generate embedding'
    );
  }

  async generateInsight(prompt: string): Promise<string> {
    return this.retryRequest(
      async () => {
        const response = await this.openai.completions.create({
          model: this.model,
          prompt,
          max_tokens: 150,
          temperature: 0.7
        });
        return response.choices[0].text.trim();
      },
      'generate insight'
    );
  }

  async chat(messages: ChatCompletionRequestMessage[]): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages
      });
      return response.choices[0].message?.content?.trim() || '';
    } catch (error) {
      this.handleOpenAIError(error, 'chat completion');
    }
  }

  // Future support for streaming responses
  // async streamChat(messages: ChatCompletionRequestMessage[]): Promise<ReadableStream> {
  //   // Implementation for streaming responses
  // }
} 