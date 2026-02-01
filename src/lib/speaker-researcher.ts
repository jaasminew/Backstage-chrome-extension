import type { UnifiedAIClient } from './ai/unified-client';

interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
}

interface TavilyResponse {
  results: TavilySearchResult[];
  answer?: string;
}

export async function researchSpeaker(
  speakerName: string,
  tavilyApiKey: string,
  channelName?: string
): Promise<string> {
  if (!tavilyApiKey) {
    return `${speakerName} from ${channelName || 'this video'}. Background research unavailable (no Tavily API key).`;
  }

  try {
    const searchQuery = `${speakerName} ${channelName || ''} background biography expertise`.trim();

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: tavilyApiKey,
        query: searchQuery,
        search_depth: 'basic',
        include_answer: true,
        max_results: 5,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status}`);
    }

    const searchData: TavilyResponse = await response.json();

    // Combine results into context
    const searchContext = searchData.results
      .map((r) => `${r.title}: ${r.content}`)
      .join('\n\n');

    return searchContext || `${speakerName} - search returned no results.`;
  } catch (error) {
    console.error('[Research] Tavily error:', error);
    return `${speakerName} from ${channelName || 'this video'}. For more information, see the video transcript.`;
  }
}

export async function summarizeResearch(
  searchContext: string,
  speakerName: string,
  aiClient: UnifiedAIClient,
  model: string
): Promise<string> {
  const prompt = `Based on the following web search results about ${speakerName}, provide a concise background summary:

${searchContext}

Include (if available):
1. Brief background (2-3 sentences)
2. Main areas of expertise
3. Recent notable work
4. Key ideas they're known for

Keep under 300 words. If limited info is available, just summarize what you can.`;

  try {
    const summary = await aiClient.sendMessage(model, [{ role: 'user', content: prompt }]);
    return summary;
  } catch (error) {
    console.error('[Research] Summarization error:', error);
    return searchContext.substring(0, 500) + '...';
  }
}
