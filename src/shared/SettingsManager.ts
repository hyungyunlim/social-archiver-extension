/**
 * Settings Manager - Manages extension settings with chrome.storage.sync
 */

import type { ExtensionSettings, SettingsExport } from './settings.types';
import { DEFAULT_SETTINGS } from './settings.types';

/**
 * Storage keys
 */
const STORAGE_KEY = 'extensionSettings';

/**
 * Settings change listener type
 */
export type SettingsChangeListener = (settings: ExtensionSettings) => void;

/**
 * Manages extension settings persistence and synchronization
 */
export class SettingsManager {
  private listeners: Set<SettingsChangeListener> = new Set();
  private currentSettings: ExtensionSettings | null = null;

  constructor() {
    // Listen for storage changes
    this.setupStorageListener();
  }

  /**
   * Initialize settings manager
   */
  async initialize(): Promise<void> {
    await this.loadSettings();
  }

  /**
   * Load settings from storage
   */
  async loadSettings(): Promise<ExtensionSettings> {
    try {
      const result = await chrome.storage.sync.get(STORAGE_KEY);
      const stored = result[STORAGE_KEY];

      if (stored) {
        // Merge with defaults to handle new fields
        this.currentSettings = this.migrateSettings(stored);
      } else {
        // First time, use defaults
        this.currentSettings = { ...DEFAULT_SETTINGS };
        await this.saveSettings(this.currentSettings);
      }

      return this.currentSettings;
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.currentSettings = { ...DEFAULT_SETTINGS };
      return this.currentSettings;
    }
  }

  /**
   * Save settings to storage
   */
  async saveSettings(settings: ExtensionSettings): Promise<void> {
    try {
      await chrome.storage.sync.set({
        [STORAGE_KEY]: settings,
      });

      this.currentSettings = settings;
      this.notifyListeners(settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }

  /**
   * Update partial settings
   */
  async updateSettings(partial: Partial<ExtensionSettings>): Promise<ExtensionSettings> {
    const current = await this.getSettings();
    const updated = {
      ...current,
      ...partial,
    };

    await this.saveSettings(updated);
    return updated;
  }

  /**
   * Get current settings
   */
  async getSettings(): Promise<ExtensionSettings> {
    if (!this.currentSettings) {
      return await this.loadSettings();
    }
    return this.currentSettings;
  }

  /**
   * Reset to default settings
   */
  async resetSettings(): Promise<ExtensionSettings> {
    const defaults = { ...DEFAULT_SETTINGS };
    await this.saveSettings(defaults);
    return defaults;
  }

  /**
   * Export settings as JSON
   */
  async exportSettings(): Promise<SettingsExport> {
    const settings = await this.getSettings();

    return {
      settings,
      exportedAt: new Date().toISOString(),
      version: 1,
    };
  }

  /**
   * Import settings from JSON
   */
  async importSettings(exported: SettingsExport): Promise<ExtensionSettings> {
    // Validate export format
    if (!exported.settings || !exported.version) {
      throw new Error('Invalid settings export format');
    }

    // Migrate if needed
    const migrated = this.migrateSettings(exported.settings);

    await this.saveSettings(migrated);
    return migrated;
  }

  /**
   * Download settings as JSON file
   */
  async downloadSettings(): Promise<void> {
    const exported = await this.exportSettings();
    const blob = new Blob([JSON.stringify(exported, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `social-archiver-settings-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Validate settings
   */
  validateSettings(settings: ExtensionSettings): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate root folder
    if (!settings.rootFolder || settings.rootFolder.trim().length === 0) {
      errors.push('Root folder name cannot be empty');
    }

    // Validate media settings
    if (settings.media.maxFileSizeMB < 1 || settings.media.maxFileSizeMB > 50) {
      errors.push('Max file size must be between 1 and 50 MB');
    }

    // Validate filename template
    if (
      !settings.filenameTemplate.includeDate &&
      !settings.filenameTemplate.includeAuthor &&
      !settings.filenameTemplate.includeTitle
    ) {
      errors.push('At least one filename component must be enabled');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate preview of folder path
   */
  generateFolderPathPreview(settings: ExtensionSettings, platform: string = 'facebook'): string {
    const parts: string[] = [settings.rootFolder];

    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');

    switch (settings.folderStructure) {
      case 'platform/year/month':
        parts.push(platform, year, month);
        break;
      case 'year/month/platform':
        parts.push(year, month, platform);
        break;
      case 'platform':
        parts.push(platform);
        break;
      case 'flat':
        // Just root folder
        break;
    }

    return parts.join('/');
  }

  /**
   * Generate preview of filename
   */
  generateFilenamePreview(settings: ExtensionSettings): string {
    const parts: string[] = [];
    const { filenameTemplate } = settings;
    const sep = filenameTemplate.separator;

    if (filenameTemplate.includeDate) {
      const now = new Date();
      let dateStr = '';
      switch (filenameTemplate.dateFormat) {
        case 'YYYY-MM-DD':
          dateStr = now.toISOString().split('T')[0];
          break;
        case 'YYYYMMDD':
          dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
          break;
        case 'DD-MM-YYYY':
          const day = now.getDate().toString().padStart(2, '0');
          const month = (now.getMonth() + 1).toString().padStart(2, '0');
          const year = now.getFullYear();
          dateStr = `${day}-${month}-${year}`;
          break;
      }
      parts.push(dateStr);
    }

    if (filenameTemplate.includeAuthor) {
      parts.push('John Doe');
    }

    if (filenameTemplate.includeTitle) {
      parts.push('Sample post title');
    }

    if (filenameTemplate.includePlatform) {
      parts.push('facebook');
    }

    return parts.join(sep) + '.md';
  }

  /**
   * Add settings change listener
   */
  addListener(listener: SettingsChangeListener): void {
    this.listeners.add(listener);
  }

  /**
   * Remove settings change listener
   */
  removeListener(listener: SettingsChangeListener): void {
    this.listeners.delete(listener);
  }

  /**
   * Setup storage change listener
   */
  private setupStorageListener(): void {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'sync' && changes[STORAGE_KEY]) {
        const newSettings = changes[STORAGE_KEY].newValue;
        if (newSettings) {
          this.currentSettings = newSettings;
          this.notifyListeners(newSettings);
        }
      }
    });
  }

  /**
   * Notify all listeners of settings change
   */
  private notifyListeners(settings: ExtensionSettings): void {
    this.listeners.forEach((listener) => {
      try {
        listener(settings);
      } catch (error) {
        console.error('Settings listener error:', error);
      }
    });
  }

  /**
   * Migrate settings from older versions
   */
  private migrateSettings(settings: any): ExtensionSettings {
    // Start with defaults
    const migrated: ExtensionSettings = { ...DEFAULT_SETTINGS };

    // Merge stored settings
    Object.assign(migrated, settings);

    // Ensure version is up to date
    migrated.version = DEFAULT_SETTINGS.version;

    return migrated;
  }
}

// Export singleton instance
export const settingsManager = new SettingsManager();
