/**
 * Popup UI types
 */

import type { Platform } from '@shared/types';

/**
 * UI state for popup
 */
export type PopupView = 'detection' | 'archiving' | 'success' | 'error';

/**
 * Current platform information
 */
export interface PlatformState {
  platform: Platform | null;
  url: string;
  ready: boolean;
  postsDetected: number;
}

/**
 * Archiving progress state
 */
export interface ArchivingState {
  status: 'idle' | 'downloading' | 'converting' | 'saving' | 'complete';
  progress: number; // 0-100
  currentStep: string;
  error?: string;
}

/**
 * Archive result for success view
 */
export interface ArchiveResultData {
  filename: string;
  path: string;
  platform: Platform;
  timestamp: Date;
}
