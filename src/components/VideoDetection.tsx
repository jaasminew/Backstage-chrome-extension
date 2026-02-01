import { Youtube, Play, AlertCircle, Loader2 } from 'lucide-react';
import type { VideoMetadata } from '../store/useVideoStore';

interface VideoDetectionProps {
  video: VideoMetadata | null;
  isLoading: boolean;
  error: string | null;
  onStartChat: () => void;
  hasApiKey: boolean;
}

export function VideoDetection({
  video,
  isLoading,
  error,
  onStartChat,
  hasApiKey,
}: VideoDetectionProps) {
  if (!video) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <Youtube className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-lg font-semibold text-gray-700 mb-2">
          No Video Detected
        </h2>
        <p className="text-sm text-gray-500">
          Navigate to a YouTube video to start chatting with the creator.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-4">
      {/* Video Info Card */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
            <Youtube className="w-6 h-6 text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 text-sm line-clamp-2">
              {video.title}
            </h3>
            <p className="text-xs text-gray-500 mt-1">{video.channelName}</p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-xs text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* No API Key Warning */}
      {!hasApiKey && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">API Key Required</p>
              <p className="text-xs text-amber-600 mt-0.5">
                Please add at least one AI provider API key in{' '}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    chrome.runtime.openOptionsPage();
                  }}
                  className="underline"
                >
                  settings
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Start Chat Button */}
      <button
        onClick={onStartChat}
        disabled={isLoading || !hasApiKey}
        className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Analyzing video...</span>
          </>
        ) : (
          <>
            <Play className="w-5 h-5" />
            <span>Start Chat</span>
          </>
        )}
      </button>

      {isLoading && (
        <p className="text-xs text-gray-500 text-center mt-2">
          Fetching transcript & detecting speakers...
        </p>
      )}

      {/* Instructions */}
      <div className="mt-auto pt-4">
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          How it works
        </h4>
        <ol className="text-xs text-gray-500 space-y-1.5">
          <li className="flex gap-2">
            <span className="font-medium">1.</span>
            <span>We fetch the video transcript</span>
          </li>
          <li className="flex gap-2">
            <span className="font-medium">2.</span>
            <span>AI detects speakers in the video</span>
          </li>
          <li className="flex gap-2">
            <span className="font-medium">3.</span>
            <span>Research each speaker's background</span>
          </li>
          <li className="flex gap-2">
            <span className="font-medium">4.</span>
            <span>Chat with the AI as if it were them</span>
          </li>
        </ol>
      </div>
    </div>
  );
}
