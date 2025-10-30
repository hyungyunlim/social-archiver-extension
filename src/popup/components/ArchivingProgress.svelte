<script lang="ts">
  import type { ArchivingState } from '../types';

  interface Props {
    archivingState: ArchivingState;
  }

  let { archivingState }: Props = $props();

  function getStepIcon(status: ArchivingState['status']): string {
    switch (status) {
      case 'downloading':
        return '⬇️';
      case 'converting':
        return '🔄';
      case 'saving':
        return '💾';
      case 'complete':
        return '✅';
      default:
        return '⏳';
    }
  }

  function getStepText(status: ArchivingState['status']): string {
    switch (status) {
      case 'downloading':
        return 'Downloading media files...';
      case 'converting':
        return 'Converting to markdown...';
      case 'saving':
        return 'Saving to vault...';
      case 'complete':
        return 'Archiving complete!';
      default:
        return 'Preparing...';
    }
  }
</script>

<div class="p-6">
  <!-- Header -->
  <div class="text-center mb-8">
    <div class="text-6xl mb-4 animate-pulse">
      {getStepIcon(archivingState.status)}
    </div>

    <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
      {archivingState.status === 'complete' ? 'Complete!' : 'Archiving...'}
    </h2>

    <p class="text-sm text-gray-600 dark:text-gray-400">
      {archivingState.currentStep || getStepText(archivingState.status)}
    </p>
  </div>

  <!-- Progress Bar -->
  <div class="mb-6">
    <div class="flex items-center justify-between mb-2">
      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
      <span class="text-sm font-medium text-gray-900 dark:text-white">{Math.round(archivingState.progress)}%</span>
    </div>

    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
      <div
        class="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all duration-300 ease-out"
        style="width: {archivingState.progress}%"
        role="progressbar"
        aria-valuenow={archivingState.progress}
        aria-valuemin={0}
        aria-valuemax={100}
      ></div>
    </div>
  </div>

  <!-- Steps Indicator -->
  <div class="grid grid-cols-4 gap-2 mb-6">
    {#each [
      { status: 'idle', label: 'Start', icon: '🚀' },
      { status: 'downloading', label: 'Download', icon: '⬇️' },
      { status: 'converting', label: 'Convert', icon: '🔄' },
      { status: 'saving', label: 'Save', icon: '💾' },
    ] as step}
      <div class="text-center">
        <div
          class={`w-10 h-10 mx-auto mb-1 rounded-full flex items-center justify-center text-lg transition-colors ${
            archivingState.status === step.status
              ? 'bg-indigo-600 text-white'
              : archivingState.progress > 25 * (['idle', 'downloading', 'converting', 'saving'].indexOf(step.status))
              ? 'bg-green-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700'
          }`}
        >
          {step.icon}
        </div>
        <div class="text-xs text-gray-600 dark:text-gray-400">{step.label}</div>
      </div>
    {/each}
  </div>

  <!-- Error Display -->
  {#if archivingState.error}
    <div class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
      <div class="flex items-start gap-3">
        <span class="text-2xl">⚠️</span>
        <div class="flex-1">
          <h3 class="font-semibold text-red-800 dark:text-red-200 mb-1">Error</h3>
          <p class="text-sm text-red-700 dark:text-red-300">{archivingState.error}</p>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
</style>
