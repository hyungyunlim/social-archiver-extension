import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';
import { copyFileSync, mkdirSync } from 'fs';

export default defineConfig({
  plugins: [
    svelte(),
    {
      name: 'copy-manifest',
      closeBundle() {
        // Copy manifest.json to dist
        copyFileSync('manifest.json', 'dist/manifest.json');
        console.log('Copied manifest.json to dist/');
      },
    },
  ],
  publicDir: 'public',
  base: './',
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/index.html'),
        background: resolve(__dirname, 'src/background/index.ts'),
        content: resolve(__dirname, 'src/content/index.ts'),
        injected: resolve(__dirname, 'src/content/injected.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // Keep entry file names clean for manifest references
          return chunkInfo.name === 'background' ? 'background.js' :
                 chunkInfo.name === 'content' ? 'content.js' :
                 chunkInfo.name === 'injected' ? 'injected.js' :
                 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          // Keep CSS files clean for manifest references
          if (assetInfo.name === 'content.css' || assetInfo.name === 'styles.css') {
            return 'content.css';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
    // Disable source maps in production for smaller bundle size
    sourcemap: process.env.NODE_ENV === 'development',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@shared': resolve(__dirname, 'src/shared'),
    },
  },
});
