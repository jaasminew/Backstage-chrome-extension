/// <reference types="chrome"/>

import { fetchTranscript } from '../lib/transcript-fetcher';
import { detectSpeakers } from '../lib/speaker-detector';
import { researchSpeaker, summarizeResearch } from '../lib/speaker-researcher';
import { UnifiedAIClient } from '../lib/ai/unified-client';
import { getCachedVideoData, setCachedVideoData, updatePersonaResearch, clearExpiredCache } from '../lib/cache-manager';
import type { VideoMetadata, Persona } from '../store/useVideoStore';
import type { ApiKeys } from '../store/useSettingsStore';

interface ExtensionState {
  currentVideo: VideoMetadata | null;
}

const state: ExtensionState = {
  currentVideo: null,
};

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id) {
    await chrome.sidePanel.open({ tabId: tab.id });
  }
});

// Set up side panel behavior
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Clear expired cache on startup
clearExpiredCache();

// Handle messages from content script and side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender, sendResponse);
  return true; // Keep the message channel open for async response
});

async function handleMessage(
  message: { action: string; data?: unknown },
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void
) {
  try {
    switch (message.action) {
      case 'VIDEO_INFO': {
        const videoData = message.data as VideoMetadata;
        state.currentVideo = videoData;
        
        // Broadcast to all extension pages
        chrome.runtime.sendMessage({
          action: 'VIDEO_INFO_UPDATED',
          data: videoData,
        }).catch(() => {
          // Ignore if no listeners
        });
        
        sendResponse({ success: true });
        break;
      }

      case 'GET_CURRENT_VIDEO': {
        // First try to get from content script for fresh data
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (tab?.id && tab.url?.includes('youtube.com')) {
          try {
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'GET_VIDEO_INFO' });
            if (response?.success && response.data) {
              state.currentVideo = response.data;
            }
          } catch {
            // Content script not ready, use cached
          }
        }
        
        sendResponse({ success: true, data: state.currentVideo });
        break;
      }

      case 'START_CHAT': {
        const { apiKeys, selectedModel } = message.data as {
          apiKeys: ApiKeys;
          selectedModel: string;
        };

        if (!state.currentVideo) {
          sendResponse({ success: false, error: 'No video detected' });
          break;
        }

        try {
          const videoId = state.currentVideo.videoId;
          let transcript: string;
          let personas: Persona[];

          // 1. Check cache first
          const cached = await getCachedVideoData(videoId);

          if (cached) {
            console.log('[Background] Using cached data for video:', videoId);
            transcript = cached.transcript;
            personas = cached.personas;
          } else {
            console.log('[Background] No cache, fetching fresh data for video:', videoId);

            // 2. Fetch transcript
            transcript = await fetchTranscript(videoId);

            // 3. Detect speakers using AI
            const aiClient = new UnifiedAIClient(apiKeys);
            personas = await detectSpeakers(
              transcript,
              state.currentVideo.title,
              state.currentVideo.channelName,
              aiClient,
              selectedModel
            );

            // 4. Cache the results (without research)
            await setCachedVideoData({
              videoId,
              timestamp: Date.now(),
              transcript,
              personas,
            });
          }

          // Return transcript and personas (research happens later on demand)
          sendResponse({
            success: true,
            personas,
            transcript,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          sendResponse({ success: false, error: errorMessage });
        }
        break;
      }

      case 'RESEARCH_PERSONA': {
        const { videoId, persona, apiKeys, selectedModel } = message.data as {
          videoId: string;
          persona: Persona;
          apiKeys: ApiKeys;
          selectedModel: string;
        };

        try {
          console.log('[Background] Researching persona:', persona.name);

          const searchResults = await researchSpeaker(
            persona.name,
            apiKeys.tavily,
            state.currentVideo?.channelName
          );

          const aiClient = new UnifiedAIClient(apiKeys);
          const research = await summarizeResearch(
            searchResults,
            persona.name,
            aiClient,
            selectedModel
          );

          // Update cache with research
          await updatePersonaResearch(videoId, persona.name, research);

          sendResponse({
            success: true,
            personaName: persona.name,
            research,
          });
        } catch (error) {
          console.error(`[Background] Failed to research ${persona.name}:`, error);
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : 'Research failed'
          });
        }
        break;
      }

      default:
        sendResponse({ success: false, error: `Unknown action: ${message.action}` });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    sendResponse({ success: false, error: errorMessage });
  }
}
