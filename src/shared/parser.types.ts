/**
 * Types and interfaces for social media post parsers
 */

import { Platform, MediaItem } from './types';

/**
 * Raw post data extracted from DOM
 */
export interface ParsedPostData {
  // Unique identifier for the post
  id: string;

  // Platform where the post was found
  platform: Platform;

  // Author information
  author: {
    name: string;
    username?: string;
    profileUrl?: string;
    avatarUrl?: string;
  };

  // Post content
  content: {
    text: string;
    htmlContent?: string;
  };

  // Timestamp information
  timestamp: {
    raw: string;
    parsed?: Date;
  };

  // Media attachments
  media: MediaItem[];

  // Engagement metrics
  engagement?: {
    likes?: number;
    comments?: number;
    shares?: number;
  };

  // URLs
  urls: {
    post: string;
    canonical?: string;
  };

  // Post metadata
  metadata: {
    isSponsored?: boolean;
    postType?: 'text' | 'image' | 'video' | 'carousel' | 'link' | 'poll';
    hasReadMore?: boolean;
  };

  // Original DOM element (for reference)
  element?: HTMLElement;
}

/**
 * Parser interface that all platform parsers must implement
 */
export interface PostParser {
  /**
   * Platform this parser handles
   */
  readonly platform: Platform;

  /**
   * Detect if an element is a valid post
   */
  isPostElement(element: Element): boolean;

  /**
   * Parse a post element and extract all data
   */
  parsePost(element: Element): ParsedPostData | null;

  /**
   * Get all posts currently visible in the DOM
   */
  getAllPosts(): ParsedPostData[];

  /**
   * Get the main feed container element
   */
  getFeedContainer(): Element | null;

  /**
   * Selectors used by this parser
   */
  readonly selectors: ParserSelectors;
}

/**
 * Selectors for different parts of a post
 */
export interface ParserSelectors {
  // Main post container
  postContainer: string | string[];

  // Feed container
  feedContainer: string | string[];

  // Author information
  author: {
    name: string | string[];
    username?: string | string[];
    profileLink?: string | string[];
    avatar?: string | string[];
  };

  // Content
  content: {
    text: string | string[];
    readMore?: string | string[];
  };

  // Timestamp
  timestamp: string | string[];

  // Media
  media: {
    images?: string | string[];
    videos?: string | string[];
    carousel?: string | string[];
  };

  // Engagement
  engagement?: {
    likes?: string | string[];
    comments?: string | string[];
    shares?: string | string[];
  };

  // Post metadata
  metadata?: {
    sponsored?: string | string[];
    postLink?: string | string[];
  };
}

/**
 * Result of attempting to parse a post
 */
export interface ParseResult {
  success: boolean;
  data?: ParsedPostData;
  error?: string;
}
