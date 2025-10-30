<script lang="ts">
  import { onMount } from 'svelte';
  import { settingsManager } from '@shared/SettingsManager';
  import { FolderStructure, type ExtensionSettings } from '@shared/settings.types';
  import { vaultManager } from '@shared/VaultManager';

  interface Props {
    onClose?: () => void;
  }

  let { onClose }: Props = $props();

  // Settings state
  let settings: ExtensionSettings = $state(null!);
  let loading = $state(true);
  let saving = $state(false);
  let validationErrors: string[] = $state([]);

  // Preview state
  let folderPreview = $state('');
  let filenamePreview = $state('');

  onMount(async () => {
    await loadSettings();
    loading = false;
  });

  async function loadSettings() {
    settings = await settingsManager.getSettings();
    updatePreviews();
  }

  async function saveSettings() {
    saving = true;

    try {
      // Validate settings
      const validation = settingsManager.validateSettings(settings);

      if (!validation.valid) {
        validationErrors = validation.errors;
        saving = false;
        return;
      }

      validationErrors = [];
      await settingsManager.saveSettings(settings);

      // Show success message briefly
      setTimeout(() => {
        if (onClose) onClose();
      }, 500);
    } catch (error) {
      console.error('Failed to save settings:', error);
      validationErrors = ['Failed to save settings'];
    } finally {
      saving = false;
    }
  }

  async function selectVault() {
    try {
      const handle = await vaultManager.selectVault();
      if (handle) {
        settings.vaultPath = handle.name;
        updatePreviews();
      }
    } catch (error) {
      console.error('Failed to select vault:', error);
    }
  }

  async function exportSettings() {
    try {
      await settingsManager.downloadSettings();
    } catch (error) {
      console.error('Failed to export settings:', error);
    }
  }

  async function importSettings() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const exported = JSON.parse(text);
        const imported = await settingsManager.importSettings(exported);
        settings = imported;
        updatePreviews();
      } catch (error) {
        console.error('Failed to import settings:', error);
        validationErrors = ['Invalid settings file'];
      }
    };

    input.click();
  }

  async function resetToDefaults() {
    if (!confirm('Reset all settings to defaults?')) return;

    try {
      settings = await settingsManager.resetSettings();
      updatePreviews();
    } catch (error) {
      console.error('Failed to reset settings:', error);
    }
  }

  function updatePreviews() {
    folderPreview = settingsManager.generateFolderPathPreview(settings);
    filenamePreview = settingsManager.generateFilenamePreview(settings);
  }

  // Watch for changes and update previews
  $effect(() => {
    if (settings) {
      updatePreviews();
    }
  });
</script>

