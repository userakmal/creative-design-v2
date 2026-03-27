# 📋 Quality Selection - Quick Reference

## Callback Data Format

```
quality_{urlId}_{formatId}_{order}
```

### Example Callback Data

```
quality_YWJjZGVmZ2hpamts_137_0
   ↓              ↓      ↓  ↓
 Prefix      Base64   Format  Position
              URL     ID
```

### Breakdown

| Part | Description | Example | Max Length |
|------|-------------|---------|------------|
| `quality_` | Prefix identifier | `quality_` | 8 chars |
| `urlId` | Base64 encoded URL (first 12 chars) | `YWJjZGVmZ2hpamts` | 12 chars |
| `formatId` | yt-dlp format ID | `137`, `22`, `140` | ~5 chars |
| `order` | Button position index | `0`, `1`, `2` | ~2 chars |

**Total:** ~30 characters (Telegram callback_data limit is 64 bytes)

---

## Inline Keyboard Structure

```javascript
[
  [
    { text: "1080p (45.2MB)", callback_data: "quality_abc123_137_0" },
    { text: "720p (28.5MB)", callback_data: "quality_abc123_136_1" }
  ],
  [
    { text: "480p (15.3MB)", callback_data: "quality_abc123_135_2" },
    { text: "360p (8.7MB)", callback_data: "quality_abc123_134_3" }
  ],
  [
    { text: "🎵 Audio Only", callback_data: "separator" }
  ],
  [
    { text: "m4a (3.5MB)", callback_data: "quality_abc123_140_4" }
  ],
  [
    { text: "❌ Bekor qilish", callback_data: "cancel_abc123" }
  ]
]
```

---

## Format ID Examples by Platform

### YouTube
| Quality | Format ID | Type | Notes |
|---------|-----------|------|-------|
| 1080p | `137` | Video only | H.264 |
| 720p | `136` | Video only | H.264 |
| 480p | `135` | Video only | H.264 |
| 360p | `134` | Video only | H.264 |
| 1080p60 | `299` | Video only | 60fps |
| 720p60 | `298` | Video only | 60fps |
| Audio HQ | `140` | Audio only | M4A 128kbps |
| Audio LQ | `139` | Audio only | M4A 48kbps |
| Combined | `22` | Video+Audio | 720p |

### Instagram
| Quality | Format ID | Type |
|---------|-----------|------|
| Best | `best` | Video+Audio |

### TikTok
| Quality | Format ID | Type |
|---------|-----------|------|
| Best | `best` | Video+Audio |

---

## Code Snippets

### Parse Callback Data

```javascript
bot.on('callback_query', async (ctx) => {
    const data = ctx.callbackQuery.data;
    
    if (data.startsWith('quality_')) {
        const parts = data.split('_');
        // parts[0] = 'quality'
        // parts[1] = urlId
        // parts[2] = formatId
        // parts[3] = order
        
        const urlId = parts[1];
        const formatId = parts[2];
        
        // Get selection from Map
        const selection = qualitySelections.get(urlId);
        
        // Download with formatId
        await downloadVideo(ctx, selection.url, formatId, loadingMsg);
    }
});
```

### Generate URL ID

```javascript
const generateUrlId = (url) => {
    return Buffer.from(url).toString('base64').substring(0, 12);
};

// Example:
// URL: https://youtube.com/watch?v=abc123
// ID:  aHR0cHM6Ly95b3V0dQ
```

### Decode URL ID

```javascript
const decodeUrlId = (urlId) => {
    try {
        return Buffer.from(urlId, 'base64').toString('utf-8');
    } catch {
        return null;
    }
};
```

---

## Format Selection Logic

### With Format ID (User Selected)

```javascript
// Download specific format + best audio
args.push('-f', `${formatId}+bestaudio[ext=m4a]/${formatId}`);
```

### Without Format ID (Auto Download)

```javascript
// Download best available
args.push('-f', 'best[ext=mp4]/best');
```

