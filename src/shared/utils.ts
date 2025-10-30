/**
 * Shared utility functions
 */

import { Platform } from './types';

/**
 * Detect which social media platform the current URL belongs to
 */
export function detectPlatform(url: string): Platform | null {
  if (url.includes('facebook.com')) {
    return Platform.FACEBOOK;
  }
  if (url.includes('instagram.com')) {
    return Platform.INSTAGRAM;
  }
  if (url.includes('linkedin.com')) {
    return Platform.LINKEDIN;
  }
  return null;
}

/**
 * Format a timestamp for display
 */
export function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Generate a unique ID for a post
 */
export function generatePostId(platform: Platform, originalId: string): string {
  return `${platform}_${originalId}_${Date.now()}`;
}

/**
 * Validate if a URL is a valid social media post URL
 */
export function isValidPostUrl(url: string): boolean {
  const platform = detectPlatform(url);
  return platform !== null;
}