<div class="h-full overflow-y-auto bg-white dark:bg-gray-900">
  <!-- Header -->
  <div class="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <span>⚙️</span>
        <span>Settings</span>
      </h2>
      {#if onClose}
        <button onclick={onClose} class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          ✕
        </button>
      {/if}
    </div>
  </div>

  {#if loading}
    <div class="flex items-center justify-center py-16">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  {:else}
    <div class="p-6 space-y-6">
      <!-- Validation Errors -->
      {#if validationErrors.length > 0}
        <div class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <h3 class="font-semibold text-red-800 dark:text-red-200 mb-2">Validation Errors</h3>
          <ul class="text-sm text-red-700 dark:text-red-300 list-disc list-inside space-y-1">
            {#each validationErrors as error}
              <li>{error}</li>
            {/each}
          </ul>
        </div>
      {/if}

      <!-- Vault Selection -->
      <section class="space-y-3">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Obsidian Vault</h3>

        <div class="space-y-2">
          <label class="text-sm text-gray-600 dark:text-gray-400">Vault Location</label>

          {#if settings.vaultPath}
            <div class="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-green-600 dark:text-green-400">✓</span>
                <span class="text-sm text-green-800 dark:text-green-200 font-medium">{settings.vaultPath}</span>
              </div>
              <button onclick={selectVault} class="text-sm text-green-600 dark:text-green-400 hover:underline">
                Change
              </button>
            </div>
          {:else}
            <button
              onclick={selectVault}
              class="w-full py-3 px-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-indigo-500 dark:hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              📂 Select Vault Folder
            </button>
          {/if}
        </div>
      </section>

      <!-- Root Folder -->
      <section class="space-y-3">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Root Folder</h3>

        <div class="space-y-2">
          <label class="text-sm text-gray-600 dark:text-gray-400">Folder name inside vault</label>
          <input
            type="text"
            bind:value={settings.rootFolder}
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Social Archive"
          />
        </div>
      </section>

      <!-- Folder Structure -->
      <section class="space-y-3">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Folder Structure</h3>

        <div class="space-y-2">
          {#each Object.entries(FolderStructure) as [key, value]}
            <label class="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <input
                type="radio"
                name="folderStructure"
                value={value}
                bind:group={settings.folderStructure}
                class="mt-1"
              />
              <div class="flex-1">
                <div class="font-medium text-gray-900 dark:text-white text-sm">
                  {key.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' / ')}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1">
                  {value === 'platform/year/month' && 'Social Archive/facebook/2025/10/'}
                  {value === 'year/month/platform' && 'Social Archive/2025/10/facebook/'}
                  {value === 'platform' && 'Social Archive/facebook/'}
                  {value === 'flat' && 'Social Archive/'}
                </div>
              </div>
            </label>
          {/each}
        </div>
      </section>

      <!-- Filename Template -->
      <section class="space-y-3">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Filename Template</h3>

        <div class="space-y-3">
          <!-- Components -->
          <div class="grid grid-cols-2 gap-2">
            <label class="flex items-center gap-2">
              <input type="checkbox" bind:checked={settings.filenameTemplate.includeDate} class="rounded" />
              <span class="text-sm text-gray-700 dark:text-gray-300">Date</span>
            </label>
            <label class="flex items-center gap-2">
              <input type="checkbox" bind:checked={settings.filenameTemplate.includeAuthor} class="rounded" />
              <span class="text-sm text-gray-700 dark:text-gray-300">Author</span>
            </label>
            <label class="flex items-center gap-2">
              <input type="checkbox" bind:checked={settings.filenameTemplate.includeTitle} class="rounded" />
              <span class="text-sm text-gray-700 dark:text-gray-300">Title</span>
            </label>
            <label class="flex items-center gap-2">
              <input type="checkbox" bind:checked={settings.filenameTemplate.includePlatform} class="rounded" />
              <span class="text-sm text-gray-700 dark:text-gray-300">Platform</span>
            </label>
          </div>

          <!-- Date Format -->
          {#if settings.filenameTemplate.includeDate}
            <div class="space-y-2">
              <label class="text-sm text-gray-600 dark:text-gray-400">Date Format</label>
              <select
                bind:value={settings.filenameTemplate.dateFormat}
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                <option value="YYYYMMDD">YYYYMMDD</option>
                <option value="DD-MM-YYYY">DD-MM-YYYY</option>
              </select>
            </div>
          {/if}

          <!-- Separator -->
          <div class="space-y-2">
            <label class="text-sm text-gray-600 dark:text-gray-400">Separator</label>
            <select
              bind:value={settings.filenameTemplate.separator}
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="-">Hyphen (-)</option>
              <option value="_">Underscore (_)</option>
              <option value=" ">Space ( )</option>
            </select>
          </div>
        </div>
      </section>

      <!-- Media Settings -->
      <section class="space-y-3">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Media Settings</h3>

        <div class="space-y-3">
          <!-- Download Toggle -->
          <label class="flex items-center gap-2">
            <input type="checkbox" bind:checked={settings.media.downloadMedia} class="rounded" />
            <span class="text-sm text-gray-700 dark:text-gray-300">Download media files</span>
          </label>

          {#if settings.media.downloadMedia}
            <!-- Media Types -->
            <div class="pl-6 space-y-2">
              <label class="flex items-center gap-2">
                <input type="checkbox" bind:checked={settings.media.downloadImages} class="rounded" />
                <span class="text-sm text-gray-700 dark:text-gray-300">Download images</span>
              </label>
              <label class="flex items-center gap-2">
                <input type="checkbox" bind:checked={settings.media.downloadVideos} class="rounded" />
                <span class="text-sm text-gray-700 dark:text-gray-300">Download videos</span>
              </label>
              <label class="flex items-center gap-2">
                <input type="checkbox" bind:checked={settings.media.useAttachmentsFolder} class="rounded" />
                <span class="text-sm text-gray-700 dark:text-gray-300">Use attachments subfolder</span>
              </label>
            </div>

            <!-- Max File Size -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <label class="text-sm text-gray-600 dark:text-gray-400">Max file size</label>
                <span class="text-sm font-medium text-gray-900 dark:text-white">{settings.media.maxFileSizeMB} MB</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                bind:value={settings.media.maxFileSizeMB}
                class="w-full"
              />
            </div>
          {/if}
        </div>
      </section>

      <!-- Markdown Options -->
      <section class="space-y-3">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Markdown Options</h3>

        <div class="space-y-2">
          <label class="flex items-center gap-2">
            <input type="checkbox" bind:checked={settings.markdown.includeEngagement} class="rounded" />
            <span class="text-sm text-gray-700 dark:text-gray-300">Include engagement metrics</span>
          </label>
          <label class="flex items-center gap-2">
            <input type="checkbox" bind:checked={settings.markdown.includeFrontmatter} class="rounded" />
            <span class="text-sm text-gray-700 dark:text-gray-300">Include YAML frontmatter</span>
          </label>
          <label class="flex items-center gap-2">
            <input type="checkbox" bind:checked={settings.markdown.preserveFormatting} class="rounded" />
            <span class="text-sm text-gray-700 dark:text-gray-300">Preserve text formatting</span>
          </label>
        </div>
      </section>

      <!-- Preview -->
      <section class="space-y-3">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Preview</h3>

        <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2 font-mono text-sm">
          <div>
            <span class="text-gray-600 dark:text-gray-400">Folder:</span>
            <span class="text-gray-900 dark:text-white ml-2">{folderPreview}</span>
          </div>
          <div>
            <span class="text-gray-600 dark:text-gray-400">File:</span>
            <span class="text-gray-900 dark:text-white ml-2">{filenamePreview}</span>
          </div>
        </div>
      </section>

      <!-- Actions -->
      <section class="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div class="flex gap-2">
          <button
            onclick={exportSettings}
            class="flex-1 py-2 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm"
          >
            📤 Export
          </button>
          <button
            onclick={importSettings}
            class="flex-1 py-2 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm"
          >
            📥 Import
          </button>
          <button
            onclick={resetToDefaults}
            class="flex-1 py-2 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm"
          >
            🔄 Reset
          </button>
        </div>

        <button
          onclick={saveSettings}
          disabled={saving}
          class="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          {saving ? 'Saving...' : '💾 Save Settings'}
        </button>
      </section>
    </div>
  {/if}
</div>
