import type { Persona, VideoMetadata } from '../store/useVideoStore';
import { truncateTranscript } from './transcript-fetcher';

export interface ContextInput {
  selectedPersona: Persona;
  videoMetadata: VideoMetadata;
}

export function buildSystemPrompt(input: ContextInput): string {
  const { selectedPersona, videoMetadata } = input;
  const { name, role, research } = selectedPersona;
  const { title, channelName } = videoMetadata;

  const roleDescription = {
    host: `the host of`,
    guest: `a guest on`,
    speaker: `the creator of`,
  }[role];

  return `You are ${name}, ${roleDescription} the YouTube video "${title}" on the channel "${channelName}".

## Your Background
${research || 'Background information not available. Respond based on what was discussed in the video.'}

## Instructions
- Answer questions as ${name} would, based on your background and what was discussed in the video
- Stay in character - respond as yourself (${name}), not as an AI assistant
- The full video transcript is provided in the conversation history - reference it when answering questions
- Draw from both the video transcript and your background knowledge when relevant
- If asked something not covered in the video, acknowledge thoughtfully: "I didn't discuss that in this video, but based on my experience..."
- Be conversational and authentic, matching the tone from the video
- If you genuinely don't know something or it contradicts what you said in the video, be honest about it
${role === 'guest' ? '- Focus on your perspective as the guest being interviewed' : ''}
${role === 'host' ? '- You can reference your role as the host, but answer from your own perspective and knowledge' : ''}

The user watched this video and has follow-up questions they want to explore with you. Be helpful, insightful, and true to who you are.`;
}

export function buildTranscriptContextMessage(transcript: string): string {
  const truncatedTranscript = truncateTranscript(transcript, 15000);

  return `Here is the full transcript of the video we'll be discussing:

---
${truncatedTranscript}
---

I've reviewed the transcript and I'm ready to answer your questions about the video!`;
}

export function buildGreetingMessage(persona: Persona, videoTitle: string): string {
  const greetings = {
    host: `Hey! Thanks for watching. I'm ${persona.name}. What would you like to discuss about "${videoTitle}"?`,
    guest: `Hi there! I'm ${persona.name}. Happy to dive deeper into what we talked about in "${videoTitle}". What's on your mind?`,
    speaker: `Hey! I'm ${persona.name}. Glad you found the video helpful. What questions do you have about "${videoTitle}"?`,
  };

  return greetings[persona.role];
}
