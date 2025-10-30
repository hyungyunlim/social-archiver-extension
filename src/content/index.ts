/**
 * Content script for detecting and archiving social media posts
 */

import { detectPlatform } from '@shared/utils';
import type { ArchiveRequest, ArchiveResponse } from '@shared/types';

console.log('Social Archiver content script loaded');

// Detect the current platform
const currentUrl = window.location.href;
const platform = detectPlatform(currentUrl);

if (platform) {
  console.log(`Social Archiver detected platform: ${platform}`);
  initializeArchiver();
}

/**
 * Initialize the archiver for the detected platform
 */
function initializeArchiver() {
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
  if (!platform) {
    console.error('Platform not detected');
    return;
  }

  const request: ArchiveRequest = {
    postId,
    platform,
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
  // Create a MutationObserver to watch for new posts
  const observer = new MutationObserver((_mutations) => {
    // TODO: Implement platform-specific post detection
    // For now, just log that we're observing
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
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
