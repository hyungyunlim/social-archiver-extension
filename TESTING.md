# Testing Guide - Social Archiver Extension

## 1. Load Extension in Chrome

### Step 1: Build the Extension
```bash
npm run build
```

### Step 2: Load in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `dist` folder from your project

✅ The extension should now appear in your extensions list!

## 2. Test Each Feature

### A. Platform Detection Test

**Test on Facebook:**
1. Go to https://www.facebook.com
2. Click the extension icon in Chrome toolbar
3. ✅ Should show: "Facebook Detected" with blue gradient icon 📘
4. ✅ Should display "Posts detected: X" (if on feed)

**Test on Instagram:**
1. Go to https://www.instagram.com
2. Click the extension icon
3. ✅ Should show: "Instagram Detected" with pink/purple gradient icon 📸

**Test on LinkedIn:**
1. Go to https://www.linkedin.com/feed
2. Click the extension icon
3. ✅ Should show: "LinkedIn Detected" with blue gradient icon 💼

**Test on other sites:**
1. Go to https://www.google.com
2. Click the extension icon
3. ✅ Should show: "No Platform Detected" with 🌐 icon

### B. Settings Test

1. Click the extension icon
2. Click the ⚙️ (settings) button in top-right
3. Test each setting:

**Vault Selection:**
- ✅ Click "Select Vault Folder"
- ✅ Choose an Obsidian vault folder
- ✅ Should show green checkmark with folder name

**Root Folder:**
- ✅ Change "Social Archive" to something else
- ✅ Check preview updates at bottom

**Folder Structure:**
- ✅ Select each option (4 radio buttons)
- ✅ Preview should update:
  - `platform/year/month`: `Social Archive/facebook/2025/10/`
  - `year/month/platform`: `Social Archive/2025/10/facebook/`
  - `platform`: `Social Archive/facebook/`
  - `flat`: `Social Archive/`

**Filename Template:**
- ✅ Toggle each checkbox (Date, Author, Title, Platform)
- ✅ Change date format
- ✅ Change separator (-, _, space)
- ✅ Preview should update in real-time

**Media Settings:**
- ✅ Toggle "Download media files"
- ✅ Toggle images/videos individually
- ✅ Move max file size slider (1-50 MB)

**Save Settings:**
- ✅ Click "💾 Save Settings"
- ✅ Should close settings view
- ✅ Reopen settings - values should persist

**Export/Import:**
- ✅ Click "📤 Export" - downloads JSON file
- ✅ Click "📥 Import" - select exported file
- ✅ Settings should restore

**Reset:**
- ✅ Click "🔄 Reset"
- ✅ Confirm dialog
- ✅ All settings return to defaults

### C. Archiving Flow Test (Simulated)

Currently, the archiving process is simulated. To test:

1. Go to a supported platform (Facebook/Instagram/LinkedIn)
2. Click extension icon
3. Click "Start Archiving" button
4. ✅ Should show progress screen with:
   - Animated progress bar
   - Step indicators (Start → Download → Convert → Save)
   - Progress percentage
5. ✅ After ~3 seconds, should show success screen with:
   - Green checkmark ✅
   - Sample filename
   - Sample path
   - "Open in Obsidian" button
   - "Archive Another Post" button
6. ✅ Click "Open in Obsidian" - should try to open Obsidian URI
7. ✅ Click "Archive Another Post" - returns to detection view

## 3. Debugging

### Check Console Logs

**Extension Background Console:**
1. Go to `chrome://extensions/`
2. Find "Social Archiver"
3. Click "service worker" link
4. Check console for errors

**Content Script Console:**
1. Open any supported social media site
2. Press F12 (DevTools)
3. Go to Console tab
4. Look for messages starting with:
   - "Social Archiver content script loaded"
   - "Platform detected:"
   - "Post detected:"

**Popup Console:**
1. Right-click extension icon
2. Select "Inspect popup"
3. Check console for errors

### Common Issues

**Extension doesn't load:**
- Make sure you ran `npm run build`
- Check that you selected the `dist` folder (not the root)
- Look for errors in `chrome://extensions/`

**Platform not detected:**
- Check content script is injected: DevTools → Sources → Content Scripts
- Check URL matches manifest patterns
- Refresh the page after loading extension

**Settings don't persist:**
- Check Chrome Storage: DevTools → Application → Storage → Extension Storage
- Look for errors in background service worker console

**Popup doesn't open:**
- Check for errors in popup inspector
- Try reloading the extension

## 4. Test Data Verification

### Check Storage:
1. Open DevTools on any page
2. Go to Application → Storage → Extension Storage
3. Check for `extensionSettings` key
4. Should see your settings in JSON format

### Check IndexedDB:
1. Application → Storage → IndexedDB
2. Look for vault handle storage (if vault was selected)

## 5. Real Archiving Test (Coming Soon)

**Note:** The actual archiving functionality requires:
1. Integration with real post parsing from DOM
2. Connection to File System Access API
3. Actual file writing to Obsidian vault

Currently implemented:
- ✅ UI/UX flow
- ✅ Settings management
- ✅ Platform detection
- ✅ DOM parsers (structure only)
- ✅ File system managers (structure only)
- ✅ Markdown converter

To be connected:
- ⏳ Wire popup to content script for real post data
- ⏳ Wire parsers to actual DOM elements
- ⏳ Connect file writers to vault
- ⏳ Handle real media downloads

## 6. Next Steps for Full Testing

To make the archiving actually work, you'll need to:

1. **Test on real posts:**
   - Navigate to specific posts
   - Click "Archive" on individual posts (add context menu)
   - Or select posts from feed

2. **Verify file creation:**
   - Check files appear in Obsidian vault
   - Verify folder structure matches settings
   - Check markdown formatting
   - Verify media files downloaded

3. **Test edge cases:**
   - Posts with no media
   - Posts with many images
   - Very long posts
   - Special characters in content
   - CORS-blocked images

## 7. Performance Testing

- Test with multiple posts
- Check memory usage
- Verify no memory leaks
- Test concurrent archiving

## 8. Cross-Browser Testing

- Chrome (primary)
- Edge (Chromium-based, should work)
- Brave (Chromium-based, should work)
- Arc (Chromium-based, should work)

---

## Quick Test Checklist

- [ ] Extension loads without errors
- [ ] Platform detection works on all 3 platforms
- [ ] Platform detection shows "none" on other sites
- [ ] Settings panel opens and closes
- [ ] Vault selection opens file picker
- [ ] All settings can be modified
- [ ] Settings persist after closing popup
- [ ] Preview updates in real-time
- [ ] Export creates JSON file
- [ ] Import restores settings
- [ ] Reset returns to defaults
- [ ] Archiving flow shows progress animation
- [ ] Success screen appears after completion
- [ ] "Archive Another" returns to start
- [ ] No console errors
- [ ] All buttons work
- [ ] Dark mode looks good (if system is in dark mode)

---

For issues or questions, check the console logs first!
