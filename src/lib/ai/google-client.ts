import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIClient, ChatMessage, StreamChunk } from './types';

export class GoogleClient implements AIClient {
  private client: GoogleGenerativeAI;
  private model: string;

  constructor(apiKey: string, model: string = 'gemini-1.5-pro') {
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = model;
  }

  async sendMessage(messages: ChatMessage[], systemPrompt?: string): Promise<string> {
    const genModel = this.client.getGenerativeModel({ 
      model: this.model,
      systemInstruction: systemPrompt || undefined,
    });

    // Convert messages to Gemini format
    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const chat = genModel.startChat({ history });
    const lastMessage = messages[messages.length - 1];
    
    const result = await chat.sendMessage(lastMessage.content);
    return result.response.text();
  }

  async *streamMessage(messages: ChatMessage[], systemPrompt?: string): AsyncGenerator<StreamChunk> {
    const genModel = this.client.getGenerativeModel({ 
      model: this.model,
      systemInstruction: systemPrompt || undefined,
    });

    // Convert messages to Gemini format
    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const chat = genModel.startChat({ history });
    const lastMessage = messages[messages.length - 1];
    
    const result = await chat.sendMessageStream(lastMessage.content);
    
    for await (const chunk of result.stream) {
      const text = chunk.text();
      yield { content: text, done: false };
    }
    
    yield { content: '', done: true };
  }
}
