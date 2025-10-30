<script lang="ts">
  import { onMount } from 'svelte';
  import type { Post, Settings } from '@shared/types';
  import { formatTimestamp } from '@shared/utils';

  let archivedPosts: Post[] = $state([]);
  let settings: Settings | null = $state(null);
  let loading = $state(true);

  onMount(async () => {
    await loadData();
    loading = false;
  });

  async function loadData() {
    try {
      const result = await chrome.storage.local.get(['archivedPosts', 'settings']);
      archivedPosts = result.archivedPosts || [];
      settings = result.settings || {
        autoArchive: false,
        platforms: {
          facebook: true,
          instagram: true,
          linkedin: true,
        },
      };
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }

  async function toggleAutoArchive() {
    if (!settings) return;

    const newSettings = {
      ...settings,
      autoArchive: !settings.autoArchive,
    };

    await chrome.storage.local.set({ settings: newSettings });
    settings = newSettings;
  }

  function getPlatformColor(platform: string): string {
    switch (platform) {
      case 'facebook':
        return 'bg-facebook';
      case 'instagram':
        return 'bg-instagram';
      case 'linkedin':
        return 'bg-linkedin';
      default:
        return 'bg-gray-500';
    }
  }
</script>

<main class="p-6 bg-white dark:bg-gray-900 min-h-screen">
  <header class="mb-6">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
      Social Archiver
    </h1>
    <p class="text-sm text-gray-600 dark:text-gray-400">
      Archive and preserve your social media content
    </p>
  </header>

  {#if loading}
    <div class="flex items-center justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  {:else}
    <!-- Settings Section -->
    <section class="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <h2 class="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Settings</h2>

      {#if settings}
        <label class="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.autoArchive}
            onchange={toggleAutoArchive}
            class="w-4 h-4 text-indigo-600 rounded"
          />
          <span class="text-sm text-gray-700 dark:text-gray-300">
            Auto-archive posts
          </span>
        </label>
      {/if}
    </section>

    <!-- Archived Posts Section -->
    <section>
      <h2 class="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
        Archived Posts ({archivedPosts.length})
      </h2>

      {#if archivedPosts.length === 0}
        <div class="text-center py-8 text-gray-500 dark:text-gray-400">
          <p class="mb-2">No archived posts yet</p>
          <p class="text-sm">Visit a social media site to start archiving!</p>
        </div>
      {:else}
        <div class="space-y-3">
          {#each archivedPosts as post (post.id)}
            <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div class="flex items-center gap-2 mb-2">
                <span class={`px-2 py-1 text-xs text-white rounded ${getPlatformColor(post.platform)}`}>
                  {post.platform}
                </span>
                <span class="text-xs text-gray-500 dark:text-gray-400">
                  {formatTimestamp(new Date(post.timestamp))}
                </span>
              </div>

              <p class="text-sm text-gray-900 dark:text-white mb-2">
                By: {post.author}
              </p>

              <p class="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                {post.content}
              </p>

              {#if post.media && post.media.length > 0}
                <div class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {post.media.length} media item(s)
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </section>
  {/if}
</main>
