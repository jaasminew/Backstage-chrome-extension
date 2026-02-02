import { useState, useRef, useEffect } from 'react';
import { Send, ArrowLeft, Settings } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PersonaSelector } from './PersonaSelector';
import { ModelSelector } from './ModelSelector';
import { useChatStore } from '../store/useChatStore';
import { useVideoStore } from '../store/useVideoStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { UnifiedAIClient } from '../lib/ai/unified-client';
import { buildSystemPrompt, buildGreetingMessage, buildTranscriptContextMessage } from '../lib/context-builder';

interface ChatInterfaceProps {
  onBack: () => void;
}

export function ChatInterface({ onBack }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const initializedPersonaRef = useRef<string | null>(null);

  const {
    messages,
    isStreaming,
    streamingContent,
    addMessage,
    setIsStreaming,
    setStreamingContent,
    appendStreamingContent,
    finalizeStreaming,
    pruneMessages,
    clearMessages,
  } = useChatStore();

  const {
    currentVideo,
    transcript,
    personas,
    selectedPersona,
    systemPrompt,
    setSelectedPersona,
    setSystemPrompt,
    updatePersonaResearch,
  } = useVideoStore();

  const { apiKeys, selectedModel } = useSettingsStore();

  // Build system prompt when persona changes
  useEffect(() => {
    if (selectedPersona && transcript && currentVideo) {
      const personaKey = selectedPersona.name;

      // Only initialize if this persona hasn't been initialized yet
      if (initializedPersonaRef.current !== personaKey) {
        initializedPersonaRef.current = personaKey;

        // Build system prompt WITHOUT transcript (transcript goes in messages)
        const prompt = buildSystemPrompt({
          selectedPersona,
          videoMetadata: currentVideo,
        });
        setSystemPrompt(prompt);

        // Add initial messages
        // First message: transcript context
        const transcriptContext = buildTranscriptContextMessage(transcript);
        addMessage({ role: 'assistant', content: transcriptContext });

        // Second message: greeting
        const greeting = buildGreetingMessage(selectedPersona, currentVideo.title);
        addMessage({ role: 'assistant', content: greeting });

        console.log('[ChatInterface] Initialized chat for persona:', personaKey);
        console.log('[ChatInterface] System prompt set:', !!prompt);
      }
    }
  }, [selectedPersona, transcript, currentVideo]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Handle persona change
  const handlePersonaChange = async (persona: typeof selectedPersona) => {
    if (persona && persona.name !== selectedPersona?.name) {
      // Reset initialization tracking
      initializedPersonaRef.current = null;
      clearMessages();
      setSelectedPersona(persona);

      // Trigger research for the newly selected persona if not already researched
      if (!persona.research && currentVideo) {
        try {
          const response = await chrome.runtime.sendMessage({
            action: 'RESEARCH_PERSONA',
            data: {
              videoId: currentVideo.videoId,
              persona,
              apiKeys,
              selectedModel,
            },
          });

          if (response.success) {
            updatePersonaResearch(response.personaName, response.research);
          }
        } catch (err) {
          console.error('[ChatInterface] Research error:', err);
        }
      }
    }
  };

  // Send message
  const handleSend = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isStreaming || !systemPrompt) {
      console.log('[ChatInterface] Cannot send:', {
        hasInput: !!trimmedInput,
        isStreaming,
        hasSystemPrompt: !!systemPrompt
      });
      return;
    }

    console.log('[ChatInterface] Sending message:', trimmedInput);

    // Prune messages before adding new one
    pruneMessages();

    // Add user message
    addMessage({ role: 'user', content: trimmedInput });
    setInput('');
    setIsStreaming(true);
    setStreamingContent('');

    try {
      const aiClient = new UnifiedAIClient(apiKeys);

      // Prepare messages for AI (after pruning, includes transcript in first message)
      const aiMessages = [
        ...messages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user' as const, content: trimmedInput },
      ];

      // Stream response with system prompt (no transcript in system prompt anymore)
      const stream = aiClient.streamMessage(selectedModel, aiMessages, systemPrompt);

      for await (const chunk of stream) {
        if (chunk.content) {
          appendStreamingContent(chunk.content);
        }
      }

      finalizeStreaming();
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      addMessage({
        role: 'assistant',
        content: `Sorry, I encountered an error: ${errorMessage}`,
      });
      setIsStreaming(false);
      setStreamingContent('');
    }
  };

  // Handle enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between p-3">
          <button
            onClick={onBack}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <ModelSelector compact />
          <button
            onClick={() => chrome.runtime.openOptionsPage()}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Persona Selector */}
        {personas.length > 1 && (
          <div className="px-3 pb-3">
            <PersonaSelector
              personas={personas}
              selected={selectedPersona}
              onChange={handlePersonaChange}
              disabled={isStreaming}
            />
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={
                message.role === 'user' ? 'message-user' : 'message-assistant'
              }
            >
              <div className="message-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}

        {/* Streaming content */}
        {isStreaming && streamingContent && (
          <div className="flex justify-start">
            <div className="message-assistant">
              <div className="message-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {streamingContent}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {isStreaming && !streamingContent && (
          <div className="flex justify-start">
            <div className="message-assistant">
              <div className="loading-dots flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full" />
                <span className="w-2 h-2 bg-gray-400 rounded-full" />
                <span className="w-2 h-2 bg-gray-400 rounded-full" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-white p-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask ${selectedPersona?.name || 'the speaker'} anything...`}
            disabled={isStreaming}
            rows={1}
            className="flex-1 resize-none border border-gray-200 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed max-h-32"
            style={{ minHeight: '44px' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 128) + 'px';
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="p-2.5 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
