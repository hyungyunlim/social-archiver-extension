/**
 * Media download types and interfaces
 */

/**
 * Media download options
 */
export interface MediaDownloadOptions {
  url: string;
  filename?: string;
  retryAttempts?: number;
  timeout?: number;
  onProgress?: (progress: DownloadProgress) => void;
}

/**
 * Download progress information
 */
export interface DownloadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Result of media download
 */
export interface MediaDownloadResult {
  success: boolean;
  blob?: Blob;
  filename?: string;
  error?: string;
  corsBlocked?: boolean;
}

/**
 * Supported media formats
 */
export enum MediaFormat {
  JPEG = 'jpg',
  PNG = 'png',
  WEBP = 'webp',
  GIF = 'gif',
  MP4 = 'mp4',
  WEBM = 'webm',
}

/**
 * Media metadata
 */
export interface MediaMetadata {
  url: string;
  filename: string;
  format: MediaFormat;
  size?: number;
  width?: number;
  height?: number;
  duration?: number; // For videos
}

/**
 * Batch download options
 */
export interface BatchDownloadOptions {
  urls: string[];
  concurrency?: number;
  onProgress?: (completed: number, total: number) => void;
  onItemComplete?: (url: string, result: MediaDownloadResult) => void;
}

/**
 * Batch download result
 */
export interface BatchDownloadResult {
  success: boolean;
  results: Map<string, MediaDownloadResult>;
  successCount: number;
  failureCount: number;
}
