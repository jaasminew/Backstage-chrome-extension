import { ChevronDown } from 'lucide-react';
import { MODEL_OPTIONS, useSettingsStore } from '../store/useSettingsStore';

interface ModelSelectorProps {
  compact?: boolean;
}

export function ModelSelector({ compact = false }: ModelSelectorProps) {
  const { apiKeys, selectedModel, setSelectedModel } = useSettingsStore();
  
  // Get all available models based on configured API keys
  const availableModels: { id: string; name: string; provider: string }[] = [];
  
  if (apiKeys.openai) {
    availableModels.push(
      ...MODEL_OPTIONS.openai.map((m) => ({ ...m, provider: 'OpenAI' }))
    );
  }
  if (apiKeys.anthropic) {
    availableModels.push(
      ...MODEL_OPTIONS.anthropic.map((m) => ({ ...m, provider: 'Anthropic' }))
    );
  }
  if (apiKeys.google) {
    availableModels.push(
      ...MODEL_OPTIONS.google.map((m) => ({ ...m, provider: 'Google' }))
    );
  }
  if (apiKeys.deepseek) {
    availableModels.push(
      ...MODEL_OPTIONS.deepseek.map((m) => ({ ...m, provider: 'DeepSeek' }))
    );
  }

  // Check if selected model is still available
  const isSelectedAvailable = availableModels.some((m) => m.id === selectedModel);
  
  // If not available, auto-select first available
  if (!isSelectedAvailable && availableModels.length > 0) {
    setSelectedModel(availableModels[0].id);
  }

  if (availableModels.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <div className="relative">
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="appearance-none bg-gray-100 hover:bg-gray-200 rounded-md py-1 pl-2 pr-6 text-xs font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
        >
          {availableModels.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
      </div>
    );
  }

  return (
    <div className="relative">
      <label className="block text-xs font-medium text-gray-500 mb-1">
        AI Model:
      </label>
      <div className="relative">
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="w-full appearance-none bg-white border border-gray-200 rounded-lg py-2 pl-3 pr-10 text-sm font-medium text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          {availableModels.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name} ({model.provider})
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}
