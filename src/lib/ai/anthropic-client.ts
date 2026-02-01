import Anthropic from '@anthropic-ai/sdk';
import type { AIClient, ChatMessage, StreamChunk } from './types';

export class AnthropicClient implements AIClient {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model: string = 'claude-3-5-sonnet-20241022') {
    this.client = new Anthropic({
      apiKey,
      dangerouslyAllowBrowser: true,
    });
    this.model = model;
  }

  async sendMessage(messages: ChatMessage[], systemPrompt?: string): Promise<string> {
    const formattedMessages = messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system: systemPrompt || undefined,
      messages: formattedMessages,
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    return textBlock?.type === 'text' ? textBlock.text : '';
  }

  async *streamMessage(messages: ChatMessage[], systemPrompt?: string): AsyncGenerator<StreamChunk> {
    const formattedMessages = messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: 4096,
      system: systemPrompt || undefined,
      messages: formattedMessages,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield { content: event.delta.text, done: false };
      } else if (event.type === 'message_stop') {
        yield { content: '', done: true };
      }
    }
  }
}
