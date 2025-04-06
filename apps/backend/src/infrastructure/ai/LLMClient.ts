import OpenAI from 'openai';
import { config } from '../../config';

// Define the type for chat messages
interface ChatCompletionRequestMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class LLMClient {
  private openai: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-4') {
    this.openai = new OpenAI({ apiKey });
    this.model = model;
  }

  async generateInsight(prompt: string): Promise<string> {
    const response = await this.openai.completions.create({
      model: this.model,
      prompt,
      max_tokens: 150,
      temperature: 0.7
    });
    return response.choices[0].text.trim();
  }

  async chat(messages: ChatCompletionRequestMessage[]): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages
    });
    return response.choices[0].message?.content?.trim() || '';
  }

  // Future support for streaming responses
  // async streamChat(messages: ChatCompletionRequestMessage[]): Promise<ReadableStream> {
  //   // Implementation for streaming responses
  // }
} 