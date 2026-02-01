/// <reference types="chrome"/>

import type { Persona } from '../store/useVideoStore';

export interface CachedVideoData {
  videoId: string;
  timestamp: number;
  transcript: string;
  personas: Persona[]; // without research initially
}

const CACHE_PREFIX = 'backstage-cache-';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export async function getCachedVideoData(videoId: string): Promise<CachedVideoData | null> {
  try {
    const key = CACHE_PREFIX + videoId;
    const result = await chrome.storage.local.get(key);
    const cached = result[key] as CachedVideoData | undefined;

    if (!cached) {
      return null;
    }

    // Check if cache is still fresh
    const age = Date.now() - cached.timestamp;
    if (age > CACHE_TTL) {
      // Cache expired, remove it
      await chrome.storage.local.remove(key);
      return null;
    }

    return cached;
  } catch (error) {
    console.error('[Cache] Error reading cache:', error);
    return null;
  }
}

export async function setCachedVideoData(data: CachedVideoData): Promise<void> {
  try {
    const key = CACHE_PREFIX + data.videoId;
    await chrome.storage.local.set({ [key]: data });
  } catch (error) {
    console.error('[Cache] Error writing cache:', error);
  }
}

export async function updatePersonaResearch(
  videoId: string,
  personaName: string,
  research: string
): Promise<void> {
  try {
    const cached = await getCachedVideoData(videoId);
    if (!cached) {
      return;
    }

    // Update the persona's research field
    const updatedPersonas = cached.personas.map((p) =>
      p.name === personaName ? { ...p, research } : p
    );

    await setCachedVideoData({
      ...cached,
      personas: updatedPersonas,
    });
  } catch (error) {
    console.error('[Cache] Error updating persona research:', error);
  }
}

export async function clearExpiredCache(): Promise<void> {
  try {
    const allItems = await chrome.storage.local.get(null);
    const now = Date.now();
    const keysToRemove: string[] = [];

    for (const [key, value] of Object.entries(allItems)) {
      if (key.startsWith(CACHE_PREFIX)) {
        const cached = value as CachedVideoData;
        const age = now - cached.timestamp;
        if (age > CACHE_TTL) {
          keysToRemove.push(key);
        }
      }
    }

    if (keysToRemove.length > 0) {
      await chrome.storage.local.remove(keysToRemove);
      console.log(`[Cache] Cleared ${keysToRemove.length} expired cache entries`);
    }
  } catch (error) {
    console.error('[Cache] Error clearing expired cache:', error);
  }
}
