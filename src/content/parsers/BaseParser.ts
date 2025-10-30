/**
 * Base parser class with common functionality
 */

import type {
  PostParser,
  ParserSelectors,
  ParsedPostData,
  ParseResult,
} from '@shared/parser.types';
import type { Platform } from '@shared/types';

/**
 * Abstract base class for all platform parsers
 */
export abstract class BaseParser implements PostParser {
  abstract readonly platform: Platform;
  abstract readonly selectors: ParserSelectors;

  /**
   * Query selector helper that tries multiple selectors
   */
  protected queryOne(element: Element, selectors: string | string[]): Element | null {
    if (typeof selectors === 'string') {
      return element.querySelector(selectors);
    }

    for (const selector of selectors) {
      const found = element.querySelector(selector);
      if (found) return found;
    }

    return null;
  }

  /**
   * Query all helper that tries multiple selectors
   */
  protected queryAll(element: Element, selectors: string | string[]): Element[] {
    if (typeof selectors === 'string') {
      return Array.from(element.querySelectorAll(selectors));
    }

    const results: Element[] = [];
    for (const selector of selectors) {
      const found = element.querySelectorAll(selector);
      results.push(...Array.from(found));
    }

    // Remove duplicates
    return Array.from(new Set(results));
  }

  /**
   * Extract text content from an element
   */
  protected extractText(element: Element | null): string {
    if (!element) return '';
    return element.textContent?.trim() || '';
  }

  /**
   * Extract attribute from an element
   */
  protected extractAttr(element: Element | null, attr: string): string | null {
    if (!element) return null;
    return element.getAttribute(attr);
  }

  /**
   * Extract URL from an element (handles relative URLs)
   */
  protected extractUrl(element: Element | null, attr: string = 'href'): string | null {
    const url = this.extractAttr(element, attr);
    if (!url) return null;

    try {
      // Convert relative URLs to absolute
      return new URL(url, window.location.origin).href;
    } catch {
      return url;
    }
  }

  /**
   * Generate a unique post ID
   */
  protected generatePostId(element: Element): string {
    // Try to get ID from data attributes
    const dataId =
      element.getAttribute('data-id') ||
      element.getAttribute('id') ||
      element.getAttribute('data-post-id');

    if (dataId) {
      return `${this.platform}_${dataId}`;
    }

    // Fallback: use element position and timestamp
    const timestamp = Date.now();
    const position = Array.from(document.querySelectorAll('*')).indexOf(element);
    return `${this.platform}_${timestamp}_${position}`;
  }

  /**
   * Parse engagement metrics from text (e.g., "1.2K" -> 1200)
   */
  protected parseEngagementNumber(text: string): number {
    if (!text) return 0;

    const cleaned = text.trim().toLowerCase();

    // Handle K (thousands)
    if (cleaned.includes('k')) {
      const num = parseFloat(cleaned.replace('k', ''));
      return Math.round(num * 1000);
    }

    // Handle M (millions)
    if (cleaned.includes('m')) {
      const num = parseFloat(cleaned.replace('m', ''));
      return Math.round(num * 1000000);
    }

    // Handle regular numbers with commas
    const numStr = cleaned.replace(/[^0-9.]/g, '');
    return parseInt(numStr) || 0;
  }

  /**
   * Check if an element is visible in the viewport
   */
  protected isElementVisible(element: Element): boolean {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  /**
   * Safe parse with error handling
   */
  public safeParsePost(element: Element): ParseResult {
    try {
      const data = this.parsePost(element);
      if (data) {
        return { success: true, data };
      }
      return { success: false, error: 'Failed to parse post data' };
    } catch (error) {
      console.error(`Error parsing post on ${this.platform}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Abstract methods that must be implemented by subclasses
  abstract isPostElement(element: Element): boolean;
  abstract parsePost(element: Element): ParsedPostData | null;
  abstract getAllPosts(): ParsedPostData[];
  abstract getFeedContainer(): Element | null;
}
