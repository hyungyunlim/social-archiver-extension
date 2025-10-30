/**
 * Handle Storage - Stores FileSystemDirectoryHandle in IndexedDB
 *
 * Note: FileSystemHandle objects can be stored in IndexedDB but not in chrome.storage
 * This allows handles to persist across browser sessions.
 */

const DB_NAME = 'SocialArchiverDB';
const DB_VERSION = 1;
const STORE_NAME = 'handles';
const VAULT_HANDLE_KEY = 'vaultHandle';

/**
 * Storage service for FileSystemDirectoryHandle
 */
export class HandleStorage {
  private db: IDBDatabase | null = null;

  /**
   * Initialize IndexedDB
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });
  }

  /**
   * Ensure database is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }
  }

  /**
   * Store vault directory handle
   */
  async saveVaultHandle(handle: FileSystemDirectoryHandle): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(handle, VAULT_HANDLE_KEY);

      request.onsuccess = () => {
        console.log('Vault handle saved to IndexedDB');
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to save vault handle'));
      };
    });
  }

  /**
   * Retrieve vault directory handle
   */
  async getVaultHandle(): Promise<FileSystemDirectoryHandle | null> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(VAULT_HANDLE_KEY);

      request.onsuccess = () => {
        const handle = request.result as FileSystemDirectoryHandle | undefined;
        resolve(handle || null);
      };

      request.onerror = () => {
        reject(new Error('Failed to retrieve vault handle'));
      };
    });
  }

  /**
   * Remove vault directory handle
   */
  async removeVaultHandle(): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(VAULT_HANDLE_KEY);

      request.onsuccess = () => {
        console.log('Vault handle removed from IndexedDB');
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to remove vault handle'));
      };
    });
  }

  /**
   * Check if vault handle exists
   */
  async hasVaultHandle(): Promise<boolean> {
    try {
      const handle = await this.getVaultHandle();
      return handle !== null;
    } catch (error) {
      console.error('Error checking for vault handle:', error);
      return false;
    }
  }

  /**
   * Verify stored handle is still valid and accessible
   */
  async verifyVaultHandle(): Promise<{
    valid: boolean;
    handle?: FileSystemDirectoryHandle;
    error?: string;
  }> {
    try {
      const handle = await this.getVaultHandle();

      if (!handle) {
        return {
          valid: false,
          error: 'No handle stored',
        };
      }

      // Try to query permission to verify handle is still valid
      try {
        const permission = await (handle as any).queryPermission({ mode: 'readwrite' });

        if (permission === 'granted') {
          return {
            valid: true,
            handle,
          };
        }

        // Permission not granted, but handle is valid
        return {
          valid: true,
          handle,
          error: 'Permission not granted',
        };
      } catch (permError) {
        // Handle might be revoked or invalid
        return {
          valid: false,
          error: 'Handle no longer valid',
        };
      }
    } catch (error) {
      console.error('Error verifying vault handle:', error);
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Export singleton instance
export const handleStorage = new HandleStorage();
