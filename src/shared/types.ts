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

export interface ArchiveRequest {
  postId: string;
  platform: Platform;
}

export interface ArchiveResponse {
  success: boolean;
  postId?: string;
  error?: string;
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
