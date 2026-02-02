import { StrictMode, useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { VideoDetection } from './components/VideoDetection';
import { ChatInterface } from './components/ChatInterface';
import { useVideoStore, type Persona } from './store/useVideoStore';
import { useSettingsStore } from './store/useSettingsStore';
import { useChatStore } from './store/useChatStore';
import './index.css';

type View = 'detection' | 'chat';

function App() {
  const [view, setView] = useState<View>('detection');
  const [isStarting, setIsStarting] = useState(false);

  const {
    currentVideo,
    transcript,
    personas,
    selectedPersona,
    setCurrentVideo,
    setPersonas,
    setTranscript,
    setSelectedPersona,
    updatePersonaResearch,
    error,
    setError,
    reset,
  } = useVideoStore();

  const { apiKeys, selectedModel, hasAnyApiKey } = useSettingsStore();
  const { clearMessages } = useChatStore();

  // Debug: log store state changes
  useEffect(() => {
    console.log('[Sidepanel] Store state:', {
      hasCurrentVideo: !!currentVideo,
      videoId: currentVideo?.videoId,
      hasTranscript: !!transcript,
      transcriptLength: transcript?.length,
      personasCount: personas.length,
      hasSelectedPersona: !!selectedPersona,
      selectedPersonaName: selectedPersona?.name,
    });
  }, [currentVideo, transcript, personas, selectedPersona]);

  // Get current video info on mount and listen for updates
  useEffect(() => {
    // Get initial video info
    chrome.runtime.sendMessage({ action: 'GET_CURRENT_VIDEO' }, (response) => {
      if (response?.success && response.data) {
        setCurrentVideo(response.data);
      }
    });

    // Listen for video changes
    const handleMessage = (message: { action: string; data?: unknown }) => {
      if (message.action === 'VIDEO_INFO_UPDATED') {
        const newVideo = message.data as typeof currentVideo;

        // If video changed, reset state
        if (newVideo?.videoId !== currentVideo?.videoId) {
          reset();
          clearMessages();
          setView('detection');
          setCurrentVideo(newVideo);
        }
        // Don't call setCurrentVideo if video hasn't changed - it resets transcript!
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, [currentVideo?.videoId]);

  // Trigger research for a persona
  const triggerPersonaResearch = useCallback(async (persona: Persona, videoId: string) => {
    if (!persona || !videoId) return;

    try {
      console.log('[Sidepanel] Triggering research for:', persona.name);

      const response = await chrome.runtime.sendMessage({
        action: 'RESEARCH_PERSONA',
        data: {
          videoId,
          persona,
          apiKeys,
          selectedModel,
        },
      });

      if (response.success) {
        console.log('[Sidepanel] Research completed for:', response.personaName);
        updatePersonaResearch(response.personaName, response.research);
      } else {
        console.error('[Sidepanel] Research failed:', response.error);
      }
    } catch (err) {
      console.error('[Sidepanel] Research error:', err);
    }
  }, [apiKeys, selectedModel, updatePersonaResearch]);

  // Start chat flow
  const handleStartChat = useCallback(async () => {
    if (!currentVideo || isStarting) return;

    console.log('[Sidepanel] Starting chat for video:', currentVideo.videoId);
    setIsStarting(true);
    setError(null);

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'START_CHAT',
        data: { apiKeys, selectedModel },
      });

      console.log('[Sidepanel] START_CHAT response:', {
        success: response.success,
        hasTranscript: !!response.transcript,
        transcriptLength: response.transcript?.length,
        personasCount: response.personas?.length,
        personas: response.personas,
      });

      if (response.success) {
        console.log('[Sidepanel] Setting transcript, length:', response.transcript?.length);
        setTranscript(response.transcript);

        console.log('[Sidepanel] Setting personas:', response.personas);
        setPersonas(response.personas);

        // Auto-select first persona if only one
        if (response.personas.length === 1) {
          const persona = response.personas[0];
          console.log('[Sidepanel] Auto-selecting persona:', persona.name);
          setSelectedPersona(persona);
          // Trigger research in background for the selected persona
          triggerPersonaResearch(persona, currentVideo.videoId);
        }

        console.log('[Sidepanel] Switching to chat view');
        setView('chat');
      } else {
        setError(response.error || 'Failed to start chat');
      }
    } catch (err) {
      console.error('Start chat error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start chat');
    } finally {
      setIsStarting(false);
    }
  }, [currentVideo, apiKeys, selectedModel, isStarting, triggerPersonaResearch]);

  // Handle back from chat
  const handleBack = () => {
    setView('detection');
    clearMessages();
    setPersonas([]);
    setSelectedPersona(null);
    setTranscript(null);
  };

  return (
    <div className="h-screen flex flex-col">
      {view === 'detection' ? (
        <VideoDetection
          video={currentVideo}
          isLoading={isStarting}
          error={error}
          onStartChat={handleStartChat}
          hasApiKey={hasAnyApiKey()}
        />
      ) : (
        <ChatInterface onBack={handleBack} />
      )}
    </div>
  );
}

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
