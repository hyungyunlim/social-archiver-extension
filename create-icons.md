# Icon Creation Instructions

The extension requires PNG icon files in the following sizes:
- 16x16
- 32x32
- 48x48
- 128x128

## Using ImageMagick (if installed)

```bash
# Install ImageMagick first if needed: brew install imagemagick

# Convert SVG to PNGs
convert -background none public/icons/icon.svg -resize 16x16 public/icons/icon16.png
convert -background none public/icons/icon.svg -resize 32x32 public/icons/icon32.png
convert -background none public/icons/icon.svg -resize 48x48 public/icons/icon48.png
convert -background none public/icons/icon.svg -resize 128x128 public/icons/icon128.png
```

## Using Online Tools

1. Go to https://cloudconvert.com/svg-to-png
2. Upload `public/icons/icon.svg`
3. Convert to each size needed
4. Save as icon16.png, icon32.png, icon48.png, icon128.png in `public/icons/`

## Temporary Workaround

For development, you can temporarily remove the icon references from manifest.json or create simple placeholder files.
