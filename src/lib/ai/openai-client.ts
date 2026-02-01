import OpenAI from 'openai';
import type { AIClient, ChatMessage, StreamChunk } from './types';

export class OpenAIClient implements AIClient {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-4o') {
    this.client = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
    });
    this.model = model;
  }

  async sendMessage(messages: ChatMessage[], systemPrompt?: string): Promise<string> {
    const formattedMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    
    if (systemPrompt) {
      formattedMessages.push({ role: 'system', content: systemPrompt });
    }
    
    formattedMessages.push(
      ...messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))
    );

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: formattedMessages,
    });

    return response.choices[0]?.message?.content || '';
  }

  async *streamMessage(messages: ChatMessage[], systemPrompt?: string): AsyncGenerator<StreamChunk> {
    const formattedMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    
    if (systemPrompt) {
      formattedMessages.push({ role: 'system', content: systemPrompt });
    }
    
    formattedMessages.push(
      ...messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))
    );

    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages: formattedMessages,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      const done = chunk.choices[0]?.finish_reason === 'stop';
      yield { content, done };
    }
  }
}
