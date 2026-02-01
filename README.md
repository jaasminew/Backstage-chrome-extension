# Backstage

> Go backstage with YouTube creators. When the interview ends but your questions don't, chat with AI-impersonated hosts and guests to explore what wasn't covered.

A Chrome extension that lets you have deeper conversations after the video ends.

## Features

- **Multi-speaker detection**: Automatically detects hosts and guests in podcast/interview videos
- **Speaker research**: Uses Tavily API to research speaker backgrounds
- **Multiple AI models**: Supports OpenAI (GPT-4), Anthropic (Claude), Google (Gemini), and DeepSeek
- **Streaming responses**: Real-time AI responses with markdown support

## Installation

### Option 1: Load unpacked (Development)

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `dist` folder

### Option 2: Build from source

```bash
npm install
npm run build
```

Then load the `dist` folder as an unpacked extension.

## What's New

- **Efficient caching**: Instant reload for previously analyzed videos (24h cache)
- **Smart research**: Only researches the speaker you choose, not all speakers upfront
- **Optimized context**: Transcript sent once, not with every message
- **Conversation pruning**: Keeps conversations focused by maintaining sliding window of recent messages

## Setup

1. Click the extension icon or go to Settings (right-click extension → Options)
2. Add at least one AI provider API key:
   - **OpenAI**: Get key from [platform.openai.com](https://platform.openai.com/api-keys)
   - **Anthropic**: Get key from [console.anthropic.com](https://console.anthropic.com/settings/keys)
   - **Google**: Get key from [aistudio.google.com](https://aistudio.google.com/app/apikey)
   - **DeepSeek**: Get key from [platform.deepseek.com](https://platform.deepseek.com/api_keys)
3. (Optional) Add a Tavily API key for speaker research (free tier: 1,000 searches/month)

## Usage

1. Navigate to any YouTube video
2. Click the Podcastbot extension icon to open the side panel
3. Click "Start Chat" to analyze the video
4. If multiple speakers are detected, select who you want to chat with
5. Ask questions and chat with the AI as if it were the creator!

## How it works

1. **Transcript extraction**: Fetches the video transcript from YouTube
2. **Speaker detection**: AI analyzes the transcript to identify speakers
3. **Background research**: (Optional) Searches the web for speaker information
4. **Context building**: Creates a detailed system prompt for the selected persona
5. **Chat**: You chat with the AI, which responds as the selected speaker

## Tech Stack

- React 18 + TypeScript
- Vite + CRXJS (Chrome Extension bundler)
- Tailwind CSS
- Zustand (state management)
- youtube-transcript (transcript fetching)

## Development

```bash
# Install dependencies
npm install

# Start development server (with hot reload)
npm run dev

# Build for production
npm run build
```

## Privacy

- All data is stored locally in your browser (chrome.storage.local)
- Video transcripts and speaker data cached for 24 hours for performance
- API keys are only sent to their respective AI providers
- No third-party analytics or tracking
- Chat history can be disabled in settings

## Limitations

- Only works with videos that have captions/transcripts enabled
- Speaker detection accuracy varies (best with interviews/podcasts)
- Transcript length limited to ~15,000 characters to fit AI context windows

## License

MIT
