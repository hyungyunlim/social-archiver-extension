/**
 * Shared type definitions for the Social Archiver extension
 */

export enum Platform {
  FACEBOOK = 'facebook',
  INSTAGRAM = 'instagram',
  LINKEDIN = 'linkedin',
}

export interface Post {
  id: string;
  platform: Platform;
  author: string;
  content: string;
  timestamp: Date;
  media?: MediaItem[];
  url: string;
}

export interface MediaItem {
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
}

// Message types for chrome.runtime communication
export enum MessageType {
  // From content script to background
  ARCHIVE_POST = 'ARCHIVE_POST',
  PLATFORM_DETECTED = 'PLATFORM_DETECTED',
  DOWNLOAD_MEDIA = 'DOWNLOAD_MEDIA',

  // From popup to content script
  GET_PLATFORM_INFO = 'GET_PLATFORM_INFO',
  GET_PAGE_STATUS = 'GET_PAGE_STATUS',

  // Responses
  PLATFORM_INFO_RESPONSE = 'PLATFORM_INFO_RESPONSE',
  PAGE_STATUS_RESPONSE = 'PAGE_STATUS_RESPONSE',
  DOWNLOAD_MEDIA_RESPONSE = 'DOWNLOAD_MEDIA_RESPONSE',
}

export interface Message<T = any> {
  type: MessageType;
  payload?: T;
}

export interface ArchiveRequest {
  postId: string;
  platform: Platform;
}

export interface ArchiveResponse {
  success: boolean;
  postId?: string;
  error?: string;
}

export interface PlatformInfo {
  platform: Platform | null;
  url: string;
  ready: boolean;
}

export interface PageStatus {
  platform: Platform | null;
  postsDetected: number;
  ready: boolean;
}

export interface StorageData {
  archivedPosts: Post[];
  settings: Settings;
}

export interface Settings {
  autoArchive: boolean;
  platforms: {
    [Platform.FACEBOOK]: boolean;
    [Platform.INSTAGRAM]: boolean;
    [Platform.LINKEDIN]: boolean;
  };
}
