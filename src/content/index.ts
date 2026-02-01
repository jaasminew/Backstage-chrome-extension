// Content script for YouTube pages
// Extracts video metadata and sends to background worker

interface VideoMetadata {
  videoId: string;
  title: string;
  channelName: string;
}

function extractVideoIdFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    
    // Standard watch URL: youtube.com/watch?v=VIDEO_ID
    if (urlObj.pathname === '/watch') {
      return urlObj.searchParams.get('v');
    }
    
    // Short URL: youtu.be/VIDEO_ID
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1);
    }
    
    // Embed URL: youtube.com/embed/VIDEO_ID
    if (urlObj.pathname.startsWith('/embed/')) {
      return urlObj.pathname.split('/')[2];
    }
    
    return null;
  } catch {
    return null;
  }
}

function extractTitleFromDOM(): string {
  // Try multiple selectors for robustness
  const selectors = [
    'h1.ytd-video-primary-info-renderer yt-formatted-string',
    'h1.ytd-watch-metadata yt-formatted-string',
    '#title h1 yt-formatted-string',
    'meta[name="title"]',
    'title',
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      const content = element.getAttribute('content') || element.textContent;
      if (content && content.trim()) {
        return content.trim().replace(' - YouTube', '');
      }
    }
  }
  
  return 'Unknown Video';
}

function extractChannelFromDOM(): string {
  // Try multiple selectors for robustness
  const selectors = [
    '#channel-name yt-formatted-string a',
    '#channel-name a',
    'ytd-channel-name yt-formatted-string a',
    '#owner-name a',
    'a.yt-simple-endpoint.style-scope.yt-formatted-string',
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      const content = element.textContent;
      if (content && content.trim()) {
        return content.trim();
      }
    }
  }
  
  return 'Unknown Channel';
}

function getVideoMetadata(): VideoMetadata | null {
  const videoId = extractVideoIdFromUrl(window.location.href);
  
  if (!videoId) {
    return null;
  }
  
  return {
    videoId,
    title: extractTitleFromDOM(),
    channelName: extractChannelFromDOM(),
  };
}

function sendVideoInfo() {
  const metadata = getVideoMetadata();
  
  if (metadata) {
    chrome.runtime.sendMessage({
      action: 'VIDEO_INFO',
      data: metadata,
    });
  }
}

// Send video info when page loads
sendVideoInfo();

// Wait for DOM to be fully loaded with video info
setTimeout(sendVideoInfo, 1500);
setTimeout(sendVideoInfo, 3000);

// Observe URL changes (YouTube is a SPA)
let lastUrl = window.location.href;

const observer = new MutationObserver(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href;
    // Wait for new page to load
    setTimeout(sendVideoInfo, 500);
    setTimeout(sendVideoInfo, 1500);
  }
});

observer.observe(document.body, { childList: true, subtree: true });

// Listen for messages from background/sidepanel
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'GET_VIDEO_INFO') {
    const metadata = getVideoMetadata();
    sendResponse({ success: true, data: metadata });
  }
  return true;
});
