/**
 * Vault Manager - Handles Obsidian vault directory selection and permissions
 */

import type {
  DirectoryPickerOptions,
  VaultSelectionResult,
  PermissionResult,
  VaultConfig,
} from './filesystem.types';
import { handleStorage } from './HandleStorage';

/**
 * Manages vault directory selection and permissions
 */
export class VaultManager {
  private static readonly STORAGE_KEY = 'vaultConfig';
  private currentHandle: FileSystemDirectoryHandle | null = null;
  private initialized = false;

  /**
   * Check if File System Access API is supported
   */
  static isSupported(): boolean {
    return (
      'showDirectoryPicker' in window &&
      typeof (window as any).showDirectoryPicker === 'function'
    );
  }

  /**
   * Initialize the vault manager
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await handleStorage.initialize();

      // Try to restore handle from IndexedDB
      const verification = await handleStorage.verifyVaultHandle();
      if (verification.valid && verification.handle) {
        this.currentHandle = verification.handle;
        console.log('Restored vault handle from storage');
      }

      this.initialized = true;
    } catch (error) {
      console.error('Error initializing VaultManager:', error);
      this.initialized = true; // Mark as initialized even if restore failed
    }
  }

  /**
   * Prompt user to select vault directory
   */
  async selectVault(options: DirectoryPickerOptions = {}): Promise<VaultSelectionResult> {
    await this.initialize();
    if (!VaultManager.isSupported()) {
      return {
        success: false,
        error: 'File System Access API is not supported in this browser',
      };
    }

    try {
      // Show directory picker
      const handle = await (window as any).showDirectoryPicker({
        mode: options.mode || 'readwrite',
        startIn: options.startIn || 'documents',
      });

      if (!handle) {
        return {
          success: false,
          error: 'No directory selected',
        };
      }

      // Request permission
      const permissionResult = await this.requestPermission(handle);
      if (!permissionResult.granted) {
        return {
          success: false,
          error: 'Permission denied',
        };
      }

      // Store the handle
      this.currentHandle = handle;

      // Save to IndexedDB
      await handleStorage.saveVaultHandle(handle);

      // Save configuration metadata
      await this.saveVaultConfig(handle);

      return {
        success: true,
        handle,
      };
    } catch (error) {
      console.error('Error selecting vault:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Request permission for a directory handle
   */
  async requestPermission(
    handle: FileSystemDirectoryHandle,
    mode: 'read' | 'readwrite' = 'readwrite'
  ): Promise<PermissionResult> {
    try {
      // Check current permission state
      const permission = await (handle as any).queryPermission({ mode });

      if (permission === 'granted') {
        return { granted: true, state: 'granted' };
      }

      // Request permission if not granted
      const newPermission = await (handle as any).requestPermission({ mode });

      return {
        granted: newPermission === 'granted',
        state: newPermission,
      };
    } catch (error) {
      console.error('Error requesting permission:', error);
      return {
        granted: false,
        state: 'denied',
      };
    }
  }

  /**
   * Check permission state for a directory handle
   */
  async checkPermission(
    handle: FileSystemDirectoryHandle,
    mode: 'read' | 'readwrite' = 'readwrite'
  ): Promise<PermissionResult> {
    try {
      const permission = await (handle as any).queryPermission({ mode });
      return {
        granted: permission === 'granted',
        state: permission,
      };
    } catch (error) {
      console.error('Error checking permission:', error);
      return {
        granted: false,
        state: 'denied',
      };
    }
  }

  /**
   * Save vault configuration to storage
   */
  private async saveVaultConfig(handle: FileSystemDirectoryHandle): Promise<void> {
    const config: VaultConfig = {
      enabled: true,
      vaultPath: handle.name, // Note: We can't get the full path in browsers
      vaultName: handle.name,
      lastAccessTime: Date.now(),
      handleMetadata: {
        name: handle.name,
        timestamp: Date.now(),
      },
    };

    await chrome.storage.local.set({ [VaultManager.STORAGE_KEY]: config });
    console.log('Vault configuration saved:', config);
  }

  /**
   * Load vault configuration from storage
   */
  async loadVaultConfig(): Promise<VaultConfig | null> {
    try {
      const result = await chrome.storage.local.get(VaultManager.STORAGE_KEY);
      return result[VaultManager.STORAGE_KEY] || null;
    } catch (error) {
      console.error('Error loading vault config:', error);
      return null;
    }
  }

  /**
   * Clear vault configuration
   */
  async clearVaultConfig(): Promise<void> {
    this.currentHandle = null;
    await handleStorage.removeVaultHandle();
    await chrome.storage.local.remove(VaultManager.STORAGE_KEY);
    console.log('Vault configuration cleared');
  }

  /**
   * Get current vault handle
   * Note: DirectoryHandle cannot be stored directly, so this will only work
   * within the same session. For persistent access, user needs to re-select.
   */
  getCurrentHandle(): FileSystemDirectoryHandle | null {
    return this.currentHandle;
  }

  /**
   * Set current handle (for use after re-selection)
   */
  setCurrentHandle(handle: FileSystemDirectoryHandle): void {
    this.currentHandle = handle;
  }

  /**
   * Check if vault is configured and accessible
   */
  async isVaultAccessible(): Promise<boolean> {
    if (!this.currentHandle) {
      return false;
    }

    const permission = await this.checkPermission(this.currentHandle);
    return permission.granted;
  }

  /**
   * Verify vault access and re-request permission if needed
   */
  async verifyAndRequestAccess(): Promise<boolean> {
    if (!this.currentHandle) {
      console.warn('No vault handle available');
      return false;
    }

    // Check current permission
    const permission = await this.checkPermission(this.currentHandle);

    if (permission.granted) {
      return true;
    }

    // Try to request permission again
    const newPermission = await this.requestPermission(this.currentHandle);
    return newPermission.granted;
  }
}

// Export singleton instance
export const vaultManager = new VaultManager();
