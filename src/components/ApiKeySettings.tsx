import { useState } from 'react';
import { Eye, EyeOff, ExternalLink, Check, AlertCircle } from 'lucide-react';
import { useSettingsStore, MODEL_OPTIONS } from '../store/useSettingsStore';

interface ApiKeyInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  helpUrl?: string;
  helpText?: string;
  models?: string[];
}

function ApiKeyInput({
  label,
  value,
  onChange,
  placeholder,
  helpUrl,
  helpText,
  models,
}: ApiKeyInputProps) {
  const [showKey, setShowKey] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        {value && (
          <span className="flex items-center gap-1 text-xs text-green-600">
            <Check className="w-3 h-3" />
            Configured
          </span>
        )}
      </div>
      <div className="relative">
        <input
          type={showKey ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full border border-gray-200 rounded-lg py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <button
          type="button"
          onClick={() => setShowKey(!showKey)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {models && (
        <p className="text-xs text-gray-500">
          Models: {models.join(', ')}
        </p>
      )}
      {helpUrl && (
        <a
          href={helpUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
        >
          {helpText || 'Get API key'}
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}

export function ApiKeySettings() {
  const { apiKeys, setApiKey, saveChatHistory, setSaveChatHistory, autoFetchTranscript, setAutoFetchTranscript } =
    useSettingsStore();

  const hasAnyKey = !!(apiKeys.openai || apiKeys.anthropic || apiKeys.google || apiKeys.deepseek);

  return (
    <div className="max-w-lg mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure your API keys and preferences
        </p>
      </div>

      {/* Warning if no keys */}
      {!hasAnyKey && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                No API keys configured
              </p>
              <p className="text-xs text-amber-600 mt-1">
                Add at least one AI provider API key to start chatting.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI Provider Keys */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
          AI Providers
        </h2>

        <ApiKeyInput
          label="OpenAI API Key"
          value={apiKeys.openai}
          onChange={(value) => setApiKey('openai', value)}
          placeholder="sk-..."
          helpUrl="https://platform.openai.com/api-keys"
          models={MODEL_OPTIONS.openai.map((m) => m.name)}
        />

        <ApiKeyInput
          label="Anthropic API Key"
          value={apiKeys.anthropic}
          onChange={(value) => setApiKey('anthropic', value)}
          placeholder="sk-ant-..."
          helpUrl="https://console.anthropic.com/settings/keys"
          models={MODEL_OPTIONS.anthropic.map((m) => m.name)}
        />

        <ApiKeyInput
          label="Google AI API Key"
          value={apiKeys.google}
          onChange={(value) => setApiKey('google', value)}
          placeholder="AI..."
          helpUrl="https://aistudio.google.com/app/apikey"
          models={MODEL_OPTIONS.google.map((m) => m.name)}
        />

        <ApiKeyInput
          label="DeepSeek API Key"
          value={apiKeys.deepseek}
          onChange={(value) => setApiKey('deepseek', value)}
          placeholder="sk-..."
          helpUrl="https://platform.deepseek.com/api_keys"
          models={MODEL_OPTIONS.deepseek.map((m) => m.name)}
        />
      </div>

      {/* Tavily (Research) */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
          Speaker Research
        </h2>

        <ApiKeyInput
          label="Tavily API Key (Optional)"
          value={apiKeys.tavily}
          onChange={(value) => setApiKey('tavily', value)}
          placeholder="tvly-..."
          helpUrl="https://tavily.com"
          helpText="Get free API key (1,000 searches/month)"
        />
        <p className="text-xs text-gray-500 -mt-4">
          Used to research speaker backgrounds. Without this, the AI will only use information from the video transcript.
        </p>
      </div>

      {/* Preferences */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
          Preferences
        </h2>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={saveChatHistory}
            onChange={(e) => setSaveChatHistory(e.target.checked)}
            className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700">Save chat history locally</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={autoFetchTranscript}
            onChange={(e) => setAutoFetchTranscript(e.target.checked)}
            className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700">Auto-fetch transcript when video is detected</span>
        </label>
      </div>

      {/* Info */}
      <div className="text-xs text-gray-400 pt-4 border-t">
        <p>
          Your API keys are stored locally in your browser and are only sent to the respective AI providers.
          They are never sent to any other server.
        </p>
      </div>
    </div>
  );
}
