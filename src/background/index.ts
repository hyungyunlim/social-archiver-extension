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
  (message: any, _sender, sendResponse: (response: any) => void) => {
    console.log('Background received message:', message);

    // Handle archive request (legacy format)
    if (message.postId && message.platform) {
      handleArchiveRequest(message as ArchiveRequest)
        .then((response) => sendResponse(response))
        .catch((error) => {
          console.error('Archive error:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true;
    }

    // Handle typed messages
    if (message.type) {
      switch (message.type) {
        case 'DOWNLOAD_MEDIA':
          handleMediaDownload(message.payload)
            .then((response) => sendResponse(response))
            .catch((error) => {
              console.error('Download error:', error);
              sendResponse({ success: false, error: error.message });
            });
          return true;

        default:
          console.warn('Unknown message type:', message.type);
          sendResponse({ success: false, error: 'Unknown message type' });
          return false;
      }
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

/**
 * Handle media download request from content script
 * This provides a fallback for CORS-blocked images
 */
async function handleMediaDownload(payload: { url: string }): Promise<any> {
  const { url } = payload;

  try {
    console.log('Background downloading media:', url);

    // Fetch the media in background context (different CORS policy)
    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'omit',
    });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    // Convert to blob
    const blob = await response.blob();

    // Convert blob to base64 data URL for transfer
    const arrayBuffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
    const base64 = btoa(binary);
    const dataUrl = `data:${blob.type};base64,${base64}`;

    return {
      success: true,
      dataUrl,
      type: blob.type,
      size: blob.size,
    };
  } catch (error) {
    console.error('Background download failed:', error);
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
