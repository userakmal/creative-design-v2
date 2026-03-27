# 🎬 Video Quality Selection Feature

## Overview

The bot now supports **interactive quality selection** using Telegram Inline Keyboards. When a user sends a video URL, the bot fetches all available qualities and displays them in a button menu.

---

## Features

### ✅ What's New

1. **Inline Keyboard** - Beautiful button interface for quality selection
2. **File Size Display** - Shows estimated file size for each quality
3. **Format Information** - Resolution, codec, and quality details
4. **Progress Tracking** - Real-time download progress updates
5. **User Verification** - Only the user who sent the URL can select quality
6. **Auto-Cleanup** - Selections expire after 2 minutes
7. **Audio Only Option** - Separate section for audio extraction

---

## How It Works

### Flow Diagram

```
User sends URL
    ↓
Bot fetches video info (yt-dlp)
    ↓
Bot displays quality selection menu
    ↓
User clicks quality button
    ↓
Bot downloads specific format
    ↓
Bot sends video to Telegram
```

---

## Usage Examples

### 1. User Sends YouTube URL

**User:** `https://www.youtube.com/watch?v=dQw4w9WgXcQ`

**Bot Response:**
```
🎬 Video Topildi

📌 Nomi: Rick Astley - Never Gonna Give You Up
👤 Muallif: Rick Astley
⏱ Davomiyligi: 3:32

📊 Sifat tanlovi:
• Video: 5 ta variant
• Audio: 2 ta variant
• Eng yaxshi sifat: 1080p

⬇️ Kerakli sifatni tanlang:

[1080p (45.2MB)] [720p (28.5MB)]
[480p (15.3MB)] [360p (8.7MB)]
[240p (5.2MB)]  [144p (3.1MB)]

🎵 Audio Only
[m4a (3.5MB)] [mp3 (2.8MB)]

[❌ Bekor qilish]
```

### 2. User Clicks "720p"

**Bot:**
```
📥 Yuklanmoqda...

🎬 Rick Astley - Never Gonna...
📊 Sifat: 720p
💾 Hajmi: 28.5 MB

⏳ Kutib turing...
```

**Progress Updates:**
```
📥 Yuklanmoqda... 25%
📥 Yuklanmoqda... 50%
📥 Yuklanmoqda... 75%
📥 Yuklanmoqda... 100%
```

**Final:**
```
✅ Yuklandi! Telegramga yuborilmoqda...

[Video sent]
🎬 Video
📦 Hajmi: 28.3 MB

🤖 @CD_Video_Downloaderbot orqali yuklab olindi
```

---

## Technical Implementation

### File Structure

```
bot.cjs
├── generateQualityKeyboard()  - Creates inline keyboard
├── formatVideoInfo()          - Formats video info message
├── generateUrlId()            - Creates unique URL identifier
├── decodeUrlId()              - Decodes URL from ID
├── qualitySelections (Map)    - Stores pending selections
├── downloadVideo()            - Downloads with specific format
└── callback_query handler     - Handles button clicks

server.js
└── getVideoFormats()          - Fetches formats from yt-dlp
```

### Callback Data Format

```
quality_{urlId}_{formatId}_{order}
   ↓        ↓          ↓        ↓
 Prefix  Unique ID   Format   Position
```

**Example:**
```
quality_abc123xyz_137_0
   ↓           ↓      ↓    ↓
 Prefix    Base64   137  First button
           (URL)
```

### Code Examples

#### 1. Generate Quality Keyboard

```javascript
const generateQualityKeyboard = (formats, urlId) => {
    const keyboard = [];
    
    // Video qualities (2 buttons per row)
    const videoFormats = formats.filter(f => f.hasVideo);
    
    for (let i = 0; i < videoFormats.length; i += 2) {
        const row = [];
        for (let j = 0; j < 2 && i + j < videoFormats.length; j++) {
            const format = videoFormats[i + j];
            row.push({
                text: `${format.resolution} (${format.filesize}MB)`,
                callback_data: `quality_${urlId}_${format.format_id}_${format.order}`,
            });
        }
        keyboard.push(row);
    }
    
    // Add audio only section
    // Add cancel button
    
    return Markup.inlineKeyboard(keyboard);
};
```

#### 2. Handle Callback Query

```javascript
bot.on('callback_query', async (ctx) => {
    const data = ctx.callbackQuery.data;
    
    if (data.startsWith('quality_')) {
        const parts = data.split('_');
        const urlId = parts[1];
        const formatId = parts[2];
        
        // Get selection from Map
        const selection = qualitySelections.get(urlId);
        
        // Verify user
        if (selection.userId !== ctx.from.id) {
            return ctx.answerCbQuery('⚠️ Bu sizning tanlovingiz emas', { show_alert: true });
        }
        
        // Download with selected format
        await downloadVideo(ctx, selection.url, formatId, loadingMsg);
    }
});
```

