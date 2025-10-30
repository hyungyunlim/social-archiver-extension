/**
 * LinkedIn post parser
 */

import { BaseParser } from './BaseParser';
import { Platform } from '@shared/types';
import type { ParserSelectors, ParsedPostData } from '@shared/parser.types';

export class LinkedInParser extends BaseParser {
  readonly platform = Platform.LINKEDIN;

  readonly selectors: ParserSelectors = {
    postContainer: [
      '.feed-shared-update-v2',
      'div[data-id^="urn:li:activity"]',
      '.occludable-update',
    ],

    feedContainer: [
      '.scaffold-finite-scroll__content',
      'main.scaffold-layout__main',
      '.core-rail',
    ],

    author: {
      name: [
        '.update-components-actor__name',
        '.feed-shared-actor__name',
        'span[dir="ltr"] > span[aria-hidden="true"]',
      ],
      username: [
        '.update-components-actor__description',
        '.feed-shared-actor__description',
      ],
      profileLink: [
        '.update-components-actor__container a',
        '.feed-shared-actor__container-link',
      ],
      avatar: [
        '.update-components-actor__image',
        '.feed-shared-actor__avatar-image',
      ],
    },

    content: {
      text: [
        '.update-components-text',
        '.feed-shared-update-v2__description',
        '.break-words',
      ],
      readMore: [
        '.update-components-text__see-more',
        'button.feed-shared-inline-show-more-text__see-more-less-toggle',
      ],
    },

    timestamp: [
      '.update-components-actor__sub-description',
      '.feed-shared-actor__sub-description',
      'span.visually-hidden',
    ],

    media: {
      images: [
        '.update-components-image img',
        '.feed-shared-image__image',
      ],
      videos: [
        '.update-components-video video',
        '.feed-shared-video video',
      ],
    },

    engagement: {
      likes: [
        '.social-details-social-counts__reactions-count',
        'button[aria-label*="reaction"]',
      ],
      comments: [
        '.social-details-social-counts__comments',
        'button[aria-label*="comment"]',
      ],
      shares: [
        '.social-details-social-counts__item--with-social-proof',
      ],
    },

    metadata: {
      sponsored: [
        '.update-components-actor__supplementary-actor-info:contains("Promoted")',
      ],
      postLink: [
        'a[href*="/feed/update/"]',
        '.update-components-actor__container a[data-control-name]',
      ],
    },
  };

  isPostElement(element: Element): boolean {
    // Check if element matches any of the post container selectors
    const selectors = Array.isArray(this.selectors.postContainer)
      ? this.selectors.postContainer
      : [this.selectors.postContainer];

    return selectors.some((selector) => {
      try {
        return element.matches(selector);
      } catch {
        return false;
      }
    });
  }

