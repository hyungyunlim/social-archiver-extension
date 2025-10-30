/**
 * Markdown conversion types
 */

import type { Platform } from './types';
import type { ParsedPostData } from './parser.types';

/**
 * YAML frontmatter metadata
 */
export interface MarkdownFrontmatter {
  platform: Platform;
  archived: string; // ISO timestamp
  url: string;
  author: string;
  timestamp?: string; // Original post timestamp
  media_count?: number;
  has_video?: boolean;
}

/**
 * Engagement metrics for display
 */
export interface EngagementMetrics {
  likes?: number;
  comments?: number;
  shares?: number;
  views?: number;
}

/**
 * Options for markdown conversion
 */
export interface MarkdownConversionOptions {
  includeEngagement?: boolean;
  includeMediaLinks?: boolean;
  maxTitleLength?: number;
  preserveFormatting?: boolean;
}

/**
 * Result of markdown conversion
 */
export interface MarkdownConversionResult {
  success: boolean;
  markdown?: string;
  title?: string;
  filename?: string;
  error?: string;
}

/**
 * Media reference in markdown
 */
export interface MediaReference {
  type: 'image' | 'video';
  filename: string;
  originalUrl: string;
  caption?: string;
}

/**
 * Complete markdown document structure
 */
export interface MarkdownDocument {
  frontmatter: MarkdownFrontmatter;
  title: string;
  content: string;
  mediaReferences: MediaReference[];
  engagement?: EngagementMetrics;
}
