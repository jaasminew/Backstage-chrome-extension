import type { Persona } from '../store/useVideoStore';
import type { UnifiedAIClient } from './ai/unified-client';

export async function detectSpeakers(
  transcript: string,
  title: string,
  channelName: string,
  aiClient: UnifiedAIClient,
  model: string
): Promise<Persona[]> {
  const prompt = `Analyze this video and identify all speakers/participants.

Video: "${title}"
Channel: ${channelName}

Transcript (first 5000 chars):
${transcript.substring(0, 5000)}

Return ONLY a valid JSON array with this exact format (no markdown, no explanation):
[
  { "name": "Full Name", "role": "host" },
  { "name": "Full Name", "role": "guest" }
]

Rules:
- If solo video (one speaker): Return single speaker with role "speaker"
- If interview/podcast: Identify host and guest(s)
- If panel discussion: List all participants as "speaker"
- Use full names if mentioned in transcript
- Role must be one of: "host", "guest", "speaker"
- If you can't determine names, use descriptive names like "Host" or "Guest"`;

  try {
    const response = await aiClient.sendMessage(model, [{ role: 'user', content: prompt }]);
    
    // Try to extract JSON from the response
    let jsonStr = response.trim();
    
    // Remove markdown code blocks if present
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    }
    
    const personas = JSON.parse(jsonStr) as Persona[];
    
    // Validate the structure
    if (Array.isArray(personas) && personas.length > 0) {
      return personas.map((p) => ({
        name: p.name || channelName,
        role: ['host', 'guest', 'speaker'].includes(p.role) ? p.role : 'speaker',
      }));
    }
  } catch (error) {
    console.error('[Speaker Detection] Failed to parse response:', error);
  }

  // Fallback: Single speaker = channel name
  return [{ name: channelName, role: 'speaker' }];
}
