/**
 * Extension settings types
 */

/**
 * Folder structure options
 */
export enum FolderStructure {
  PLATFORM_YEAR_MONTH = 'platform/year/month', // Social Archive/facebook/2025/10/
  YEAR_MONTH_PLATFORM = 'year/month/platform', // Social Archive/2025/10/facebook/
  PLATFORM_ONLY = 'platform',                   // Social Archive/facebook/
  FLAT = 'flat',                                // Social Archive/
}

/**
 * Filename template variables
 */
export interface FilenameTemplate {
  includeDate: boolean;    // {date}
  includeAuthor: boolean;  // {author}
  includeTitle: boolean;   // {title}
  includePlatform: boolean; // {platform}
  dateFormat: 'YYYY-MM-DD' | 'YYYYMMDD' | 'DD-MM-YYYY';
  separator: '-' | '_' | ' ';
}

/**
 * Media download settings
 */
export interface MediaSettings {
  downloadMedia: boolean;
  useAttachmentsFolder: boolean;
  maxFileSizeMB: number; // 1-50
  downloadVideos: boolean;
  downloadImages: boolean;
}

/**
 * Complete extension settings
 */
export interface ExtensionSettings {
  // Vault configuration
  vaultPath: string | null;
  rootFolder: string;

  // Folder structure
  folderStructure: FolderStructure;

  // Filename
  filenameTemplate: FilenameTemplate;

  // Media settings
  media: MediaSettings;

  // Markdown options
  markdown: {
    includeEngagement: boolean;
    includeFrontmatter: boolean;
    preserveFormatting: boolean;
  };

  // Version for migrations
  version: number;
}

/**
 * Default settings
 */
export const DEFAULT_SETTINGS: ExtensionSettings = {
  vaultPath: null,
  rootFolder: 'Social Archive',
  folderStructure: FolderStructure.PLATFORM_YEAR_MONTH,
  filenameTemplate: {
    includeDate: true,
    includeAuthor: true,
    includeTitle: true,
    includePlatform: false,
    dateFormat: 'YYYY-MM-DD',
    separator: '-',
  },
  media: {
    downloadMedia: true,
    useAttachmentsFolder: true,
    maxFileSizeMB: 10,
    downloadVideos: true,
    downloadImages: true,
  },
  markdown: {
    includeEngagement: true,
    includeFrontmatter: true,
    preserveFormatting: true,
  },
  version: 1,
};

/**
 * Settings export/import format
 */
export interface SettingsExport {
  settings: ExtensionSettings;
  exportedAt: string;
  version: number;
}
