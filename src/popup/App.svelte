<script lang="ts">
  import { onMount } from 'svelte';
  import { MessageType, type Message, type PlatformInfo } from '@shared/types';
  import type { ParsedPostData } from '@shared/parser.types';
  import type { PopupView, PlatformState, ArchivingState, ArchiveResultData } from './types';
  import { archiveService } from '@shared/ArchiveService';

  import PlatformDetection from './components/PlatformDetection.svelte';
  import ArchivingProgress from './components/ArchivingProgress.svelte';
  import SuccessView from './components/SuccessView.svelte';
  import ErrorView from './components/ErrorView.svelte';
  import Settings from './components/Settings.svelte';

  // View state
  let currentView: PopupView = $state('detection');
  let loading = $state(true);
  let showSettings = $state(false);

  // Platform state
  let platformState: PlatformState = $state({
    platform: null,
    url: '',
    ready: false,
    postsDetected: 0,
  });

  // Archiving state
  let archivingState: ArchivingState = $state({
    status: 'idle',
    progress: 0,
    currentStep: '',
  });

  // Result state
  let archiveResult: ArchiveResultData | null = $state(null);

  // Error state
  let errorMessage: string = $state('');

  onMount(async () => {
    await detectPlatform();
    loading = false;
  });

  /**
   * Detect current platform from active tab
   */
  async function detectPlatform() {
    try {
      // Get active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab?.id) {
        console.warn('No active tab found');
        return;
      }

      // Send message to content script
      const response: Message<PlatformInfo> = await chrome.tabs.sendMessage(tab.id, {
        type: MessageType.GET_PLATFORM_INFO,
      });

      if (response?.payload) {
        platformState = {
          platform: response.payload.platform,
          url: response.payload.url,
          ready: response.payload.ready,
          postsDetected: 0, // Will be updated when we detect posts
        };
      }
    } catch (error) {
      console.error('Failed to detect platform:', error);
      platformState.ready = false;
    }
  }

  /**
   * Start archiving process
   */
  async function startArchiving() {
    currentView = 'archiving';

    try {
      // Step 1: Get post data from content script
      archivingState = {
        status: 'downloading',
        progress: 10,
        currentStep: 'Parsing post from page...',
      };

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        throw new Error('No active tab found');
      }

      // Request post data from content script
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: MessageType.ARCHIVE_CURRENT_POST,
      });

      if (!response.success || !response.postData) {
        throw new Error(response.error || 'Failed to parse post');
      }

      const postData = response.postData as ParsedPostData;
      console.log('Received post data:', postData);

      // Step 2: Downloading media (if any)
      archivingState = {
        status: 'downloading',
        progress: 30,
        currentStep: `Downloading ${postData.media.length} media file(s)...`,
      };
      await delay(500);

      // Step 3: Converting to markdown
      archivingState = {
        status: 'converting',
        progress: 50,
        currentStep: 'Converting to markdown format...',
      };
      await delay(300);

      // Step 4: Saving to vault
      archivingState = {
        status: 'saving',
        progress: 70,
        currentStep: 'Saving to Obsidian vault...',
      };

      // Actually save the file!
      const saveResult = await archiveService.archivePost(postData, {
        downloadMedia: true,
        includeEngagement: true,
        autoRename: true,
      });

      if (!saveResult.success) {
        throw new Error(saveResult.error || 'Archive failed');
      }

      // Step 5: Complete
      archivingState = {
        status: 'complete',
        progress: 100,
        currentStep: 'Archiving complete!',
      };
      await delay(500);

      // Show success view
      archiveResult = {
        filename: saveResult.filename || 'unknown.md',
        path: saveResult.path || 'unknown path',
        platform: platformState.platform!,
        timestamp: new Date(),
      };

      currentView = 'success';
    } catch (error) {
      console.error('Archiving failed:', error);
      errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      currentView = 'error';
    }
  }

  /**
   * Reset to detection view
   */
  function resetToDetection() {
    currentView = 'detection';
    archivingState = {
      status: 'idle',
      progress: 0,
      currentStep: '',
    };
    archiveResult = null;
    errorMessage = '';
  }

  /**
   * Retry archiving after error
   */
  function retryArchiving() {
    errorMessage = '';
    startArchiving();
  }

  /**
   * Utility delay function
   */
  function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function toggleSettings() {
    showSettings = !showSettings;
  }
</script>

<div class="w-96 min-h-[500px] max-h-[600px] bg-white dark:bg-gray-900 flex flex-col">
  <!-- Header -->
  <header class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <span>📚</span>
        <span>Social Archiver</span>
      </h1>
      <button
        onclick={toggleSettings}
        class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl transition-colors"
        title="Settings"
      >
        ⚙️
      </button>
    </div>
  </header>

  <!-- Main Content -->
  <main class="flex-1 overflow-hidden">
    {#if showSettings}
      <Settings onClose={toggleSettings} />
    {:else if loading}
      <div class="flex items-center justify-center py-16">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    {:else if currentView === 'detection'}
      <PlatformDetection
        {platformState}
        onStartArchive={startArchiving}
      />
    {:else if currentView === 'archiving'}
      <ArchivingProgress {archivingState} />
    {:else if currentView === 'success' && archiveResult}
      <SuccessView
        result={archiveResult}
        onReset={resetToDetection}
      />
    {:else if currentView === 'error'}
      <ErrorView
        error={errorMessage}
        onRetry={retryArchiving}
        onReset={resetToDetection}
      />
    {/if}
  </main>
</div>
