import { YoutubeTranscript } from 'youtube-transcript';

export interface TranscriptItem {
  text: string;
  duration: number;
  offset: number;
}

export async function fetchTranscript(videoId: string): Promise<string> {
  try {
    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
    
    const fullTranscript = transcriptItems
      .map((item: TranscriptItem) => item.text)
      .join(' ')
      .trim();

    return fullTranscript;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes('disabled') || errorMessage.includes('Transcript is disabled')) {
      throw new Error('Transcript is disabled for this video. The creator may not have enabled captions.');
    }
    
    if (errorMessage.includes('Could not find')) {
      throw new Error('No transcript available for this video.');
    }
    
    throw new Error(`Failed to fetch transcript: ${errorMessage}`);
  }
}

export function truncateTranscript(transcript: string, maxChars: number = 15000): string {
  if (transcript.length <= maxChars) {
    return transcript;
  }

  const truncated = transcript.substring(0, maxChars);
  const lastPeriod = truncated.lastIndexOf('.');
  
  if (lastPeriod > maxChars * 0.8) {
    return truncated.substring(0, lastPeriod + 1) + '\n\n[Transcript truncated for length]';
  }
  
  return truncated + '...\n\n[Transcript truncated for length]';
}
