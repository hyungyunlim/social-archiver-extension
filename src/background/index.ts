/**
 * Background service worker for the Social Archiver extension
 */

import type { ArchiveRequest, ArchiveResponse } from '@shared/types';

console.log('Social Archiver background service worker loaded');

// Initialize extension on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('Social Archiver extension installed');

  // Set default settings
  chrome.storage.local.set({
    settings: {
      autoArchive: false,
      platforms: {
        facebook: true,
        instagram: true,
        linkedin: true,
      },
    },
    archivedPosts: [],
  });
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener(
  (message: ArchiveRequest, _sender, sendResponse: (response: ArchiveResponse) => void) => {
    console.log('Background received message:', message);

    if (message.postId && message.platform) {
      // Handle archive request
      handleArchiveRequest(message)
        .then((response) => sendResponse(response))
        .catch((error) => {
          console.error('Archive error:', error);
          sendResponse({ success: false, error: error.message });
        });

      // Return true to indicate async response
      return true;
    }

    return false;
  }
);

/**
 * Handle archive request from content script
 */
async function handleArchiveRequest(request: ArchiveRequest): Promise<ArchiveResponse> {
  console.log('Archiving post:', request);

  try {
    // TODO: Get existing archived posts and add new one
    // const result = await chrome.storage.local.get(['archivedPosts']);
    // const archivedPosts = result.archivedPosts || [];

    // TODO: Implement actual archiving logic
    // For now, just acknowledge the request

    return {
      success: true,
      postId: request.postId,
    };
  } catch (error) {
    console.error('Failed to archive post:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Listen for tab updates to inject content scripts if needed
chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const isSocialMedia =
      tab.url.includes('facebook.com') ||
      tab.url.includes('instagram.com') ||
      tab.url.includes('linkedin.com');

    if (isSocialMedia) {
      console.log('Social media page detected:', tab.url);
    }
  }
});
