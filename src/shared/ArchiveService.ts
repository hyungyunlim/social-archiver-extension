/**
 * Archive Service - Main service for archiving posts to vault
 */

import type { ParsedPostData } from './parser.types';
import { vaultManager } from './VaultManager';
import { folderManager } from './FolderManager';
import { fileSaver } from './FileSaver';
import { fileNameGenerator } from './FileNameGenerator';
import { markdownConverter } from './MarkdownConverter';
import { mediaDownloader } from './MediaDownloader';
import { mediaStorageManager } from './MediaStorageManager';
import type { MediaReference } from './markdown.types';

/**
 * Options for archiving a post
 */
export interface ArchiveOptions {
  overwrite?: boolean;
  autoRename?: boolean;
  downloadMedia?: boolean;
  includeEngagement?: boolean;
}

/**
 * Result of archive operation
 */
export interface ArchiveResult {
  success: boolean;
  filename?: string;
  path?: string;
  error?: string;
}

/**
 * Main service for archiving social media posts
 */
export class ArchiveService {
  /**
   * Archive a post to the vault
   */
  async archivePost(post: ParsedPostData, options: ArchiveOptions = {}): Promise<ArchiveResult> {
    try {
      const { downloadMedia = true, includeEngagement = true } = options;

      // Initialize vault manager
      await vaultManager.initialize();

      // Get vault handle
      const vaultHandle = vaultManager.getCurrentHandle();
      if (!vaultHandle) {
        return {
          success: false,
          error: 'No vault selected. Please select a vault first.',
        };
      }

      // Verify vault access
      const hasAccess = await vaultManager.verifyAndRequestAccess();
      if (!hasAccess) {
        return {
          success: false,
          error: 'Vault access denied. Please grant permission.',
        };
      }

      // Create folder structure
      const folderResult = await folderManager.ensureFolderStructure(vaultHandle, {
        platform: post.platform,
        date: post.timestamp.parsed,
      });

      if (!folderResult.success || !folderResult.handle) {
        return {
          success: false,
          error: `Failed to create folder structure: ${folderResult.error}`,
        };
      }

      // Download and store media if requested
      const mediaReferences: MediaReference[] = [];
      if (downloadMedia && post.media && post.media.length > 0) {
        for (let i = 0; i < post.media.length; i++) {
          const mediaItem = post.media[i];

          // Download media
          const downloadResult = await mediaDownloader.downloadMedia({
            url: mediaItem.url,
          });

          if (downloadResult.success && downloadResult.blob) {
            // Store media
            const format = mediaDownloader.detectFormat(mediaItem.url, downloadResult.blob);
            const storageResult = await mediaStorageManager.storeMediaBinary(vaultHandle, downloadResult.blob, {
              postId: post.id,
              mediaIndex: i,
              format: format ?? undefined,
            });

            if (storageResult.success && storageResult.filename) {
              mediaReferences.push({
                type: mediaItem.type,
                filename: storageResult.filename,
                originalUrl: mediaItem.url,
                caption: mediaItem.thumbnail,
              });
            }
          }
        }
      }

      // Convert post to markdown
      const conversionResult = await markdownConverter.convert(post, mediaReferences, {
        includeEngagement,
        includeMediaLinks: downloadMedia,
      });

      if (!conversionResult.success || !conversionResult.markdown) {
        return {
          success: false,
          error: `Failed to convert post to markdown: ${conversionResult.error}`,
        };
      }

      // Use generated filename or fallback
      const filename = conversionResult.filename || fileNameGenerator.generateFilename(post);

      // Save markdown file
      const saveResult = options.autoRename
        ? await fileSaver.saveFileWithAutoRename(folderResult.handle, {
            filename,
            content: conversionResult.markdown,
          })
        : await fileSaver.saveFile(folderResult.handle, {
            filename,
            content: conversionResult.markdown,
            overwrite: options.overwrite,
          });

      if (!saveResult.success) {
        return {
          success: false,
          error: `Failed to save file: ${saveResult.error}`,
        };
      }

      return {
        success: true,
        filename: saveResult.path,
        path: `${folderResult.path}/${saveResult.path}`,
      };
    } catch (error) {
      console.error('Error archiving post:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate preview of archived post
   */
  generatePreview(post: ParsedPostData): string {
    const markdown = markdownConverter.convert(post, [], {
      includeEngagement: false,
      includeMediaLinks: false,
    });

    // This is async but we'll handle it synchronously for preview
    return `${post.author.name}: ${post.content.text.substring(0, 100)}...`;
  }

  /**
   * Batch archive multiple posts
   */
  async archivePosts(
    posts: ParsedPostData[],
    options: ArchiveOptions = {}
  ): Promise<ArchiveResult[]> {
    const results: ArchiveResult[] = [];

    for (const post of posts) {
      const result = await this.archivePost(post, options);
      results.push(result);

      // Add small delay between saves to avoid overwhelming the system
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return results;
  }
}

// Export singleton instance
export const archiveService = new ArchiveService();