---

## User Verification

```javascript
// Store user ID with selection
qualitySelections.set(urlId, {
    url,
    videoInfo,
    chatId: ctx.chat.id,
    userId: ctx.from.id,  // ← Store user ID
    timestamp: Date.now(),
});

// Verify on callback
if (selection.userId !== userId) {
    await ctx.answerCbQuery('⚠️ Bu sizning tanlovingiz emas', { show_alert: true });
    return;
}
```

---

## Timeout Handling

```javascript
// Set timeout when creating selection
setTimeout(() => {
    qualitySelections.delete(urlId);
}, CONFIG.QUALITY_SELECTION_TIMEOUT); // 120000ms = 2 minutes

// Check on callback
if (!selection) {
    await ctx.answerCbQuery('⏰ Vaqt tugadi. Iltimos, havolani qayta yuboring', { show_alert: true });
    return;
}
```

---

## Progress Update Throttling

```javascript
let lastProgressUpdate = 0;

childProcess.stdout.on('data', (data) => {
    const progressMatch = data.toString().match(/\[download\]\s+(\d+\.?\d*)%/);
    if (progressMatch) {
        const percent = Math.round(parseFloat(progressMatch[1]));
        const now = Date.now();
        
        // Throttle to 1 update per second
        if (now - lastProgressUpdate > 1000) {
            bot.telegram.editMessageText(
                ctx.chat.id,
                waitMsg.message_id,
                null,
                `📥 Yuklanmoqda... ${percent}%`
            ).catch(() => {});
            lastProgressUpdate = now;
        }
    }
});
```

---

## Error Handling

### Common Errors

```javascript
// Format not found
if (!format) {
    await ctx.answerCbQuery('⚠️ Format topilmadi', { show_alert: true });
    return;
}

// Selection expired
if (!selection) {
    await ctx.answerCbQuery('⏰ Vaqt tugadi', { show_alert: true });
    return;
}

// Wrong user
if (selection.userId !== userId) {
    await ctx.answerCbQuery('⚠️ Bu sizning tanlovingiz emas', { show_alert: true });
    return;
}
```

---

## Testing Commands

### Test Format Fetching

```bash
node -e "
const { getVideoFormats } = require('./local-video-api/server');
getVideoFormats('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    .then(r => {
        console.log('Title:', r.title);
        console.log('Formats:', r.formats.length);
        r.formats.forEach(f => {
            console.log(\`  - \${f.resolution}: \${f.format_id} (\${f.filesize}MB)\`);
        });
    })
    .catch(console.error);
"
```

### Test URL Encoding

```bash
node -e "
const url = 'https://youtube.com/watch?v=test123';
const urlId = Buffer.from(url).toString('base64').substring(0, 12);
const decoded = Buffer.from(urlId, 'base64').toString('utf-8');
console.log('URL:', url);
console.log('ID:', urlId);
console.log('Decoded:', decoded);
console.log('Match:', url === decoded);
"
```

---

## Best Practices

1. **Always answer callback queries** - Prevents "Failed to load" animation
2. **Throttle progress updates** - Avoid Telegram rate limits
3. **Clean up selections** - Prevent memory leaks
4. **Verify user identity** - Security measure
5. **Handle timeouts gracefully** - User-friendly error messages
6. **Limit keyboard size** - Max 12 formats for better UX
7. **Use Markdown formatting** - Better readability

---

## Quick Start Checklist

- [ ] Import `Markup` from telegraf
- [ ] Add `getVideoFormats` to imports
- [ ] Add helper functions to bot.cjs
- [ ] Add `qualitySelections` Map
- [ ] Update video handler to show quality menu
- [ ] Add callback_query handler
- [ ] Update `downloadVideo` to accept formatId
- [ ] Test with YouTube URL
- [ ] Test button clicks
- [ ] Test progress updates
- [ ] Test timeout behavior

---

**Ready to use! 🎉**
