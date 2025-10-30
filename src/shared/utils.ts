/**
 * Shared utility functions
 */

import { Platform } from './types';

/**
 * Detect which social media platform the current URL belongs to
 * Uses hostname matching to accurately identify the platform
 */
export function detectPlatform(url: string): Platform | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // Match hostname exactly or as subdomain (e.g., www.facebook.com, m.facebook.com)
    if (hostname === 'facebook.com' || hostname.endsWith('.facebook.com')) {
      return Platform.FACEBOOK;
    }

    if (hostname === 'instagram.com' || hostname.endsWith('.instagram.com')) {
      return Platform.INSTAGRAM;
    }

    if (hostname === 'linkedin.com' || hostname.endsWith('.linkedin.com')) {
      return Platform.LINKEDIN;
    }

    return null;
  } catch (error) {
    console.error('Failed to parse URL:', error);
    // Fallback to simple string matching
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
}

/**
 * Get the platform name as a display string
 */
export function getPlatformDisplayName(platform: Platform): string {
  switch (platform) {
    case Platform.FACEBOOK:
      return 'Facebook';
    case Platform.INSTAGRAM:
      return 'Instagram';
    case Platform.LINKEDIN:
      return 'LinkedIn';
    default:
      return 'Unknown';
  }
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
