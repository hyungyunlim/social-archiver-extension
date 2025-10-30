/**
 * Content script for detecting and archiving social media posts
 */

import { detectPlatform, getPlatformDisplayName } from '@shared/utils';
import { getParser } from './parsers/ParserFactory';
import type { ParsedPostData } from '@shared/parser.types';
import type {
  ArchiveRequest,
  ArchiveResponse,
  Platform,
  Message,
  PlatformInfo,
  PageStatus,
} from '@shared/types';

console.log('Social Archiver content script loaded');

// State management
interface ContentScriptState {
  platform: Platform | null;
  currentUrl: string;
  postsDetected: number;
  ready: boolean;
  observer: MutationObserver | null;
}

const state: ContentScriptState = {
  platform: null,
  currentUrl: window.location.href,
  postsDetected: 0,
  ready: false,
  observer: null,
};

// Initialize the content script
function init() {
  // Detect the current platform
  state.platform = detectPlatform(state.currentUrl);

  if (state.platform) {
    console.log(`Social Archiver detected platform: ${getPlatformDisplayName(state.platform)}`);
    initializeArchiver();

    // Notify background that platform was detected
    notifyPlatformDetected();
  } else {
    console.log('Social Archiver: Not on a supported platform');
  }

  // Set up URL change detection for SPA navigation
  setupSPANavigationDetection();

  // Set up message listener for popup communication
  setupMessageListener();
}

// Start initialization
init();

/**
 * Notify background script that platform was detected
 */
function notifyPlatformDetected() {
  if (!state.platform) return;

  chrome.runtime.sendMessage({
    type: 'PLATFORM_DETECTED',
    payload: {
      platform: state.platform,
      url: state.currentUrl,
    },
  }).catch((error) => {
    console.error('Failed to notify platform detection:', error);
  });
}

/**
 * Set up SPA navigation detection
 * Detects URL changes in Single Page Applications
 */
function setupSPANavigationDetection() {
  // Listen for popstate events (back/forward navigation)
  window.addEventListener('popstate', handleURLChange);

  // Listen for pushstate/replacestate events (programmatic navigation)
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function (...args) {
    originalPushState.apply(this, args);
    handleURLChange();
  };

  history.replaceState = function (...args) {
    originalReplaceState.apply(this, args);
    handleURLChange();
  };

  console.log('Social Archiver: SPA navigation detection enabled');
}

/**
 * Handle URL changes (SPA navigation)
 */
function handleURLChange() {
  const newUrl = window.location.href;

  if (newUrl !== state.currentUrl) {
    console.log('Social Archiver: URL changed', { from: state.currentUrl, to: newUrl });
    state.currentUrl = newUrl;

    // Re-detect platform (in case user navigated away)
    const newPlatform = detectPlatform(newUrl);

    if (newPlatform !== state.platform) {
      state.platform = newPlatform;

      if (newPlatform) {
        console.log(`Social Archiver: Platform changed to ${getPlatformDisplayName(newPlatform)}`);
        initializeArchiver();
        notifyPlatformDetected();
      } else {
        console.log('Social Archiver: Navigated away from supported platform');
        cleanup();
      }
    }
  }
}

/**
 * Set up message listener for popup communication
 */
function setupMessageListener() {
  chrome.runtime.onMessage.addListener(
    (message: Message, _sender, sendResponse: (response: any) => void) => {
      console.log('Social Archiver content script received message:', message);

      if (message.type === 'GET_PLATFORM_INFO') {
        const platformInfo: PlatformInfo = {
          platform: state.platform,
          url: state.currentUrl,
          ready: state.ready,
        };
        sendResponse(platformInfo);
        return true;
      }

      if (message.type === 'GET_PAGE_STATUS') {
        const pageStatus: PageStatus = {
          platform: state.platform,
          postsDetected: state.postsDetected,
          ready: state.ready,
        };
        sendResponse(pageStatus);
        return true;
      }

      if (message.type === 'ARCHIVE_CURRENT_POST') {
        // Parse and return the first post on the page
        handleArchiveRequest()
          .then((postData) => {
            sendResponse({ success: true, postData });
          })
          .catch((error) => {
            sendResponse({ success: false, error: error.message });
          });
        return true; // Keep channel open for async response
      }

      return false;
    }
  );

  console.log('Social Archiver: Message listener registered');
}

