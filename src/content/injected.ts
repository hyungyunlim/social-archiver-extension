/**
 * Injected script that runs in the page context
 * This allows us to access page-specific JavaScript and variables
 */

console.log('Social Archiver injected script loaded');

// This script runs in the page context, so it can access page variables
// and interact with the social media platform's JavaScript

/**
 * Example: Intercept network requests to capture post data
 */
(function () {
  // Store original fetch
  const originalFetch = window.fetch;

  // Override fetch to intercept requests
  window.fetch = function (...args) {
    const [_url, _options] = args;

    // Call original fetch and intercept response
    return originalFetch.apply(this, args as Parameters<typeof fetch>).then((response) => {
      // TODO: Implement platform-specific data extraction
      // For example, capture GraphQL responses from Facebook/Instagram

      return response;
    });
  };
})();

/**
 * Send message to content script
 */
function sendToContentScript(message: any) {
  window.postMessage(
    {
      ...message,
      source: 'social-archiver-injected',
    },
    '*'
  );
}

// Export functions for page context if needed
(window as any).__socialArchiver = {
  archivePost: (postId: string) => {
    sendToContentScript({
      type: 'ARCHIVE_POST',
      postId,
    });
  },
};
