import { create } from 'zustand';

export interface Persona {
  name: string;
  role: 'host' | 'guest' | 'speaker';
  research?: string;
}

export interface VideoMetadata {
  videoId: string;
  title: string;
  channelName: string;
}

interface VideoStore {
  // Current video info
  currentVideo: VideoMetadata | null;
  transcript: string | null;
  
  // Detected personas
  personas: Persona[];
  selectedPersona: Persona | null;
  
  // Loading states
  isLoadingVideo: boolean;
  isLoadingTranscript: boolean;
  isLoadingPersonas: boolean;
  
  // Error state
  error: string | null;
  
  // Context ready for chat
  systemPrompt: string | null;
  contextReady: boolean;
  
  // Actions
  setCurrentVideo: (video: VideoMetadata | null) => void;
  setTranscript: (transcript: string | null) => void;
  setPersonas: (personas: Persona[]) => void;
  setSelectedPersona: (persona: Persona | null) => void;
  updatePersonaResearch: (personaName: string, research: string) => void;
  setIsLoadingVideo: (loading: boolean) => void;
  setIsLoadingTranscript: (loading: boolean) => void;
  setIsLoadingPersonas: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSystemPrompt: (prompt: string | null) => void;
  setContextReady: (ready: boolean) => void;
  reset: () => void;
}

const initialState = {
  currentVideo: null,
  transcript: null,
  personas: [],
  selectedPersona: null,
  isLoadingVideo: false,
  isLoadingTranscript: false,
  isLoadingPersonas: false,
  error: null,
  systemPrompt: null,
  contextReady: false,
};

export const useVideoStore = create<VideoStore>((set) => ({
  ...initialState,

  setCurrentVideo: (video) => set({ 
    currentVideo: video,
    // Reset related state when video changes
    transcript: null,
    personas: [],
    selectedPersona: null,
    systemPrompt: null,
    contextReady: false,
    error: null,
  }),

  setTranscript: (transcript) => set({ transcript }),
  
  setPersonas: (personas) => set({ personas }),

  setSelectedPersona: (persona) => set({ selectedPersona: persona }),

  updatePersonaResearch: (personaName, research) =>
    set((state) => {
      // Update the research field for the matching persona
      const updatedPersonas = state.personas.map((p) =>
        p.name === personaName ? { ...p, research } : p
      );

      // Also update selectedPersona if it matches
      const updatedSelectedPersona =
        state.selectedPersona?.name === personaName
          ? { ...state.selectedPersona, research }
          : state.selectedPersona;

      return {
        personas: updatedPersonas,
        selectedPersona: updatedSelectedPersona,
      };
    }),

  setIsLoadingVideo: (loading) => set({ isLoadingVideo: loading }),
  
  setIsLoadingTranscript: (loading) => set({ isLoadingTranscript: loading }),
  
  setIsLoadingPersonas: (loading) => set({ isLoadingPersonas: loading }),
  
  setError: (error) => set({ error }),
  
  setSystemPrompt: (prompt) => set({ systemPrompt: prompt }),
  
  setContextReady: (ready) => set({ contextReady: ready }),
  
  reset: () => set(initialState),
}));
