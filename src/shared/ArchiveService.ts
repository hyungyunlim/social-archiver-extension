/**
 * Archive Service - Main service for archiving posts to vault
 */

import type { ParsedPostData } from './parser.types';
import { vaultManager } from './VaultManager';
import { folderManager } from './FolderManager';
import { fileSaver } from './FileSaver';
import { fileNameGenerator } from './FileNameGenerator';

/**
 * Options for archiving a post
 */
export interface ArchiveOptions {
  overwrite?: boolean;
  autoRename?: boolean;
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

      // Generate filename
      const filename = fileNameGenerator.generateFilename(post);

      // Generate markdown content
      const content = this.generateMarkdownContent(post);

      // Save file
      const saveResult = options.autoRename
        ? await fileSaver.saveFileWithAutoRename(folderResult.handle, {
            filename,
            content,
          })
        : await fileSaver.saveFile(folderResult.handle, {
            filename,
            content,
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
   * Generate markdown content for a post
   */
  private generateMarkdownContent(post: ParsedPostData): string {
    const lines: string[] = [];

    // Frontmatter (YAML metadata)
    lines.push('---');
    lines.push(`platform: ${post.platform}`);
    lines.push(`author: ${post.author.name}`);
    if (post.author.username) {
      lines.push(`username: ${post.author.username}`);
    }
    if (post.author.profileUrl) {
      lines.push(`profile: ${post.author.profileUrl}`);
    }
    if (post.timestamp.parsed) {
      lines.push(`date: ${post.timestamp.parsed.toISOString()}`);
    }
    lines.push(`url: ${post.urls.post}`);
    lines.push(`archived: ${new Date().toISOString()}`);
    if (post.metadata.postType) {
      lines.push(`type: ${post.metadata.postType}`);
    }
    if (post.metadata.isSponsored) {
      lines.push(`sponsored: true`);
    }
    if (post.engagement) {
      lines.push(`likes: ${post.engagement.likes || 0}`);
      lines.push(`comments: ${post.engagement.comments || 0}`);
      if (post.engagement.shares) {
        lines.push(`shares: ${post.engagement.shares}`);
      }
    }
    lines.push('---');
    lines.push('');

    // Title
    lines.push(`# ${post.author.name}'s Post`);
    lines.push('');

    // Author info
    if (post.author.profileUrl) {
      lines.push(`**Author:** [${post.author.name}](${post.author.profileUrl})`);
    } else {
      lines.push(`**Author:** ${post.author.name}`);
    }
    lines.push(`**Platform:** ${post.platform}`);
    if (post.timestamp.raw) {
      lines.push(`**Posted:** ${post.timestamp.raw}`);
    }
    lines.push(`**Original URL:** ${post.urls.post}`);
    lines.push('');

    // Content
    lines.push('## Content');
    lines.push('');
    lines.push(post.content.text || '*No text content*');
    lines.push('');

    // Media
    if (post.media && post.media.length > 0) {
      lines.push('## Media');
      lines.push('');
      for (const media of post.media) {
        if (media.type === 'image') {
          lines.push(`![Image](${media.url})`);
        } else if (media.type === 'video') {
          lines.push(`[Video](${media.url})`);
        }
        lines.push('');
      }
    }

    // Engagement
    if (post.engagement) {
      lines.push('## Engagement');
      lines.push('');
      if (post.engagement.likes) {
        lines.push(`- **Likes:** ${post.engagement.likes}`);
      }
      if (post.engagement.comments) {
        lines.push(`- **Comments:** ${post.engagement.comments}`);
      }
      if (post.engagement.shares) {
        lines.push(`- **Shares:** ${post.engagement.shares}`);
      }
      lines.push('');
    }

    // Metadata
    lines.push('---');
    lines.push('');
    lines.push('*Archived with Social Archiver*');

    return lines.join('\n');
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
