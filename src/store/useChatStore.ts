import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ChatStore {
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingContent: string;
  
  // Actions
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateLastAssistantMessage: (content: string) => void;
  setIsStreaming: (streaming: boolean) => void;
  setStreamingContent: (content: string) => void;
  appendStreamingContent: (chunk: string) => void;
  finalizeStreaming: () => void;
  pruneMessages: () => void;
  clearMessages: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  isStreaming: false,
  streamingContent: '',

  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id: generateId(),
          timestamp: Date.now(),
        },
      ],
    })),

  updateLastAssistantMessage: (content) =>
    set((state) => {
      const messages = [...state.messages];
      const lastIndex = messages.length - 1;
      if (lastIndex >= 0 && messages[lastIndex].role === 'assistant') {
        messages[lastIndex] = { ...messages[lastIndex], content };
      }
      return { messages };
    }),

  setIsStreaming: (streaming) => set({ isStreaming: streaming }),

  setStreamingContent: (content) => set({ streamingContent: content }),

  appendStreamingContent: (chunk) =>
    set((state) => ({
      streamingContent: state.streamingContent + chunk,
    })),

  finalizeStreaming: () => {
    const { streamingContent } = get();
    if (streamingContent) {
      set((state) => ({
        messages: [
          ...state.messages,
          {
            id: generateId(),
            role: 'assistant',
            content: streamingContent,
            timestamp: Date.now(),
          },
        ],
        streamingContent: '',
        isStreaming: false,
      }));
    } else {
      set({ isStreaming: false, streamingContent: '' });
    }
  },

  pruneMessages: () =>
    set((state) => {
      const { messages } = state;

      // Only prune if we have more than 22 messages (first + 20 recent + buffer)
      if (messages.length <= 22) {
        return state;
      }

      // Keep first message (transcript context) and last 20 messages
      const prunedMessages = [
        messages[0], // First message with transcript
        ...messages.slice(-20), // Last 20 messages
      ];

      console.log(`[Chat] Pruned ${messages.length - prunedMessages.length} messages`);

      return { messages: prunedMessages };
    }),

  clearMessages: () => set({ messages: [], streamingContent: '', isStreaming: false }),
}));