  parsePost(element: Element): ParsedPostData | null {
    try {
      // Generate post ID - LinkedIn often has data-id attribute
      const dataId = element.getAttribute('data-id');
      const id = dataId
        ? `${this.platform}_${dataId}`
        : this.generatePostId(element);

      // Parse author info
      const authorNameEl = this.queryOne(element, this.selectors.author.name);
      const authorName = this.extractText(authorNameEl);
      const authorDescEl = this.queryOne(element, this.selectors.author.username ?? []);
      const authorDescription = this.extractText(authorDescEl);
      const authorProfileUrl = this.extractUrl(
        this.queryOne(element, this.selectors.author.profileLink ?? [])
      );
      const authorAvatarEl = this.queryOne(element, this.selectors.author.avatar ?? []);
      const authorAvatar = this.extractAttr(authorAvatarEl, 'src');

      if (!authorName) {
        console.warn('LinkedIn parser: No author name found');
        return null;
      }

      // Parse content
      const contentEl = this.queryOne(element, this.selectors.content.text);
      let textContent = this.extractText(contentEl);

      // Handle "see more" scenarios - content might be truncated
      const seeMoreBtn = this.queryOne(element, this.selectors.content.readMore ?? []);
      const hasReadMore = seeMoreBtn !== null;

      // Parse timestamp
      const timestampEl = this.queryOne(element, this.selectors.timestamp);
      const timestampRaw = this.extractText(timestampEl);

      // LinkedIn timestamps are usually relative (e.g., "2h", "1d")
      const parsedTimestamp = this.parseLinkedInTimestamp(timestampRaw);

      // Parse media
      const imageElements = this.queryAll(element, this.selectors.media.images ?? []);
      const videoElements = this.queryAll(element, this.selectors.media.videos ?? []);

      const media = [
        ...imageElements.map((img) => ({
          type: 'image' as const,
          url: this.extractAttr(img, 'src') || '',
        })),
        ...videoElements.map((vid) => ({
          type: 'video' as const,
          url: this.extractAttr(vid, 'src') || this.extractAttr(vid, 'poster') || '',
        })),
      ].filter((m) => m.url);

      // Parse engagement
      const likesEl = this.queryOne(element, this.selectors.engagement?.likes ?? []);
      const commentsEl = this.queryOne(element, this.selectors.engagement?.comments ?? []);
      const sharesEl = this.queryOne(element, this.selectors.engagement?.shares ?? []);

      const engagement = {
        likes: this.parseEngagementNumber(this.extractText(likesEl)),
        comments: this.parseEngagementNumber(this.extractText(commentsEl)),
        shares: this.parseEngagementNumber(this.extractText(sharesEl)),
      };

      // Parse post URL
      const postLinkEl = this.queryOne(element, this.selectors.metadata?.postLink ?? []);
      let postUrl = this.extractUrl(postLinkEl) || window.location.href;

      // If URL is relative, make it absolute
      if (!postUrl.startsWith('http')) {
        postUrl = `https://www.linkedin.com${postUrl}`;
      }

      // Check if sponsored
      const sponsoredEl = this.queryOne(element, this.selectors.metadata?.sponsored ?? []);
      const isSponsored = sponsoredEl !== null;

      // Determine post type
      let postType: ParsedPostData['metadata']['postType'] = 'text';
      if (videoElements.length > 0) {
        postType = 'video';
      } else if (imageElements.length > 1) {
        postType = 'carousel';
      } else if (imageElements.length === 1) {
        postType = 'image';
      }

      // Check for article/link posts
      const hasArticle = element.querySelector('.update-components-linkedin-video') !== null ||
                        element.querySelector('article') !== null;
      if (hasArticle && postType === 'text') {
        postType = 'link';
      }

      return {
        id,
        platform: this.platform,
        author: {
          name: authorName,
          username: authorDescription,
          profileUrl: authorProfileUrl || undefined,
          avatarUrl: authorAvatar || undefined,
        },
        content: {
          text: textContent,
          htmlContent: contentEl?.innerHTML,
        },
        timestamp: {
          raw: timestampRaw,
          parsed: parsedTimestamp,
        },
        media,
        engagement,
        urls: {
          post: postUrl,
          canonical: postUrl,
        },
        metadata: {
          isSponsored,
          postType,
          hasReadMore,
        },
        element: element as HTMLElement,
      };
    } catch (error) {
      console.error('LinkedIn parser error:', error);
      return null;
    }
  }

  /**
   * Parse LinkedIn's relative timestamps (e.g., "2h", "1d", "3w")
   */
  private parseLinkedInTimestamp(raw: string): Date | undefined {
    if (!raw) return undefined;

    const now = new Date();
    const match = raw.match(/(\d+)([smhdwMy])/);

    if (!match) return undefined;

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's': // seconds
        return new Date(now.getTime() - value * 1000);
      case 'm': // minutes
        return new Date(now.getTime() - value * 60 * 1000);
      case 'h': // hours
        return new Date(now.getTime() - value * 60 * 60 * 1000);
      case 'd': // days
        return new Date(now.getTime() - value * 24 * 60 * 60 * 1000);
      case 'w': // weeks
        return new Date(now.getTime() - value * 7 * 24 * 60 * 60 * 1000);
      case 'M': // months (approximate)
        return new Date(now.getTime() - value * 30 * 24 * 60 * 60 * 1000);
      case 'y': // years
        return new Date(now.getTime() - value * 365 * 24 * 60 * 60 * 1000);
      default:
        return undefined;
    }
  }

  getAllPosts(): ParsedPostData[] {
    const posts: ParsedPostData[] = [];
    const selectors = Array.isArray(this.selectors.postContainer)
      ? this.selectors.postContainer
      : [this.selectors.postContainer];

    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        if (this.isPostElement(element)) {
          const parsed = this.parsePost(element);
          if (parsed) {
            posts.push(parsed);
          }
        }
      }
    }

    return posts;
  }

  getFeedContainer(): Element | null {
    return this.queryOne(document.body, this.selectors.feedContainer);
  }
}
