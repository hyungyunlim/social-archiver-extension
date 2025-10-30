/**
 * Markdown Converter - Converts parsed post data to Obsidian-compatible markdown
 */

import { format } from 'date-fns';
import type { ParsedPostData } from './parser.types';
import type {
  MarkdownFrontmatter,
  MarkdownConversionOptions,
  MarkdownConversionResult,
  MarkdownDocument,
  MediaReference,
  EngagementMetrics,
} from './markdown.types';

/**
 * Converts parsed social media posts to Obsidian-compatible markdown format
 */
export class MarkdownConverter {
  private static readonly DEFAULT_TITLE_LENGTH = 50;

  /**
   * Convert parsed post data to markdown
   */
  async convert(
    postData: ParsedPostData,
    mediaReferences: MediaReference[] = [],
    options: MarkdownConversionOptions = {}
  ): Promise<MarkdownConversionResult> {
    try {
      const {
        includeEngagement = true,
        includeMediaLinks = true,
        maxTitleLength = MarkdownConverter.DEFAULT_TITLE_LENGTH,
        preserveFormatting = true,
      } = options;

      // Generate title from content
      const title = this.generateTitle(postData.content.text, maxTitleLength);

      // Create frontmatter
      const frontmatter = this.generateFrontmatter(postData);

      // Format content
      const content = preserveFormatting
        ? this.formatContentPreserved(postData.content.text)
        : this.formatContentSimple(postData.content.text);

      // Build engagement section
      const engagementSection = includeEngagement && postData.engagement
        ? this.formatEngagementMetrics(postData.engagement)
        : '';

      // Build media section
      const mediaSection = includeMediaLinks && mediaReferences.length > 0
        ? this.formatMediaReferences(mediaReferences)
        : '';

      // Assemble markdown document
      const markdown = this.assembleMarkdown({
        frontmatter,
        title,
        content,
        mediaReferences,
        engagement: postData.engagement,
      }, { engagementSection, mediaSection });

      // Generate filename
      const filename = this.generateFilename(postData, title);

      return {
        success: true,
        markdown,
        title,
        filename,
      };
    } catch (error) {
      console.error('Markdown conversion error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate YAML frontmatter
   */
  private generateFrontmatter(postData: ParsedPostData): MarkdownFrontmatter {
    const now = new Date();
    const archivedTimestamp = format(now, "yyyy-MM-dd'T'HH:mm:ss");

    const frontmatter: MarkdownFrontmatter = {
      platform: postData.platform,
      archived: archivedTimestamp,
      url: postData.urls.canonical || postData.urls.post,
      author: postData.author.name,
    };

    // Add optional fields
    if (postData.timestamp.parsed) {
      frontmatter.timestamp = format(postData.timestamp.parsed, "yyyy-MM-dd'T'HH:mm:ss");
    }

    if (postData.media.length > 0) {
      frontmatter.media_count = postData.media.length;
      frontmatter.has_video = postData.media.some((m) => m.type === 'video');
    }

    return frontmatter;
  }

  /**
   * Format frontmatter as YAML
   */
  private formatFrontmatterYAML(frontmatter: MarkdownFrontmatter): string {
    const lines = ['---'];

    // Add each field
    lines.push(`platform: ${frontmatter.platform}`);
    lines.push(`archived: ${frontmatter.archived}`);
    lines.push(`url: "${this.escapeYAMLString(frontmatter.url)}"`);
    lines.push(`author: "${this.escapeYAMLString(frontmatter.author)}"`);

    if (frontmatter.timestamp) {
      lines.push(`timestamp: ${frontmatter.timestamp}`);
    }

    if (frontmatter.media_count !== undefined) {
      lines.push(`media_count: ${frontmatter.media_count}`);
    }

    if (frontmatter.has_video !== undefined) {
      lines.push(`has_video: ${frontmatter.has_video}`);
    }

    lines.push('---');
    return lines.join('\n');
  }

  /**
   * Escape special characters in YAML strings
   */
  private escapeYAMLString(str: string): string {
    return str.replace(/"/g, '\\"').replace(/\n/g, '\\n');
  }

  /**
   * Generate title from content
   */
  private generateTitle(content: string, maxLength: number): string {
    // Remove extra whitespace
    const cleaned = content.trim().replace(/\s+/g, ' ');

    if (cleaned.length === 0) {
      return 'Untitled Post';
    }

    // Take first line or first maxLength characters
    const firstLine = cleaned.split('\n')[0];
    const truncated = firstLine.length > maxLength
      ? firstLine.substring(0, maxLength).trim() + '...'
      : firstLine;

    return truncated;
  }

  /**
   * Format content with preserved formatting
   */
  private formatContentPreserved(text: string): string {
    // Preserve line breaks, hashtags, mentions
    let formatted = text;

    // Escape markdown special characters (except # and @)
    formatted = formatted.replace(/([\\`*_{}[\]()#+\-.!|])/g, (match) => {
      // Don't escape hashtags at word boundaries
      if (match === '#') {
        return match;
      }
      // Don't escape @ for mentions
      if (match === '@') {
        return match;
      }
      return '\\' + match;
    });

    // Convert hashtags to Obsidian tags
    formatted = formatted.replace(/#(\w+)/g, '#$1');

    // Preserve line breaks by adding double space at end of lines
    formatted = formatted.replace(/\n/g, '  \n');

    return formatted;
  }

  /**
   * Format content without special formatting
   */
  private formatContentSimple(text: string): string {
    return text.trim();
  }

  /**
   * Format engagement metrics with emoji indicators
   */
  private formatEngagementMetrics(metrics: EngagementMetrics): string {
    const lines: string[] = [];
    lines.push('\n## Engagement\n');

    if (metrics.likes !== undefined) {
      lines.push(`❤️ Likes: ${this.formatNumber(metrics.likes)}`);
    }

    if (metrics.comments !== undefined) {
      lines.push(`💬 Comments: ${this.formatNumber(metrics.comments)}`);
    }

    if (metrics.shares !== undefined) {
      lines.push(`🔄 Shares: ${this.formatNumber(metrics.shares)}`);
    }

    if (metrics.views !== undefined) {
      lines.push(`👁️ Views: ${this.formatNumber(metrics.views)}`);
    }

    return lines.join('\n');
  }

  /**
   * Format large numbers with K/M suffixes
   */
  private formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  /**
   * Format media references as Obsidian wiki-links
   */
  private formatMediaReferences(mediaRefs: MediaReference[]): string {
    const lines: string[] = [];
    lines.push('\n## Media\n');

    for (const media of mediaRefs) {
      // Use Obsidian wiki-link syntax
      const wikiLink = this.createWikiLink(media);
      lines.push(wikiLink);

      // Add caption if available
      if (media.caption) {
        lines.push(`*${media.caption}*\n`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Create Obsidian wiki-link for media
   */
  private createWikiLink(media: MediaReference): string {
    const path = `attachments/${media.filename}`;

    // Images use ![[]] syntax for embedding
    if (media.type === 'image') {
      return `![[${path}]]`;
    }

    // Videos use ![[]] syntax as well in Obsidian
    if (media.type === 'video') {
      return `![[${path}]]`;
    }

    return `[[${path}]]`;
  }

  /**
   * Assemble complete markdown document
   */
  private assembleMarkdown(
    doc: MarkdownDocument,
    sections: { engagementSection: string; mediaSection: string }
  ): string {
    const parts: string[] = [];

    // Frontmatter
    parts.push(this.formatFrontmatterYAML(doc.frontmatter));
    parts.push('');

    // Title
    parts.push(`# ${doc.title}`);
    parts.push('');

    // Content
    parts.push(doc.content);
    parts.push('');

    // Media section
    if (sections.mediaSection) {
      parts.push(sections.mediaSection);
      parts.push('');
    }

    // Engagement section
    if (sections.engagementSection) {
      parts.push(sections.engagementSection);
      parts.push('');
    }

    return parts.join('\n');
  }

  /**
   * Generate filename for markdown file
   */
  private generateFilename(postData: ParsedPostData, title: string): string {
    // Date prefix
    const date = postData.timestamp.parsed || new Date();
    const dateStr = format(date, 'yyyy-MM-dd');

    // Sanitize author name
    const author = this.sanitizeFilename(postData.author.name);

    // Sanitize title
    const titlePart = this.sanitizeFilename(title);

    return `${dateStr} - ${author} - ${titlePart}.md`;
  }

  /**
   * Sanitize string for use in filename
   */
  private sanitizeFilename(str: string): string {
    return str
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '') // Remove invalid characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/\.+$/g, '') // Remove trailing dots
      .substring(0, 50) // Limit length
      .trim();
  }

  /**
   * Convert markdown to plain text preview
   */
  generatePreview(markdown: string, maxLength: number = 200): string {
    // Remove frontmatter
    const withoutFrontmatter = markdown.replace(/^---\n[\s\S]*?\n---\n/m, '');

    // Remove markdown syntax
    const plain = withoutFrontmatter
      .replace(/#+\s/g, '') // Remove headers
      .replace(/!\[\[.*?\]\]/g, '') // Remove wiki-links
      .replace(/\[\[(.*?)\]\]/g, '$1') // Convert links to text
      .replace(/[*_`]/g, '') // Remove emphasis
      .trim();

    if (plain.length > maxLength) {
      return plain.substring(0, maxLength) + '...';
    }

    return plain;
  }
}

// Export singleton instance
export const markdownConverter = new MarkdownConverter();
