import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ApiKeys {
  openai: string;
  anthropic: string;
  google: string;
  deepseek: string;
  tavily: string;
}

export interface Settings {
  apiKeys: ApiKeys;
  selectedModel: string;
  saveChatHistory: boolean;
  autoFetchTranscript: boolean;
}

interface SettingsStore extends Settings {
  setApiKey: (provider: keyof ApiKeys, key: string) => void;
  setSelectedModel: (model: string) => void;
  setSaveChatHistory: (save: boolean) => void;
  setAutoFetchTranscript: (auto: boolean) => void;
  hasAnyApiKey: () => boolean;
  getAvailableModels: () => string[];
}

// Available models grouped by provider
export const MODEL_OPTIONS = {
  openai: [
    { id: 'gpt-5-mini', name: 'GPT-5 Mini' },
    { id: 'gpt-4o', name: 'GPT-4o' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
    { id: 'gpt-4', name: 'GPT-4' },
  ],
  anthropic: [
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
    { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
  ],
  google: [
    { id: 'gemini-1.5-pro-latest', name: 'Gemini 1.5 Pro' },
    { id: 'gemini-1.5-flash-latest', name: 'Gemini 1.5 Flash' },
    { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (Experimental)' },
  ],
  deepseek: [
    { id: 'deepseek-chat', name: 'DeepSeek Chat' },
    { id: 'deepseek-coder', name: 'DeepSeek Coder' },
  ],
} as const;

export const getProviderForModel = (modelId: string): keyof ApiKeys | null => {
  for (const [provider, models] of Object.entries(MODEL_OPTIONS)) {
    if (models.some(m => m.id === modelId)) {
      return provider as keyof ApiKeys;
    }
  }
  return null;
};

const initialState: Settings = {
  apiKeys: {
    openai: '',
    anthropic: '',
    google: '',
    deepseek: '',
    tavily: '', // User will fill this in
  },
  selectedModel: 'gpt-5-mini', // Default model
  saveChatHistory: true,
  autoFetchTranscript: true,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setApiKey: (provider, key) =>
        set((state) => ({
          apiKeys: { ...state.apiKeys, [provider]: key },
        })),

      setSelectedModel: (model) => set({ selectedModel: model }),

      setSaveChatHistory: (save) => set({ saveChatHistory: save }),

      setAutoFetchTranscript: (auto) => set({ autoFetchTranscript: auto }),

      hasAnyApiKey: () => {
        const { apiKeys } = get();
        return !!(apiKeys.openai || apiKeys.anthropic || apiKeys.google || apiKeys.deepseek);
      },

      getAvailableModels: () => {
        const { apiKeys } = get();
        const models: string[] = [];

        if (apiKeys.openai) {
          models.push(...MODEL_OPTIONS.openai.map(m => m.id));
        }
        if (apiKeys.anthropic) {
          models.push(...MODEL_OPTIONS.anthropic.map(m => m.id));
        }
        if (apiKeys.google) {
          models.push(...MODEL_OPTIONS.google.map(m => m.id));
        }
        if (apiKeys.deepseek) {
          models.push(...MODEL_OPTIONS.deepseek.map(m => m.id));
        }

        return models;
      },
    }),
    {
      name: 'backstage-settings',
      storage: {
        getItem: async (name) => {
          const result = await chrome.storage.local.get(name);
          return result[name] || null;
        },
        setItem: async (name, value) => {
          await chrome.storage.local.set({ [name]: value });
        },
        removeItem: async (name) => {
          await chrome.storage.local.remove(name);
        },
      },
    }
  )
);
