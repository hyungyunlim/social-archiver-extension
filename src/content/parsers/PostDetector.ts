/**
 * Post detector using MutationObserver for dynamic content
 */

import type { PostParser } from '@shared/parser.types';
import type { ParsedPostData } from '@shared/parser.types';

export interface PostDetectorOptions {
  /**
   * Callback when new posts are detected
   */
  onPostsDetected?: (posts: ParsedPostData[]) => void;

  /**
   * Callback when posts are removed
   */
  onPostsRemoved?: (posts: ParsedPostData[]) => void;

  /**
   * Debounce time in ms for mutation events
   */
  debounceMs?: number;

  /**
   * Maximum number of posts to track
   */
  maxTrackedPosts?: number;
}

/**
 * Detects new posts as they appear in the DOM
 */
export class PostDetector {
  private parser: PostParser;
  private observer: MutationObserver | null = null;
  private options: Required<PostDetectorOptions>;
  private trackedPosts = new Set<string>();
  private debounceTimer: number | null = null;

  constructor(parser: PostParser, options: PostDetectorOptions = {}) {
    this.parser = parser;
    this.options = {
      onPostsDetected: options.onPostsDetected || (() => {}),
      onPostsRemoved: options.onPostsRemoved || (() => {}),
      debounceMs: options.debounceMs || 500,
      maxTrackedPosts: options.maxTrackedPosts || 1000,
    };
  }

  /**
   * Start observing for new posts
   */
  start(): void {
    if (this.observer) {
      console.warn('PostDetector already started');
      return;
    }

    // Get the feed container to observe
    const feedContainer = this.parser.getFeedContainer();
    if (!feedContainer) {
      console.error('PostDetector: Feed container not found');
      return;
    }

    console.log('PostDetector: Starting observation on', feedContainer);

    // Initial scan for existing posts
    this.scanForPosts();

    // Create MutationObserver
    this.observer = new MutationObserver((mutations) => {
      this.handleMutations(mutations);
    });

    // Start observing
    this.observer.observe(feedContainer, {
      childList: true,
      subtree: true,
      attributes: false, // Don't need attribute changes
    });

    console.log('PostDetector: Started');
  }

  /**
   * Stop observing
   */
  stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    console.log('PostDetector: Stopped');
  }

  /**
   * Clear tracked posts
   */
  clear(): void {
    this.trackedPosts.clear();
  }

  /**
   * Get number of tracked posts
   */
  getTrackedCount(): number {
    return this.trackedPosts.size;
  }

  /**
   * Handle DOM mutations
   */
  private handleMutations(mutations: MutationRecord[]): void {
    // Check if any mutations added nodes
    const hasAddedNodes = mutations.some((mutation) => mutation.addedNodes.length > 0);

    if (!hasAddedNodes) {
      return;
    }

    // Debounce the scanning
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = window.setTimeout(() => {
      this.scanForPosts();
      this.debounceTimer = null;
    }, this.options.debounceMs);
  }

  /**
   * Scan the DOM for new posts
   */
  private scanForPosts(): void {
    try {
      // Get all current posts
      const currentPosts = this.parser.getAllPosts();

      // Find new posts
      const newPosts = currentPosts.filter((post) => !this.trackedPosts.has(post.id));

      if (newPosts.length > 0) {
        console.log(`PostDetector: Found ${newPosts.length} new posts`);

        // Add to tracked posts
        newPosts.forEach((post) => {
          this.trackedPosts.add(post.id);
        });

        // Trim tracked posts if needed
        if (this.trackedPosts.size > this.options.maxTrackedPosts) {
          const toRemove = this.trackedPosts.size - this.options.maxTrackedPosts;
          const iterator = this.trackedPosts.values();
          for (let i = 0; i < toRemove; i++) {
            const { value } = iterator.next();
            if (value) {
              this.trackedPosts.delete(value);
            }
          }
        }

        // Notify callback
        this.options.onPostsDetected(newPosts);
      }
    } catch (error) {
      console.error('PostDetector: Error scanning for posts', error);
    }
  }

  /**
   * Force a scan for posts
   */
  public forceScan(): void {
    this.scanForPosts();
  }
}
