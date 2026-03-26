# 🚀 Universal Pro Downloader API

Production-grade video extraction system with **smart routing**, **multiple engines** (yt-dlp, Playwright), and **FFmpeg processing**.

## ✨ Features

- **🧠 Smart Router** - Factory/Strategy pattern for automatic engine selection
- **🎯 Primary Engine (yt-dlp)** - Supports 1000+ platforms with cookie authentication
- **🎭 Fallback Engine (Playwright)** - Headless browser for unknown/hard-to-extract sites
- **🎬 FFmpeg Processor** - Converts M3U8 streams to MP4
- **🔄 Automatic Fallback** - If yt-dlp fails, tries Playwright automatically
- **🛡️ Production Safeties** - Timeouts, error handling, cleanup service
- **⚡ Async Performance** - Non-blocking I/O for high concurrency

## 📁 Project Structure

```
universal-pro-downloader/
├── app/
│   ├── main.py              # FastAPI app & smart router
│   ├── extractors/
│   │   ├── __init__.py
│   │   ├── base.py          # Abstract base class
│   │   ├── ytdlp.py         # yt-dlp engine
│   │   └── playwright.py    # Playwright engine
│   ├── processors/
│   │   ├── __init__.py
│   │   └── ffmpeg.py        # FFmpeg processor
│   └── utils/
│       ├── __init__.py
│       ├── config.py        # Configuration
│       └── cleanup.py       # Cleanup service
├── requirements.txt
├── cookies.txt              # For Instagram auth (create manually)
└── README.md
```

## 🚀 Quick Start

### 1. Installation

```bash
cd universal-pro-downloader
pip install -r requirements.txt
playwright install chromium  # Install browser for fallback
```

### 2. Setup Cookies (For Instagram)

```bash
# Export cookies from browser (see COOKIES_SETUP.md)
# Save as cookies.txt in project root
```

### 3. Run Server

```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 🎯 Smart Routing Logic

The router uses **Factory/Strategy pattern** to select the best extraction engine:

```
┌─────────────────────────────────────────────────────────────┐
│                   /api/download (URL)                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Smart Router analyzes URL                                   │
│  - Check domain against known platforms                      │
│  - Check if direct M3U8/MP4                                  │
│  - Check if force_fallback flag                              │
└─────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            │                               │
            ▼                               ▼
┌───────────────────────┐       ┌───────────────────────┐
│   Try yt-dlp First    │       │  Skip to Playwright   │
│   (Primary Engine)    │       │  (Direct M3U8/MP4)    │
└───────────────────────┘       └───────────────────────┘
            │                               │
            ▼                               │
    ┌───────┴───────┐                       │
    │               │                       │
    ▼               ▼                       │
 Success        Failed                      │
    │               │                       │
    │               ▼                       │
    │       ┌───────────────┐               │
    │       │ Fallback to   │               │
    │       │ Playwright    │◄──────────────┘
    │       └───────────────┘
    │               │
    ▼               ▼
┌───────────────────────────────────┐
│     M3U8 Detected?                │
│     ─────────────                 │
│     Yes → Process with FFmpeg     │
│     No  → Return direct URL       │
└───────────────────────────────────┘
            │
            ▼
┌───────────────────────────────────┐
│     Return Result                 │
│     - download_url OR             │
│     - file_path                   │
└───────────────────────────────────┘
```

## 📖 API Endpoints

### Download Video

```http
POST /api/download
Content-Type: application/json

{
  "url": "https://www.instagram.com/reel/ABC123/",
  "quality": "best",
  "format": "mp4",
  "force_fallback": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "engine_used": "yt-dlp",
    "url": "https://www.instagram.com/reel/ABC123/",
    "download_url": "https://cdn.instagram.com/video.mp4",
    "is_m3u8": false,
    "metadata": {
      "title": "Amazing video!",
      "uploader": "username",
      "duration": 30
    },
    "processing_time": 2.5
  },
  "message": "Successfully extracted using yt-dlp"
}
```

### Extract Info (No Download)

```http
POST /api/extract-info
Content-Type: application/json

{
  "url": "https://www.tiktok.com/@user/video/123"
}
```

### Get File

```http
GET /api/file/{filename}
```

### Delete File

```http
DELETE /api/file/{filename}
```

## 🔧 Configuration

Environment variables:

```bash
# Server
PORT=8000
HOST=0.0.0.0
DEBUG=False

