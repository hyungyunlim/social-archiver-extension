<script lang="ts">
  interface Props {
    error: string;
    onRetry: () => void;
    onReset: () => void;
  }

  let { error, onRetry, onReset }: Props = $props();
</script>

<div class="p-6">
  <!-- Error Icon -->
  <div class="text-center mb-6">
    <div class="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-4xl">
      ❌
    </div>

    <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
      Archiving Failed
    </h2>

    <p class="text-sm text-gray-600 dark:text-gray-400">
      Something went wrong while archiving the post
    </p>
  </div>

  <!-- Error Message -->
  <div class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
    <div class="text-sm text-red-800 dark:text-red-200 font-mono break-all">
      {error}
    </div>
  </div>

  <!-- Common Issues -->
  <div class="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
    <h3 class="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Common Issues:</h3>
    <ul class="text-sm text-yellow-700 dark:text-yellow-300 space-y-1 list-disc list-inside">
      <li>Vault not selected or permission denied</li>
      <li>Network error while downloading media</li>
      <li>Invalid post data or missing content</li>
      <li>File system access error</li>
    </ul>
  </div>

  <!-- Actions -->
  <div class="space-y-3">
    <!-- Retry -->
    <button
      onclick={onRetry}
      class="w-full py-3 px-4 bg-gradient-to-r from-orange-600 to-red-600 text-white font-semibold rounded-lg hover:from-orange-700 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl"
    >
      🔄 Try Again
    </button>

    <!-- Go Back -->
    <button
      onclick={onReset}
      class="w-full py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
    >
      ← Go Back
    </button>
  </div>
</div>
