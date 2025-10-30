<script lang="ts">
  import type { PlatformState } from '../types';
  import { Platform } from '@shared/types';

  interface Props {
    platformState: PlatformState;
    onStartArchive: () => void;
  }

  let { platformState, onStartArchive }: Props = $props();

  function getPlatformIcon(platform: Platform | null): string {
    switch (platform) {
      case Platform.FACEBOOK:
        return '📘';
      case Platform.INSTAGRAM:
        return '📸';
      case Platform.LINKEDIN:
        return '💼';
      default:
        return '🌐';
    }
  }

  function getPlatformColor(platform: Platform | null): string {
    switch (platform) {
      case Platform.FACEBOOK:
        return 'from-blue-600 to-blue-700';
      case Platform.INSTAGRAM:
        return 'from-pink-500 via-purple-500 to-orange-500';
      case Platform.LINKEDIN:
        return 'from-blue-700 to-blue-800';
      default:
        return 'from-gray-600 to-gray-700';
    }
  }

  function getPlatformName(platform: Platform | null): string {
    if (!platform) return 'Unknown';
    return platform.charAt(0).toUpperCase() + platform.slice(1);
  }
</script>

<div class="p-6">
  {#if platformState.platform}
    <!-- Platform Detected -->
    <div class="text-center mb-6">
      <div class={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br ${getPlatformColor(platformState.platform)} text-4xl mb-4`}>
        {getPlatformIcon(platformState.platform)}
      </div>

      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        {getPlatformName(platformState.platform)} Detected
      </h2>

      <p class="text-sm text-gray-600 dark:text-gray-400">
        Ready to archive posts from this page
      </p>
    </div>

    <!-- Stats -->
    {#if platformState.postsDetected > 0}
      <div class="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-600 dark:text-gray-400">Posts detected:</span>
          <span class="text-lg font-bold text-gray-900 dark:text-white">
            {platformState.postsDetected}
          </span>
        </div>
      </div>
    {/if}

    <!-- Archive Button -->
    <button
      onclick={onStartArchive}
      disabled={!platformState.ready}
      class="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
    >
      {platformState.ready ? 'Start Archiving' : 'Initializing...'}
    </button>

    <!-- Current URL -->
    <div class="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-400 break-all">
      {platformState.url}
    </div>
  {:else}
    <!-- No Platform Detected -->
    <div class="text-center py-8">
      <div class="text-6xl mb-4">🌐</div>
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
        No Platform Detected
      </h2>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Navigate to Facebook, Instagram, or LinkedIn to start archiving
      </p>

      <div class="flex justify-center gap-4 text-3xl">
        <span>📘</span>
        <span>📸</span>
        <span>💼</span>
      </div>
    </div>
  {/if}
</div>
