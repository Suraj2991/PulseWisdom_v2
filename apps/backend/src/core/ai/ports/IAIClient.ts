export interface CompletionRequest {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface CompletionResponse {
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface IAIClient {
  generateCompletion(request: CompletionRequest): Promise<CompletionResponse>;
  generateEmbedding(text: string): Promise<number[]>;
} 