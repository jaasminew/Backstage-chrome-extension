export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface StreamChunk {
  content: string;
  done: boolean;
}

export interface AIClient {
  sendMessage(messages: ChatMessage[], systemPrompt?: string): Promise<string>;
  streamMessage(messages: ChatMessage[], systemPrompt?: string): AsyncGenerator<StreamChunk>;
}
