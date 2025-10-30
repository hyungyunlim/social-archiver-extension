/**
 * Folder Manager - Creates and manages hierarchical folder structure
 */

import { Platform } from './types';
import { getPlatformDisplayName } from './utils';

/**
 * Options for folder creation
 */
export interface FolderOptions {
  platform: Platform;
  date?: Date;
}

/**
 * Result of folder creation
 */
export interface FolderResult {
  success: boolean;
  handle?: FileSystemDirectoryHandle;
  path?: string;
  error?: string;
}

/**
 * Manages folder structure for archived posts
 * Structure: vault/Social Archive/{Platform}/{YYYY}/{MM}/
 */
export class FolderManager {
  private static readonly ROOT_FOLDER = 'Social Archive';

  /**
   * Get or create folder structure for a post
   */
  async ensureFolderStructure(
    vaultHandle: FileSystemDirectoryHandle,
    options: FolderOptions
  ): Promise<FolderResult> {
    try {
      const date = options.date || new Date();
      const platform = getPlatformDisplayName(options.platform);
      const year = date.getFullYear().toString();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');

      // Build path: Social Archive/{Platform}/{YYYY}/{MM}/
      const pathSegments = [FolderManager.ROOT_FOLDER, platform, year, month];

      // Create each folder in the hierarchy
      let currentHandle = vaultHandle;
      const createdPath: string[] = [];

      for (const segment of pathSegments) {
        currentHandle = await this.getOrCreateFolder(currentHandle, segment);
        createdPath.push(segment);
      }

      return {
        success: true,
        handle: currentHandle,
        path: createdPath.join('/'),
      };
    } catch (error) {
      console.error('Error creating folder structure:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get or create a subfolder
   */
  private async getOrCreateFolder(
    parentHandle: FileSystemDirectoryHandle,
    folderName: string
  ): Promise<FileSystemDirectoryHandle> {
    try {
      // Try to get existing folder first
      return await parentHandle.getDirectoryHandle(folderName, { create: true });
    } catch (error) {
      console.error(`Error creating folder "${folderName}":`, error);
      throw error;
    }
  }

  /**
   * Check if folder exists
   */
  async folderExists(
    parentHandle: FileSystemDirectoryHandle,
    folderName: string
  ): Promise<boolean> {
    try {
      await parentHandle.getDirectoryHandle(folderName);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * List all folders in a directory
   */
  async listFolders(handle: FileSystemDirectoryHandle): Promise<string[]> {
    const folders: string[] = [];

    try {
      for await (const entry of (handle as any).values()) {
        if (entry.kind === 'directory') {
          folders.push(entry.name);
        }
      }
    } catch (error) {
      console.error('Error listing folders:', error);
    }

    return folders;
  }

  /**
   * Get folder handle by path segments
   */
  async getFolderByPath(
    vaultHandle: FileSystemDirectoryHandle,
    pathSegments: string[]
  ): Promise<FileSystemDirectoryHandle | null> {
    try {
      let currentHandle = vaultHandle;

      for (const segment of pathSegments) {
        currentHandle = await currentHandle.getDirectoryHandle(segment);
      }

      return currentHandle;
    } catch (error) {
      console.error('Error getting folder by path:', error);
      return null;
    }
  }

  /**
   * Create custom folder structure
   */
  async createCustomFolders(
    parentHandle: FileSystemDirectoryHandle,
    folderNames: string[]
  ): Promise<FolderResult> {
    try {
      let currentHandle = parentHandle;
      const createdPath: string[] = [];

      for (const folderName of folderNames) {
        currentHandle = await this.getOrCreateFolder(currentHandle, folderName);
        createdPath.push(folderName);
      }

      return {
        success: true,
        handle: currentHandle,
        path: createdPath.join('/'),
      };
    } catch (error) {
      console.error('Error creating custom folders:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get full path for a platform and date
   */
  getExpectedPath(platform: Platform, date?: Date): string {
    const actualDate = date || new Date();
    const platformName = getPlatformDisplayName(platform);
    const year = actualDate.getFullYear();
    const month = (actualDate.getMonth() + 1).toString().padStart(2, '0');

    return `${FolderManager.ROOT_FOLDER}/${platformName}/${year}/${month}`;
  }
}

// Export singleton instance
export const folderManager = new FolderManager();
