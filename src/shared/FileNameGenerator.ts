/**
 * File Name Generator - Creates sanitized filenames for archived posts
 */

import type { ParsedPostData } from './parser.types';

/**
 * Options for filename generation
 */
export interface FileNameOptions {
  includeDate?: boolean;
  includeAuthor?: boolean;
  includeTitle?: boolean;
  maxLength?: number;
  extension?: string;
}

/**
 * Generates and sanitizes filenames for archived posts
 */
export class FileNameGenerator {
  private static readonly DEFAULT_MAX_LENGTH = 200;
  private static readonly DEFAULT_EXTENSION = '.md';

  // Characters that are invalid in filenames on most systems
  private static readonly INVALID_CHARS = /[<>:"/\\|?*\x00-\x1F]/g;

  // Additional characters to replace for better compatibility
  private static readonly PROBLEMATIC_CHARS = /[#%&{}~$'`!@+]/g;

  /**
   * Generate filename from post data
   */
  generateFilename(post: ParsedPostData, options: FileNameOptions = {}): string {
    const {
      includeDate = true,
      includeAuthor = true,
      includeTitle = true,
      maxLength = FileNameGenerator.DEFAULT_MAX_LENGTH,
      extension = FileNameGenerator.DEFAULT_EXTENSION,
    } = options;

    const parts: string[] = [];

    // Add date (YYYY-MM-DD format)
    if (includeDate) {
      const date = post.timestamp.parsed || new Date();
      const dateStr = this.formatDate(date);
      parts.push(dateStr);
    }

    // Add author name
    if (includeAuthor && post.author.name) {
      const sanitizedAuthor = this.sanitize(post.author.name);
      parts.push(sanitizedAuthor);
    }

    // Add title/content excerpt
    if (includeTitle) {
      const title = this.extractTitle(post);
      if (title) {
        const sanitizedTitle = this.sanitize(title);
        parts.push(sanitizedTitle);
      }
    }

    // Combine parts with separator
    let filename = parts.filter(Boolean).join(' - ');

    // Ensure filename is not empty
    if (!filename) {
      filename = `post-${Date.now()}`;
    }

    // Truncate if too long (accounting for extension)
    const maxBaseLength = maxLength - extension.length;
    if (filename.length > maxBaseLength) {
      filename = filename.substring(0, maxBaseLength).trim();
      // Remove trailing dash if present
      filename = filename.replace(/\s*-\s*$/, '');
    }

    return filename + extension;
  }

  /**
   * Extract a title from post content
   */
  private extractTitle(post: ParsedPostData): string {
    const content = post.content.text;

    if (!content) {
      return `${post.platform}-post-${post.id.substring(0, 8)}`;
    }

    // Get first line or first 50 characters
    const firstLine = content.split('\n')[0];
    const excerpt = firstLine.substring(0, 50);

    // Remove extra whitespace
    return excerpt.trim();
  }

  /**
   * Format date as YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  /**
   * Sanitize a string for use in filename
   */
  sanitize(str: string): string {
    // Remove invalid characters
    let sanitized = str.replace(FileNameGenerator.INVALID_CHARS, '');

    // Replace problematic characters with safe alternatives
    sanitized = sanitized.replace(FileNameGenerator.PROBLEMATIC_CHARS, '-');

    // Replace multiple spaces/dashes with single dash
    sanitized = sanitized.replace(/[\s-]+/g, ' ');

    // Trim whitespace and dashes from ends
    sanitized = sanitized.trim().replace(/^-+|-+$/g, '');

    // Replace remaining spaces with dashes for cleaner URLs/filenames
    // Actually, keep spaces for better readability
    // sanitized = sanitized.replace(/\s+/g, '-');

    return sanitized;
  }

  /**
   * Generate filename with timestamp for uniqueness
   */
  generateUniqueFilename(post: ParsedPostData, options: FileNameOptions = {}): string {
    const baseFilename = this.generateFilename(post, {
      ...options,
      extension: '', // Don't add extension yet
    });

    const timestamp = Date.now();
    const extension = options.extension || FileNameGenerator.DEFAULT_EXTENSION;

    return `${baseFilename}-${timestamp}${extension}`;
  }

  /**
   * Validate a filename
   */
  isValidFilename(filename: string): boolean {
    if (!filename || filename.length === 0) {
      return false;
    }

    // Check for invalid characters
    if (FileNameGenerator.INVALID_CHARS.test(filename)) {
      return false;
    }

    // Check for reserved names (Windows)
    const reserved = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i;
    if (reserved.test(filename)) {
      return false;
    }

    // Check for names starting or ending with spaces or dots
    if (/^[\s.]|[\s.]$/.test(filename)) {
      return false;
    }

    return true;
  }

  /**
   * Generate filename from custom components
   */
  generateCustomFilename(components: {
    date?: Date;
    author?: string;
    title?: string;
    platform?: string;
    extension?: string;
  }): string {
    const parts: string[] = [];

    if (components.date) {
      parts.push(this.formatDate(components.date));
    }

    if (components.platform) {
      parts.push(this.sanitize(components.platform));
    }

    if (components.author) {
      parts.push(this.sanitize(components.author));
    }

    if (components.title) {
      parts.push(this.sanitize(components.title));
    }

    const filename = parts.join(' - ');
    const extension = components.extension || FileNameGenerator.DEFAULT_EXTENSION;

    return filename + extension;
  }

  /**
   * Extract filename without extension
   */
  getBaseName(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1) {
      return filename;
    }
    return filename.substring(0, lastDot);
  }

  /**
   * Get file extension
   */
  getExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1) {
      return '';
    }
    return filename.substring(lastDot);
  }
}

// Export singleton instance
export const fileNameGenerator = new FileNameGenerator();