# Downloads
DOWNLOAD_DIR=./downloads
MAX_FILE_SIZE=500000000  # 500MB

# yt-dlp
COOKIES_FILE=./cookies.txt
YTDLP_TIMEOUT=120

# Playwright
PLAYWRIGHT_TIMEOUT=30
PLAYWRIGHT_HEADLESS=True

# FFmpeg
FFMPEG_TIMEOUT=300

# Cleanup
CLEANUP_INTERVAL=3600
FILE_RETENTION=7200
```

## 🎯 Supported Platforms

### yt-dlp (Primary - 1000+ sites)
- YouTube, Instagram, TikTok, Twitter/X
- Facebook, Vimeo, Twitch, SoundCloud
- Reddit, Pinterest, LinkedIn, Snapchat
- And 1000+ more

### Playwright (Fallback)
- Unknown sites
- Sites with heavy JavaScript
- Sites with hidden video players
- Custom video players

## 🛡️ Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| "Video is private" | Private account | Add cookies.txt |
| "Video deleted" | Removed by uploader | Try different URL |
| "Login required" | Authentication needed | Add cookies.txt |
| "Timeout" | Site too slow | Increase timeout |
| "All methods failed" | Both engines failed | Site may be protected |

## 📝 Example Usage

### Python

```python
import httpx

async def download():
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8000/api/download",
            json={
                "url": "https://www.instagram.com/reel/ABC123/",
                "quality": "best"
            }
        )
        data = response.json()
        
        if data["success"]:
            print(f"Engine: {data['data']['engine_used']}")
            print(f"URL: {data['data']['download_url']}")
```

### JavaScript

```javascript
async function download(url) {
  const response = await fetch('http://localhost:8000/api/download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, quality: 'best' }),
  });
  
  const data = await response.json();
  
  if (data.success) {
    console.log('Engine:', data.data.engine_used);
    console.log('URL:', data.data.download_url);
  }
}
```

## 🎬 FFmpeg Integration

When an M3U8 stream is detected:

1. **yt-dlp or Playwright** extracts the M3U8 URL
2. **FFmpeg** downloads all .ts chunks
3. **FFmpeg** merges chunks into single MP4
4. **Result** is saved and returned

```python
# FFmpeg command used internally:
ffmpeg -i "https://example.com/stream.m3u8" \
       -c copy \
       -bsf:a aac_adtstoasc \
       -movflags +faststart \
       -y output.mp4
```

## 🧹 Cleanup Service

Background task that:
- Runs every hour
- Removes files older than 2 hours
- Cleans up .ts, .part, .tmp files
- Prevents disk exhaustion

## 🔐 Cookies Setup

For Instagram and protected sites:

1. Install "Get cookies.txt LOCALLY" extension
2. Log in to Instagram
3. Export cookies as `cookies.txt`
4. Place in project root
5. Restart server

## 📊 Performance

- **yt-dlp extraction:** 2-10 seconds
- **Playwright extraction:** 10-30 seconds
- **FFmpeg processing:** Depends on video length
- **Concurrent requests:** Async I/O handles hundreds

## 🐛 Troubleshooting

### "FFmpeg not found"
```bash
# Install FFmpeg
# Ubuntu/Debian:
sudo apt install ffmpeg

# macOS:
brew install ffmpeg

# Windows:
# Download from ffmpeg.org
```

### "Playwright browser not found"
```bash
playwright install chromium
```

### "All methods failed"
- Try `force_fallback: true`
- Check if URL is accessible in browser
- Add cookies.txt for protected sites

## 📚 Architecture

### Factory/Strategy Pattern

```python
# Router decides which strategy to use
class UniversalDownloaderRouter:
    def extract(self, url, quality):
        # Strategy 1: yt-dlp
        if not skip_ytdlp:
            result = await self.ytdlp.extract(url)
            if result.success:
                return result
        
        # Strategy 2: Playwright (fallback)
        result = await self.playwright.extract(url)
        return result
```

### Extraction Flow

```
URL → Router → yt-dlp → Success? → Return
                    ↓ Failed
              Playwright → Success? → Return
                          ↓ Failed
                    Error Response
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new extractors
4. Submit pull request

## 📧 Support

- **Documentation:** See files in this directory
- **Issues:** Check error messages in API responses
- **Logs:** Check `universal_downloader.log`

---

**Built with ❤️ by Creative Design Uz Team**  
**Version:** 3.0.0  
**License:** MIT
