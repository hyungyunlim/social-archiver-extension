/**
 * Instagram post parser
 */

import { BaseParser } from './BaseParser';
import { Platform } from '@shared/types';
import type { ParserSelectors, ParsedPostData } from '@shared/parser.types';

export class InstagramParser extends BaseParser {
  readonly platform = Platform.INSTAGRAM;

  readonly selectors: ParserSelectors = {
    postContainer: [
      'article[role="presentation"]',
      'div[role="button"] > article',
      'article',
    ],

    feedContainer: [
      'main[role="main"]',
      'section > main',
      'div[role="main"]',
    ],

    author: {
      name: [
        'header a[role="link"]',
        'article header a',
        'a[title]',
      ],
      username: [
        'header a[role="link"]',
        'article header a',
      ],
      profileLink: [
        'header a[href^="/"]',
        'article header a[href]',
      ],
      avatar: [
        'header img',
        'canvas + img',
      ],
    },

    content: {
      text: [
        'h1',
        'span[dir="auto"]',
        'div[data-testid="post-comment-root"]',
      ],
      readMore: [
        'button:contains("more")',
      ],
    },

    timestamp: [
      'time[datetime]',
      'a time',
    ],

    media: {
      images: [
        'article img[srcset]',
        'div[role="button"] img',
        'img[style*="object-fit"]',
      ],
      videos: [
        'article video',
        'video[playsinline]',
      ],
      carousel: [
        'button[aria-label*="Next"]',
        'div[style*="translateX"]',
      ],
    },

    engagement: {
      likes: [
        'section button span',
        'a[href*="/liked_by/"]',
        'span:contains("likes")',
      ],
      comments: [
        'a[href*="/comments/"]',
        'span:contains("comments")',
      ],
    },

    metadata: {
      postLink: [
        'a[href*="/p/"]',
        'time[datetime] ~ a',
      ],
    },
  };

  isPostElement(element: Element): boolean {
    // Instagram posts are typically article elements
    if (element.tagName.toLowerCase() !== 'article') {
      return false;
    }

    // Must have either header or media content
    const hasHeader = element.querySelector('header') !== null;
    const hasMedia =
      element.querySelector('img[srcset]') !== null ||
      element.querySelector('video') !== null;

    return hasHeader || hasMedia;
  }

  parsePost(element: Element): ParsedPostData | null {
    try {
      // Generate post ID
      const id = this.generatePostId(element);

      // Parse author info
      const authorLinkEl = this.queryOne(element, this.selectors.author.name);
      const authorName = this.extractText(authorLinkEl);
      const authorUsername = this.extractAttr(authorLinkEl, 'href')?.replace('/', '') || '';
      const authorProfileUrl = this.extractUrl(
        this.queryOne(element, this.selectors.author.profileLink ?? [])
      );
      const authorAvatarEl = this.queryOne(element, this.selectors.author.avatar ?? []);
      const authorAvatar = this.extractAttr(authorAvatarEl, 'src');

      if (!authorName && !authorUsername) {
        console.warn('Instagram parser: No author info found');
        return null;
      }

      // Parse content
      const contentEl = this.queryOne(element, this.selectors.content.text);
      let textContent = this.extractText(contentEl);

      // Instagram often has caption in h1 or spans
      if (!textContent) {
        const h1 = element.querySelector('h1');
        if (h1) {
          textContent = this.extractText(h1);
        }
      }

      // Parse timestamp
      const timestampEl = this.queryOne(element, this.selectors.timestamp);
      const timestampRaw = this.extractText(timestampEl);
      const timestampAttr = this.extractAttr(timestampEl, 'datetime');

      let parsedTimestamp: Date | undefined;
      if (timestampAttr) {
        parsedTimestamp = new Date(timestampAttr);
      }

      // Parse media
      const imageElements = this.queryAll(element, this.selectors.media.images ?? []);
      const videoElements = this.queryAll(element, this.selectors.media.videos ?? []);
      const hasCarousel = this.queryOne(element, this.selectors.media.carousel ?? []) !== null;

      const media = [
        ...imageElements
          .map((img) => {
            // Get highest quality image from srcset
            const srcset = this.extractAttr(img, 'srcset');
            let url = this.extractAttr(img, 'src') || '';

            if (srcset) {
              const sources = srcset.split(',').map((s) => s.trim());
              const highestQuality = sources[sources.length - 1];
              url = highestQuality?.split(' ')[0] || url;
            }

            return {
              type: 'image' as const,
              url,
            };
          })
          .filter((m) => m.url && !m.url.includes('avatar')), // Filter out avatar images
        ...videoElements.map((vid) => ({
          type: 'video' as const,
          url: this.extractAttr(vid, 'src') || this.extractAttr(vid, 'poster') || '',
        })),
      ].filter((m) => m.url);

      // Parse engagement (Instagram often hides exact numbers)
      const likesEl = this.queryOne(element, this.selectors.engagement?.likes ?? []);
      const commentsEl = this.queryOne(element, this.selectors.engagement?.comments ?? []);

      const likesText = this.extractText(likesEl);
      const commentsText = this.extractText(commentsEl);

      const engagement = {
        likes: this.parseEngagementNumber(likesText),
        comments: this.parseEngagementNumber(commentsText),
      };

      // Parse post URL
      const postLinkEl = this.queryOne(element, this.selectors.metadata?.postLink ?? []);
      let postUrl = this.extractUrl(postLinkEl) || window.location.href;

      // If we couldn't find the post link, try to construct it from the timestamp link
      if (!postUrl.includes('/p/')) {
        const timeLink = element.querySelector('time')?.parentElement;
        if (timeLink?.tagName.toLowerCase() === 'a') {
          postUrl = this.extractUrl(timeLink) || postUrl;
        }
      }

      // Determine post type
      let postType: ParsedPostData['metadata']['postType'] = 'text';
      if (videoElements.length > 0) {
        postType = 'video';
      } else if (hasCarousel || imageElements.length > 1) {
        postType = 'carousel';
      } else if (imageElements.length === 1) {
        postType = 'image';
      }

      return {
        id,
        platform: this.platform,
        author: {
          name: authorName || authorUsername,
          username: authorUsername,
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
          postType,
        },
        element: element as HTMLElement,
      };
    } catch (error) {
      console.error('Instagram parser error:', error);
      return null;
    }
  }

  getAllPosts(): ParsedPostData[] {
    const posts: ParsedPostData[] = [];

    // Find all article elements
    const articles = document.querySelectorAll('article');

    for (const article of articles) {
      if (this.isPostElement(article)) {
        const parsed = this.parsePost(article);
        if (parsed) {
          posts.push(parsed);
        }
      }
    }

    return posts;
  }

  getFeedContainer(): Element | null {
    return this.queryOne(document.body, this.selectors.feedContainer);
  }
}
