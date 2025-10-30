/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{html,js,svelte,ts}',
  ],
  theme: {
    extend: {
      colors: {
        // Add custom colors for social platforms
        facebook: '#1877F2',
        instagram: '#E4405F',
        linkedin: '#0A66C2',
      },
    },
  },
  plugins: [],
}
