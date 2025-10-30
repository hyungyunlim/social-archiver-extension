<script lang="ts">
  import type { ArchiveResultData } from '../types';
  import { Platform } from '@shared/types';

  interface Props {
    result: ArchiveResultData;
    onReset: () => void;
  }

  let { result, onReset }: Props = $props();

  function openInObsidian() {
    // Use Obsidian URI protocol to open the file
    // Format: obsidian://open?path=vault/path/to/file.md
    const obsidianUrl = `obsidian://open?path=${encodeURIComponent(result.path)}`;
    window.open(obsidianUrl, '_blank');
  }

  function getPlatformEmoji(platform: Platform): string {
    switch (platform) {
      case Platform.FACEBOOK:
        return '📘';
      case Platform.INSTAGRAM:
        return '📸';
      case Platform.LINKEDIN:
        return '💼';
      default:
        return '📄';
    }
  }

  function formatTimestamp(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  }
</script>

<div class="p-6">
  <!-- Success Icon -->
  <div class="text-center mb-6">
    <div class="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-4xl animate-bounce-once">
      ✅
    </div>

    <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
      Successfully Archived!
    </h2>

    <p class="text-sm text-gray-600 dark:text-gray-400">
      Your post has been saved to your Obsidian vault
    </p>
  </div>

  <!-- Result Details -->
  <div class="mb-6 space-y-3">
    <!-- Filename -->
    <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div class="flex items-start gap-3">
        <span class="text-2xl">{getPlatformEmoji(result.platform)}</span>
        <div class="flex-1 min-w-0">
          <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">Filename</div>
          <div class="text-sm font-medium text-gray-900 dark:text-white break-all">
            {result.filename}
          </div>
        </div>
      </div>
    </div>

    <!-- Path -->
    <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">Location</div>
      <div class="text-sm text-gray-700 dark:text-gray-300 break-all font-mono">
        {result.path}
      </div>
    </div>

    <!-- Timestamp -->
    <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">Archived At</div>
      <div class="text-sm text-gray-900 dark:text-white">
        {formatTimestamp(result.timestamp)}
      </div>
    </div>
  </div>

  <!-- Actions -->
  <div class="space-y-3">
    <!-- Open in Obsidian -->
    <button
      onclick={openInObsidian}
      class="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
    >
      <span>📝</span>
      <span>Open in Obsidian</span>
    </button>

    <!-- Archive Another -->
    <button
      onclick={onReset}
      class="w-full py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
    >
      Archive Another Post
    </button>
  </div>

  <!-- Tip -->
  <div class="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
    <div class="flex items-start gap-2">
      <span class="text-lg">💡</span>
      <div class="flex-1">
        <p class="text-xs text-blue-800 dark:text-blue-200">
          <strong>Tip:</strong> You can find all archived posts in your vault under the Social Archive folder, organized by platform and date.
        </p>
      </div>
    </div>
  </div>
</div>

<style>
  @keyframes bounce-once {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-20px);
    }
  }

  .animate-bounce-once {
    animation: bounce-once 0.6s ease-in-out;
  }
</style>
