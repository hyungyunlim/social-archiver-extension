# Social Archiver Extension

A Chrome extension for archiving social media content from Facebook, Instagram, and LinkedIn.

## Features

- 🔖 Archive posts from Facebook, Instagram, and LinkedIn
- 💾 Local storage of archived content
- 🎨 Modern UI built with Svelte 5 and TailwindCSS
- ⚡ Fast build system with Vite
- 🔒 Privacy-focused: all data stored locally

## Tech Stack

- **TypeScript** 5.2+ - Type-safe development
- **Svelte** 5.0+ - Modern reactive UI framework
- **Vite** 5.0+ - Fast build tool and dev server
- **TailwindCSS** 3.3+ - Utility-first CSS framework
- **Manifest V3** - Latest Chrome extension API

## Development

### Prerequisites

- Node.js 18+ and npm
- Chrome browser

### Setup

```bash
# Install dependencies
npm install

# Run development build
npm run dev

# Build for production
npm run build

# Type check
npm run type-check
```

### Loading the Extension in Chrome

1. Build the extension: `npm run build`
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `dist` folder from this project

## Project Structure

```
src/
├── background/     # Background service worker
├── content/        # Content scripts injected into pages
├── popup/          # Extension popup UI
└── shared/         # Shared utilities and types
```

## TODO

- [ ] Create proper icon files (currently using placeholder SVG)
- [ ] Implement platform-specific post detection
- [ ] Add media download functionality
- [ ] Implement export functionality
- [ ] Add filtering and search for archived posts
- [ ] Add tagging and categorization

## License

ISC
