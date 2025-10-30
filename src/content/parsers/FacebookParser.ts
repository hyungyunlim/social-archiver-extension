/**
 * Facebook post parser
 */

import { BaseParser } from './BaseParser';
import { Platform } from '@shared/types';
import type { ParserSelectors, ParsedPostData } from '@shared/parser.types';

export class FacebookParser extends BaseParser {
  readonly platform = Platform.FACEBOOK;

  readonly selectors: ParserSelectors = {
    postContainer: [
      '[data-pagelet^="FeedUnit"]',
      '[role="article"]',
      '.userContentWrapper',
      'div[data-ad-preview="message"]',
    ],

    feedContainer: [
      '[role="feed"]',
      '#contentArea',
      '.newsFeed',
    ],

    author: {
      name: [
        'h2 a[role="link"]',
        'h3 a[role="link"]',
        'strong a',
        '.userContent a',
      ],
      profileLink: [
        'h2 a[role="link"]',
        'h3 a[role="link"]',
      ],
      avatar: [
        'img[data-imgperflogname="profileCoverPhoto"]',
        'image',
        'img.img',
      ],
    },

    content: {
      text: [
        '[data-ad-comet-preview="message"]',
        '[data-ad-preview="message"]',
        '.userContent',
        '[dir="auto"]',
      ],
      readMore: [
        '[role="button"]',
        '.see_more_link',
      ],
    },

    timestamp: [
      'a[role="link"] abbr',
      'abbr[data-utime]',
      'span[id^="jsc"]',
    ],

    media: {
      images: [
        'img[data-imgperflogname]',
        'img[src*="fbcdn"]',
        'div[data-testid="post_message"] img',
      ],
      videos: [
        'video',
        'div[data-testid="post_message"] video',
      ],
    },

    engagement: {
      likes: [
        '[aria-label*="Like"]',
        'span[aria-label*="reaction"]',
      ],
      comments: [
        '[aria-label*="comment"]',
        'span[data-testid="UFI2CommentCount"]',
      ],
      shares: [
        '[aria-label*="share"]',
        'span[data-testid="UFI2SharesCount"]',
      ],
    },

    metadata: {
      sponsored: [
        'span:contains("Sponsored")',
        '[data-testid="story-subtitle"] span',
      ],
      postLink: [
        'a[href*="/posts/"]',
        'a[aria-label*="Permalink"]',
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
      // Generate post ID
      const id = this.generatePostId(element);

      // Parse author info
      const authorNameEl = this.queryOne(element, this.selectors.author.name);
      const authorName = this.extractText(authorNameEl);
      const authorProfileUrl = this.extractUrl(
        this.queryOne(element, this.selectors.author.profileLink ?? [])
      );
      const authorAvatarEl = this.queryOne(element, this.selectors.author.avatar ?? []);
      const authorAvatar = this.extractAttr(authorAvatarEl, 'src');

      if (!authorName) {
        console.warn('Facebook parser: No author name found');
        return null;
      }

      // Parse content
      const contentEl = this.queryOne(element, this.selectors.content.text);
      const textContent = this.extractText(contentEl);

      // Parse timestamp
      const timestampEl = this.queryOne(element, this.selectors.timestamp);
      const timestampRaw = this.extractText(timestampEl);
      const timestampAttr = this.extractAttr(timestampEl, 'data-utime');

      let parsedTimestamp: Date | undefined;
      if (timestampAttr) {
        parsedTimestamp = new Date(parseInt(timestampAttr) * 1000);
      }

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
          url: this.extractAttr(vid, 'src') || '',
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
      const postUrl = this.extractUrl(postLinkEl) || window.location.href;

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

      return {
        id,
        platform: this.platform,
        author: {
          name: authorName,
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
        },
        element: element as HTMLElement,
      };
    } catch (error) {
      console.error('Facebook parser error:', error);
      return null;
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
