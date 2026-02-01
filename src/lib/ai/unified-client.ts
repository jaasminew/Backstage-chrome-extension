import { OpenAIClient } from './openai-client';
import { AnthropicClient } from './anthropic-client';
import { GoogleClient } from './google-client';
import { DeepSeekClient } from './deepseek-client';
import type { AIClient, ChatMessage, StreamChunk } from './types';
import { getProviderForModel, type ApiKeys } from '../../store/useSettingsStore';

export class UnifiedAIClient {
  private clients: Map<string, AIClient> = new Map();
  private apiKeys: ApiKeys;

  constructor(apiKeys: ApiKeys) {
    this.apiKeys = apiKeys;
  }

  private getClient(model: string): AIClient {
    // Check if we already have a client for this model
    if (this.clients.has(model)) {
      return this.clients.get(model)!;
    }

    const provider = getProviderForModel(model);
    if (!provider) {
      throw new Error(`Unknown model: ${model}`);
    }

    let client: AIClient;

    switch (provider) {
      case 'openai':
        if (!this.apiKeys.openai) {
          throw new Error('OpenAI API key not configured');
        }
        client = new OpenAIClient(this.apiKeys.openai, model);
        break;

      case 'anthropic':
        if (!this.apiKeys.anthropic) {
          throw new Error('Anthropic API key not configured');
        }
        client = new AnthropicClient(this.apiKeys.anthropic, model);
        break;

      case 'google':
        if (!this.apiKeys.google) {
          throw new Error('Google API key not configured');
        }
        client = new GoogleClient(this.apiKeys.google, model);
        break;

      case 'deepseek':
        if (!this.apiKeys.deepseek) {
          throw new Error('DeepSeek API key not configured');
        }
        client = new DeepSeekClient(this.apiKeys.deepseek, model);
        break;

      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    this.clients.set(model, client);
    return client;
  }

  async sendMessage(model: string, messages: ChatMessage[], systemPrompt?: string): Promise<string> {
    const client = this.getClient(model);
    return client.sendMessage(messages, systemPrompt);
  }

  async *streamMessage(model: string, messages: ChatMessage[], systemPrompt?: string): AsyncGenerator<StreamChunk> {
    const client = this.getClient(model);
    yield* client.streamMessage(messages, systemPrompt);
  }
}

export type { ChatMessage, StreamChunk };
