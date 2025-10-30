/**
 * Media Downloader - Downloads images and videos with CORS handling
 */

import type {
  MediaDownloadOptions,
  MediaDownloadResult,
  DownloadProgress,
  BatchDownloadOptions,
  BatchDownloadResult,
} from './media.types';
import { MediaFormat } from './media.types';

/**
 * Downloads media files with CORS handling and retry logic
 */
export class MediaDownloader {
  private static readonly DEFAULT_TIMEOUT = 30000; // 30 seconds
  private static readonly DEFAULT_RETRY_ATTEMPTS = 3;
  private static readonly RETRY_DELAY_BASE = 1000; // 1 second

  /**
   * Download a media file
   */
  async downloadMedia(options: MediaDownloadOptions): Promise<MediaDownloadResult> {
    const {
      url,
      filename,
      retryAttempts = MediaDownloader.DEFAULT_RETRY_ATTEMPTS,
      timeout = MediaDownloader.DEFAULT_TIMEOUT,
      onProgress,
    } = options;

    let lastError: Error | null = null;

    // Try downloading with increasing delays between attempts
    for (let attempt = 0; attempt < retryAttempts; attempt++) {
      try {
        if (attempt > 0) {
          // Exponential backoff: 1s, 2s, 4s, etc.
          const delay = MediaDownloader.RETRY_DELAY_BASE * Math.pow(2, attempt - 1);
          console.log(`Retry attempt ${attempt + 1} after ${delay}ms delay`);
          await this.delay(delay);
        }

        // Try direct fetch first
        const result = await this.fetchWithProgress(url, timeout, onProgress);

        if (result.success && result.blob) {
          return {
            success: true,
            blob: result.blob,
            filename: filename || this.extractFilename(url),
          };
        }

        // If CORS blocked, try background fallback
        if (result.corsBlocked) {
          console.log('CORS blocked, trying background fallback');
          const bgResult = await this.downloadViaBackground(url);

          if (bgResult.success && bgResult.blob) {
            return {
              success: true,
              blob: bgResult.blob,
              filename: filename || this.extractFilename(url),
            };
          }
        }

        lastError = new Error(result.error || 'Download failed');
      } catch (error) {
        lastError = error as Error;
        console.error(`Download attempt ${attempt + 1} failed:`, error);
      }
    }

    // All attempts failed
    return {
      success: false,
      error: lastError?.message || 'Download failed after all retry attempts',
      corsBlocked: lastError?.message?.includes('CORS') || lastError?.message?.includes('cors'),
    };
  }

  /**
   * Download via background script (fallback for CORS)
   */
  private async downloadViaBackground(url: string): Promise<MediaDownloadResult> {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'DOWNLOAD_MEDIA',
        payload: { url },
      });

      if (response.success && response.dataUrl) {
        // Convert data URL back to blob
        const blob = await this.dataUrlToBlob(response.dataUrl);

        return {
          success: true,
          blob,
        };
      }

      return {
        success: false,
        error: response.error || 'Background download failed',
      };
    } catch (error) {
      console.error('Error communicating with background:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Convert data URL to blob
   */
  private async dataUrlToBlob(dataUrl: string): Promise<Blob> {
    const response = await fetch(dataUrl);
    return await response.blob();
  }

  /**
   * Fetch with progress tracking
   */
  private async fetchWithProgress(
    url: string,
    timeout: number,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<MediaDownloadResult> {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Fetch with CORS mode
      const response = await fetch(url, {
        mode: 'cors',
        credentials: 'omit',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      // Get content length for progress tracking
      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;

      // Read response body with progress
      if (response.body && onProgress && total > 0) {
        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];
        let loaded = 0;

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          if (value) {
            chunks.push(value);
            loaded += value.length;

            onProgress({
              loaded,
              total,
              percentage: (loaded / total) * 100,
            });
          }
        }

        // Combine chunks into blob
        const blob = new Blob(chunks as BlobPart[]);
        return {
          success: true,
          blob,
        };
      } else {
        // No progress tracking, just get blob
        const blob = await response.blob();
        return {
          success: true,
          blob,
        };
      }
    } catch (error) {
      console.error('Fetch error:', error);

      if (error instanceof Error) {
        // Check for CORS errors
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
          return {
            success: false,
            error: 'CORS blocked or network error',
            corsBlocked: true,
          };
        }

        // Check for timeout
        if (error.name === 'AbortError') {
          return {
            success: false,
            error: 'Download timeout',
          };
        }

        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: false,
        error: 'Unknown error',
      };
    }
  }

  /**
   * Download multiple media files in batch
   */
  async downloadBatch(options: BatchDownloadOptions): Promise<BatchDownloadResult> {
    const {
      urls,
      concurrency = 3,
      onProgress,
      onItemComplete,
    } = options;

    const results = new Map<string, MediaDownloadResult>();
    let completed = 0;
    let successCount = 0;
    let failureCount = 0;

    // Process in batches based on concurrency
    for (let i = 0; i < urls.length; i += concurrency) {
      const batch = urls.slice(i, i + concurrency);

      await Promise.all(
        batch.map(async (url) => {
          const result = await this.downloadMedia({ url });
          results.set(url, result);

          if (result.success) {
            successCount++;
          } else {
            failureCount++;
          }

          completed++;

          if (onProgress) {
            onProgress(completed, urls.length);
          }

          if (onItemComplete) {
            onItemComplete(url, result);
          }
        })
      );
    }

    return {
      success: failureCount === 0,
      results,
      successCount,
      failureCount,
    };
  }

  /**
   * Extract filename from URL
   */
  private extractFilename(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = pathname.substring(pathname.lastIndexOf('/') + 1);

      if (filename && filename.length > 0) {
        return filename;
      }
    } catch (error) {
      // Invalid URL, generate filename
    }

    // Generate filename with timestamp
    return `media-${Date.now()}.jpg`;
  }

  /**
   * Detect media format from URL or blob
   */
  detectFormat(url: string, blob?: Blob): MediaFormat | null {
    // Try to detect from URL
    const urlLower = url.toLowerCase();

    if (urlLower.includes('.jpg') || urlLower.includes('.jpeg')) {
      return MediaFormat.JPEG;
    }
    if (urlLower.includes('.png')) {
      return MediaFormat.PNG;
    }
    if (urlLower.includes('.webp')) {
      return MediaFormat.WEBP;
    }
    if (urlLower.includes('.gif')) {
      return MediaFormat.GIF;
    }
    if (urlLower.includes('.mp4')) {
      return MediaFormat.MP4;
    }
    if (urlLower.includes('.webm')) {
      return MediaFormat.WEBM;
    }

    // Try to detect from blob MIME type
    if (blob) {
      const type = blob.type;
      if (type.includes('jpeg')) return MediaFormat.JPEG;
      if (type.includes('png')) return MediaFormat.PNG;
      if (type.includes('webp')) return MediaFormat.WEBP;
      if (type.includes('gif')) return MediaFormat.GIF;
      if (type.includes('mp4')) return MediaFormat.MP4;
      if (type.includes('webm')) return MediaFormat.WEBM;
    }

    return null;
  }

  /**
   * Get file extension for a format
   */
  getExtension(format: MediaFormat): string {
    return `.${format}`;
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Convert blob to base64 data URL
   */
  async blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Convert blob to array buffer
   */
  async blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
    return await blob.arrayBuffer();
  }
}

// Export singleton instance
export const mediaDownloader = new MediaDownloader();
