/**
 * File Saver - Handles file writing operations using File System Access API
 */

import type { FileSaveOptions, FileSaveResult } from './filesystem.types';

/**
 * Options for checking file existence
 */
export interface FileExistsOptions {
  filename: string;
}

/**
 * Service for saving files to the file system
 */
export class FileSaver {
  /**
   * Save content to a file
   */
  async saveFile(
    directoryHandle: FileSystemDirectoryHandle,
    options: FileSaveOptions
  ): Promise<FileSaveResult> {
    try {
      const { filename, content, overwrite = false } = options;

      // Check if file exists
      const exists = await this.fileExists(directoryHandle, { filename });

      if (exists && !overwrite) {
        return {
          success: false,
          error: 'File already exists',
        };
      }

      // Get file handle (creates if doesn't exist)
      const fileHandle = await directoryHandle.getFileHandle(filename, { create: true });

      // Create writable stream
      const writable = await (fileHandle as any).createWritable();

      // Write content
      await writable.write(content);

      // Close the stream
      await writable.close();

      console.log(`File saved: ${filename}`);

      return {
        success: true,
        path: filename,
      };
    } catch (error) {
      console.error('Error saving file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Save file with unique filename if it already exists
   */
  async saveFileWithAutoRename(
    directoryHandle: FileSystemDirectoryHandle,
    options: FileSaveOptions
  ): Promise<FileSaveResult> {
    try {
      const { filename } = options;

      // Try original filename first
      const exists = await this.fileExists(directoryHandle, { filename });

      if (!exists) {
        return await this.saveFile(directoryHandle, { ...options, overwrite: false });
      }

      // Generate unique filename
      const uniqueFilename = await this.generateUniqueFilename(directoryHandle, filename);

      return await this.saveFile(directoryHandle, {
        ...options,
        filename: uniqueFilename,
        overwrite: false,
      });
    } catch (error) {
      console.error('Error saving file with auto-rename:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check if a file exists in the directory
   */
  async fileExists(
    directoryHandle: FileSystemDirectoryHandle,
    options: FileExistsOptions
  ): Promise<boolean> {
    try {
      await directoryHandle.getFileHandle(options.filename);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate a unique filename by appending a number
   */
  private async generateUniqueFilename(
    directoryHandle: FileSystemDirectoryHandle,
    originalFilename: string
  ): Promise<string> {
    const parts = originalFilename.match(/^(.+?)(\.[^.]+)?$/);
    const baseName = parts?.[1] || originalFilename;
    const extension = parts?.[2] || '';

    let counter = 1;
    let newFilename = originalFilename;

    while (await this.fileExists(directoryHandle, { filename: newFilename })) {
      newFilename = `${baseName} (${counter})${extension}`;
      counter++;

      // Safety limit
      if (counter > 1000) {
        throw new Error('Could not generate unique filename');
      }
    }

    return newFilename;
  }

  /**
   * Read file content
   */
  async readFile(fileHandle: FileSystemFileHandle): Promise<string> {
    try {
      const file = await fileHandle.getFile();
      return await file.text();
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  }

  /**
   * List all files in a directory
   */
  async listFiles(directoryHandle: FileSystemDirectoryHandle): Promise<string[]> {
    const files: string[] = [];

    try {
      for await (const entry of (directoryHandle as any).values()) {
        if (entry.kind === 'file') {
          files.push(entry.name);
        }
      }
    } catch (error) {
      console.error('Error listing files:', error);
    }

    return files;
  }

  /**
   * Delete a file
   */
  async deleteFile(
    directoryHandle: FileSystemDirectoryHandle,
    filename: string
  ): Promise<boolean> {
    try {
      await directoryHandle.removeEntry(filename);
      console.log(`File deleted: ${filename}`);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(
    fileHandle: FileSystemFileHandle
  ): Promise<{
    name: string;
    size: number;
    lastModified: number;
  } | null> {
    try {
      const file = await fileHandle.getFile();
      return {
        name: file.name,
        size: file.size,
        lastModified: file.lastModified,
      };
    } catch (error) {
      console.error('Error getting file metadata:', error);
      return null;
    }
  }

  /**
   * Append content to an existing file
   */
  async appendToFile(
    directoryHandle: FileSystemDirectoryHandle,
    filename: string,
    content: string
  ): Promise<FileSaveResult> {
    try {
      // Check if file exists
      const exists = await this.fileExists(directoryHandle, { filename });

      if (!exists) {
        // File doesn't exist, create it
        return await this.saveFile(directoryHandle, { filename, content });
      }

      // Read existing content
      const fileHandle = await directoryHandle.getFileHandle(filename);
      const existingContent = await this.readFile(fileHandle);

      // Append new content
      const newContent = existingContent + content;

      // Write back
      return await this.saveFile(directoryHandle, {
        filename,
        content: newContent,
        overwrite: true,
      });
    } catch (error) {
      console.error('Error appending to file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export singleton instance
export const fileSaver = new FileSaver();
