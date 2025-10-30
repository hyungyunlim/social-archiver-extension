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

## 5. Real Archiving Test ✅ NOW WORKING!

**The archiving pipeline is now fully connected!**

### Prerequisites:
1. ✅ Vault must be selected in settings
2. ✅ Be on a page with posts (Facebook/Instagram/LinkedIn feed)
3. ✅ Posts must be visible in the DOM

### Test Real Archiving:

**Step 1: Select Vault (REQUIRED!)**
1. Click extension icon
2. Click ⚙️ settings button
3. Click "Select Vault Folder"
4. Choose your Obsidian vault directory
5. Click "Save Settings"

**Step 2: Navigate to Social Media**
- Go to Facebook.com feed
- Or Instagram.com feed
- Or LinkedIn.com feed
- Make sure posts are visible (scroll if needed)

**Step 3: Archive First Post**
1. Click extension icon
2. Click "Start Archiving"
3. Watch progress:
   - ⏳ Parsing post from page... (10%)
   - ⬇️ Downloading media... (30%)
   - 🔄 Converting to markdown... (50%)
   - 💾 Saving to vault... (70%)
   - ✅ Complete! (100%)

**Step 4: Verify Results**
1. Open your Obsidian vault
2. Check folder: `Social Archive/[platform]/[year]/[month]/`
3. Find the markdown file (named by date-author-title)
4. Open the file - check:
   - ✅ YAML frontmatter at top
   - ✅ Post content preserved
   - ✅ Obsidian wiki-links for images: `![[attachments/file.jpg]]`
   - ✅ Engagement metrics (if enabled)
5. Check `attachments/` folder for downloaded media

### What Works Now:
- ✅ Real DOM parsing from Facebook/Instagram/LinkedIn
- ✅ Content script ↔ Popup communication
- ✅ Markdown conversion with frontmatter
- ✅ File System Access API writing
- ✅ Folder structure creation
- ✅ Media download (with CORS fallback)
- ✅ Settings persistence
- ✅ Error handling

### Known Limitations:
- ⚠️ Only archives **first visible post** on page
- ⚠️ Some selectors may not work on all platform versions
- ⚠️ CORS may block some image downloads
- ⚠️ Platform UI changes can break selectors

## 6. Testing Edge Cases

1. **Posts with no media:**
   - Should create markdown without media section
   - ✅ Test this

2. **Posts with many images:**
   - Should download all and create wiki-links
   - ✅ Test with carousel posts

3. **Very long posts:**
   - Should preserve full content
   - ✅ Test with long text posts

4. **Special characters in content:**
   - Should escape markdown special chars
   - ✅ Test with #hashtags, @mentions, **bold**, etc.

5. **CORS-blocked images:**
   - Should try background fallback
   - May still fail - this is expected
   - ✅ Test with external images

6. **No vault selected:**
   - Should show error: "No vault selected"
   - ✅ Test without vault configured

7. **No posts on page:**
   - Should show error: "No posts found on page"
   - ✅ Test on empty page or non-feed page

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