#### 3. Download with Specific Format

```javascript
const downloadVideo = async (ctx, url, formatId, waitMsg) => {
    const args = [
        '--no-check-certificates',
        '--user-agent', userAgent,
        '-f', `${formatId}+bestaudio[ext=m4a]/${formatId}`,  // Specific format
        '-o', outputPath,
    ];
    
    if (formatId) {
        args.push('-f', `${formatId}+bestaudio[ext=m4a]/${formatId}`);
    } else {
        args.push('-f', 'best[ext=mp4]/best');
    }
    
    args.push(url);
    
    // Spawn yt-dlp and handle progress...
};
```

---

## API Reference

### `getVideoFormats(url)`

Fetches available video formats.

**Returns:**
```javascript
{
    title: "Video Title",
    duration: 212,
    thumbnail: "https://...",
    uploader: "Channel Name",
    formats: [
        {
            format_id: "137",
            resolution: "1080p",
            extension: "mp4",
            filesize: "45.2",
            filesize_bytes: 47400000,
            quality: "hd1080",
            fps: 30,
            vcodec: "avc1.640028",
            acodec: "none",
            tbr: 4500,
            hasVideo: true,
            hasAudio: false,
            order: 0
        },
        // ... more formats
    ]
}
```

### `generateQualityKeyboard(formats, urlId)`

Creates inline keyboard markup.

**Parameters:**
- `formats` (Array): Array of format objects
- `urlId` (string): Unique identifier for the URL

**Returns:** Telegraf Markup object

### `formatVideoInfo(videoInfo)`

Formats video information as Markdown text.

**Parameters:**
- `videoInfo` (Object): Video information object

**Returns:** Formatted string

---

## Customization

### Change Button Layout

Edit `generateQualityKeyboard()`:

```javascript
// 3 buttons per row instead of 2
for (let i = 0; i < videoFormats.length; i += 3) {
    const row = [];
    for (let j = 0; j < 3 && i + j < videoFormats.length; j++) {
        // ...
    }
    keyboard.push(row);
}
```

### Change Quality Labels

```javascript
const label = `${format.resolution} - ${format.filesize}MB`;
// Or
const label = `${format.resolution} (${format.quality})`;
```

### Add More Format Info

```javascript
text: `${format.resolution}${format.fps ? ' ' + format.fps : ''} (${format.filesize}MB)`
// Shows: 1080p 60fps (45.2MB)
```

### Change Timeout Duration

```javascript
// In CONFIG
QUALITY_SELECTION_TIMEOUT: 300000, // 5 minutes instead of 2
```

---

## Troubleshooting

### Issue: "Vaqt tugadi" (Timeout)

**Cause:** User took too long to select quality

**Solution:** Increase `QUALITY_SELECTION_TIMEOUT` in CONFIG

### Issue: "Bu sizning tanlovingiz emas"

**Cause:** Different user clicked the button

**Solution:** This is intentional for security. User must send their own URL.

### Issue: Format not found

**Cause:** yt-dlp returned different format IDs

**Solution:** Check server.js logs for available formats

### Issue: Progress not updating

**Cause:** Message edit rate limit (Telegram limits to ~1 edit/second)

**Solution:** Already throttled in code. Wait for download to complete.

---

## Testing

### Test Quality Selection

```bash
node -e "
const { getVideoFormats } = require('./local-video-api/server');
getVideoFormats('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    .then(console.log)
    .catch(console.error);
"
```

### Test Bot

1. Start bot: `node bot.cjs`
2. Send YouTube URL
3. Check quality selection menu appears
4. Click a quality button
5. Verify download starts
6. Check video is sent to chat

---

## Performance Considerations

1. **Format Fetching:** Cached in memory for 2 minutes
2. **Keyboard Size:** Limited to 12 formats max
3. **Progress Updates:** Throttled to 1 per second
4. **File Cleanup:** Automatic after 1 minute
5. **Memory Management:** Map auto-cleanup on timeout

---

## Future Enhancements

- [ ] Add format preview (thumbnail + sample)
- [ ] Support for subtitle selection
- [ ] Batch download (multiple qualities)
- [ ] Quality presets (auto, best, worst)
- [ ] User preferences (default quality)
- [ ] Download history
- [ ] File size estimation before download

---

## Summary

The quality selection feature provides users with:
- **Choice** - Pick exact quality needed
- **Information** - See file sizes before downloading
- **Control** - Cancel if size is too large
- **Speed** - Direct format selection saves time

**Result:** Better user experience and more efficient downloads! 🎉
