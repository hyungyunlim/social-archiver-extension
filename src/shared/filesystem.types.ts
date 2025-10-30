/**
 * File System Access API types and interfaces
 */

/**
 * Options for directory picker
 */
export interface DirectoryPickerOptions {
  mode?: 'read' | 'readwrite';
  startIn?: 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos';
}

/**
 * Serializable representation of a directory handle
 */
export interface SerializedDirectoryHandle {
  name: string;
  path?: string;
  timestamp: number;
}

/**
 * Result of directory selection
 */
export interface VaultSelectionResult {
  success: boolean;
  handle?: FileSystemDirectoryHandle;
  error?: string;
}

/**
 * Permission state for file system access
 */
export type PermissionState = 'granted' | 'denied' | 'prompt';

/**
 * Result of permission request
 */
export interface PermissionResult {
  granted: boolean;
  state: PermissionState;
}

/**
 * Vault configuration stored in chrome.storage
 */
export interface VaultConfig {
  enabled: boolean;
  vaultPath: string;
  vaultName: string;
  lastAccessTime: number;
  // We can't directly serialize DirectoryHandle, so we store metadata
  handleMetadata?: SerializedDirectoryHandle;
}

/**
 * File save options
 */
export interface FileSaveOptions {
  filename: string;
  content: string;
  overwrite?: boolean;
  createPath?: boolean;
}

/**
 * Result of file save operation
 */
export interface FileSaveResult {
  success: boolean;
  path?: string;
  error?: string;
}
