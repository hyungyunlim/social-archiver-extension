/**
 * Media Storage Manager - Handles media file storage and naming
 */

import type { MediaFormat } from './media.types';
import { fileSaver } from './FileSaver';

/**
 * Options for storing media
 */
export interface MediaStorageOptions {
  postId: string;
  mediaIndex: number;
  format?: MediaFormat;
  originalFilename?: string;
}

/**
 * Result of media storage operation
 */
export interface MediaStorageResult {
  success: boolean;
  filename?: string;
  path?: string;
  error?: string;
}

/**
 * Manages storage of media files alongside markdown posts
 */
export class MediaStorageManager {
  private static readonly ATTACHMENTS_FOLDER = 'attachments';

  /**
   * Generate unique filename for media
   */
  generateMediaFilename(options: MediaStorageOptions): string {
    const { postId, mediaIndex, format, originalFilename } = options;

    // Try to use original filename if provided
    if (originalFilename) {
      const sanitized = this.sanitizeFilename(originalFilename);
      const extension = this.getFileExtension(sanitized);

      if (extension) {
        // Has extension, use as-is with index
        const baseName = sanitized.substring(0, sanitized.lastIndexOf('.'));
        return `${baseName}-${mediaIndex}${extension}`;
      }
    }

    // Generate filename from post ID and index
    const timestamp = Date.now();
    const extension = format ? `.${format}` : '.jpg';

    return `${postId}-${mediaIndex}-${timestamp}${extension}`;
  }

  /**
   * Store media blob to filesystem
   */
  async storeMedia(
    folderHandle: FileSystemDirectoryHandle,
    blob: Blob,
    options: MediaStorageOptions
  ): Promise<MediaStorageResult> {
    try {
      // Create attachments subfolder
      const attachmentsHandle = await this.getAttachmentsFolder(folderHandle);

      // Generate filename
      const filename = this.generateMediaFilename(options);

      // Save the file
      const result = await fileSaver.saveFile(attachmentsHandle, {
        filename,
        content: await this.blobToText(blob),
        overwrite: false,
      });

      if (!result.success) {
        // Try with auto-rename if file exists
        const retryResult = await fileSaver.saveFileWithAutoRename(attachmentsHandle, {
          filename,
          content: await this.blobToText(blob),
        });

        if (!retryResult.success) {
          return {
            success: false,
            error: retryResult.error,
          };
        }

        return {
          success: true,
          filename: retryResult.path,
          path: `${MediaStorageManager.ATTACHMENTS_FOLDER}/${retryResult.path}`,
        };
      }

      return {
        success: true,
        filename: result.path,
        path: `${MediaStorageManager.ATTACHMENTS_FOLDER}/${result.path}`,
      };
    } catch (error) {
      console.error('Error storing media:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Store media using binary data
   */
  async storeMediaBinary(
    folderHandle: FileSystemDirectoryHandle,
    blob: Blob,
    options: MediaStorageOptions
  ): Promise<MediaStorageResult> {
    try {
      // Create attachments subfolder
      const attachmentsHandle = await this.getAttachmentsFolder(folderHandle);

      // Generate filename
      const filename = this.generateMediaFilename(options);

      // Get file handle
      const fileHandle = await attachmentsHandle.getFileHandle(filename, { create: true });

      // Create writable stream
      const writable = await (fileHandle as any).createWritable();

      // Write blob directly
      await writable.write(blob);

      // Close stream
      await writable.close();

      return {
        success: true,
        filename,
        path: `${MediaStorageManager.ATTACHMENTS_FOLDER}/${filename}`,
      };
    } catch (error) {
      console.error('Error storing media binary:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get or create attachments folder
   */
  private async getAttachmentsFolder(
    parentHandle: FileSystemDirectoryHandle
  ): Promise<FileSystemDirectoryHandle> {
    return await parentHandle.getDirectoryHandle(MediaStorageManager.ATTACHMENTS_FOLDER, {
      create: true,
    });
  }

  /**
   * Convert blob to text (for FileSaver compatibility)
   */
  private async blobToText(blob: Blob): Promise<string> {
    // For binary files, we need to convert to base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        const bytes = new Uint8Array(arrayBuffer);
        const binary = Array.from(bytes)
          .map((b) => String.fromCharCode(b))
          .join('');
        const base64 = btoa(binary);
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(blob);
    });
  }

  /**
   * Sanitize filename
   */
  private sanitizeFilename(filename: string): string {
    // Remove path separators and invalid characters
    return filename
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase();
  }

  /**
   * Get file extension from filename
   */
  private getFileExtension(filename: string): string | null {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1 || lastDot === filename.length - 1) {
      return null;
    }
    return filename.substring(lastDot);
  }

  /**
   * Batch store multiple media files
   */
  async storeMediaBatch(
    folderHandle: FileSystemDirectoryHandle,
    mediaList: Array<{ blob: Blob; options: MediaStorageOptions }>
  ): Promise<MediaStorageResult[]> {
    const results: MediaStorageResult[] = [];

    for (const { blob, options } of mediaList) {
      const result = await this.storeMediaBinary(folderHandle, blob, options);
      results.push(result);

      // Small delay between operations
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    return results;
  }

  /**
   * Get relative path for markdown reference
   */
  getMarkdownPath(filename: string): string {
    return `./${MediaStorageManager.ATTACHMENTS_FOLDER}/${filename}`;
  }
}

// Export singleton instance
export const mediaStorageManager = new MediaStorageManager();
