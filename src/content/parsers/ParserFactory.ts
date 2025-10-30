/**
 * Factory for creating platform-specific parsers
 */

import { Platform } from '@shared/types';
import type { PostParser } from '@shared/parser.types';
import { FacebookParser } from './FacebookParser';
import { InstagramParser } from './InstagramParser';
import { LinkedInParser } from './LinkedInParser';

/**
 * Get the appropriate parser for a given platform
 */
export function getParser(platform: Platform): PostParser {
  switch (platform) {
    case Platform.FACEBOOK:
      return new FacebookParser();
    case Platform.INSTAGRAM:
      return new InstagramParser();
    case Platform.LINKEDIN:
      return new LinkedInParser();
    default:
      throw new Error(`No parser available for platform: ${platform}`);
  }
}

/**
 * Check if a parser is available for a given platform
 */
export function hasParser(platform: Platform): boolean {
  return [Platform.FACEBOOK, Platform.INSTAGRAM, Platform.LINKEDIN].includes(platform);
}