/**
 * Initialize the archiver for the detected platform
 */
function initializeArchiver() {
  // Clean up previous initialization if any
  cleanup();

  // Inject the platform-specific script into the page context
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('injected.js');
  script.onload = function () {
    (this as HTMLScriptElement).remove();
  };
  (document.head || document.documentElement).appendChild(script);

  // Listen for messages from the injected script
  window.addEventListener('message', handlePageMessage);

  // Add archive buttons to posts
  observePosts();

  // Mark as ready
  state.ready = true;
}

/**
 * Clean up resources
 */
function cleanup() {
  if (state.observer) {
    state.observer.disconnect();
    state.observer = null;
  }
  state.ready = false;
  state.postsDetected = 0;
}

/**
 * Handle messages from the injected script (page context)
 */
function handlePageMessage(event: MessageEvent) {
  // Only accept messages from the same origin
  if (event.source !== window) {
    return;
  }

  if (event.data.type === 'ARCHIVE_POST') {
    console.log('Received archive request from page:', event.data);
    archivePost(event.data.postId);
  }
}

/**
 * Send archive request to background script
 */
async function archivePost(postId: string) {
  if (!state.platform) {
    console.error('Platform not detected');
    return;
  }

  const request: ArchiveRequest = {
    postId,
    platform: state.platform,
  };

  try {
    const response = await chrome.runtime.sendMessage(request) as ArchiveResponse;
    console.log('Archive response:', response);

    if (response.success) {
      // Show success notification
      showNotification('Post archived successfully!', 'success');
    } else {
      showNotification(`Archive failed: ${response.error}`, 'error');
    }
  } catch (error) {
    console.error('Failed to send archive request:', error);
    showNotification('Archive failed', 'error');
  }
}

/**
 * Observe the DOM for new posts and add archive buttons
 */
function observePosts() {
  // Clean up existing observer
  if (state.observer) {
    state.observer.disconnect();
  }

  // Create a MutationObserver to watch for new posts
  state.observer = new MutationObserver((_mutations) => {
    // TODO: Implement platform-specific post detection
    // For now, just log that we're observing
    // This will be implemented in later tasks
  });

  state.observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  console.log('Social Archiver: DOM observer started');
}

/**
 * Handle archive request from popup
 * Parse the first post on the current page
 */
async function handleArchiveRequest(): Promise<ParsedPostData> {
  if (!state.platform) {
    throw new Error('No platform detected');
  }

  console.log('Parsing posts from page for platform:', state.platform);

  // Get the parser for this platform
  const parser = getParser(state.platform);

  // Get all posts on the page
  const posts = parser.getAllPosts();

  if (posts.length === 0) {
    throw new Error('No posts found on page. Try scrolling to load posts or navigate to a post page.');
  }

  console.log(`Found ${posts.length} posts on page`);

  // Return the first post
  const firstPost = posts[0];

  console.log('Parsed post:', {
    id: firstPost.id,
    author: firstPost.author.name,
    contentLength: firstPost.content.text.length,
    mediaCount: firstPost.media.length,
  });

  return firstPost;
}

/**
 * Show a notification to the user
 */
function showNotification(message: string, type: 'success' | 'error') {
  // Create a simple notification element
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    background: ${type === 'success' ? '#10b981' : '#ef4444'};
    color: white;
    border-radius: 8px;
    font-family: sans-serif;
    font-size: 14px;
    z-index: 999999;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  `;

  document.body.appendChild(notification);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.remove();
  }, 3000);
}
