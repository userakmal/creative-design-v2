# 🎯 Social Media Video Downloader API

Production-ready FastAPI backend with yt-dlp integration for downloading videos from Instagram, TikTok, Twitter, YouTube, and 1000+ other sites.

## ✨ Features

- **🎬 Multi-Platform Support** - Instagram, TikTok, Twitter, YouTube, Facebook, Vimeo, Reddit, and more
- **🔐 Cookie Authentication** - Bypass login walls and private account restrictions
- **📹 Quality Selection** - Best, high, medium, low quality options
- **⚡ Async Performance** - Non-blocking I/O for high concurrency
- **🛡️ Error Handling** - User-friendly error messages for common issues
- **🔄 Rate Limiting** - Built-in protection against abuse
- **🧹 Auto Cleanup** - Automatic file cleanup to save disk space
- **📊 Health Monitoring** - Server health checks and disk usage tracking

## 📦 Quick Start

### 1. Installation

```bash
# Navigate to project
cd social-media-downloader

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Setup Cookies (For Instagram)

Instagram requires authentication. See [COOKIES_SETUP.md](COOKIES_SETUP.md) for detailed instructions.

**Quick setup:**
1. Install "Get cookies.txt LOCALLY" Chrome extension
2. Log in to Instagram
3. Export cookies as `cookies.txt`
4. Place in project root

### 3. Run Server

```bash
# Run with uvicorn
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or run directly
python app/main.py
```

Server starts at: `http://localhost:8000`

### 4. Test API

Open browser to: `http://localhost:8000/docs`

## 🚀 API Endpoints

### Health Check

```http
GET /
GET /health
```

### List Supported Platforms

```http
GET /platforms
```

**Response:**
```json
{
  "success": true,
  "data": {
    "platforms": {
      "instagram.com": "Instagram",
      "tiktok.com": "TikTok",
      "twitter.com": "Twitter/X",
      "youtube.com": "YouTube"
    },
    "count": 13
  }
}
```

### Extract Video Info

```http
POST /extract
Content-Type: application/json

{
  "url": "https://www.instagram.com/reel/ABC123/",
  "quality": "best",
  "format": "mp4"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "ABC123",
    "title": "Amazing video!",
    "uploader": "username",
    "platform": "Instagram",
    "thumbnail": "https://...",
    "duration": 30,
    "view_count": 10000,
    "download_url": "https://direct-url.com/video.mp4"
  },
  "message": "Successfully extracted info from Instagram"
}
```

### Download Video

```http
POST /download
Content-Type: application/json

{
  "url": "https://www.instagram.com/reel/ABC123/",
  "quality": "best",
  "format": "mp4"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "filename": "video_1704067200.mp4",
    "path": "/path/to/video.mp4",
    "size": 5242880,
    "size_mb": 5.0,
    "quality": "best",
    "format": "mp4"
  },
  "message": "Download complete"
}
```

### Retrieve File

```http
GET /file/{filename}
```

Returns video file for download.

### Delete File

```http
DELETE /file/{filename}
```

**Response:**
```json
{
  "success": true,
  "message": "File video_1704067200.mp4 deleted successfully"
}
```

## 📖 Usage Examples

### Python Client

```python
import httpx

async def download_video():
    url = "https://www.instagram.com/reel/ABC123/"
    
    async with httpx.AsyncClient() as client:
        # Extract info first
        response = await client.post(
            "http://localhost:8000/extract",
            json={"url": url, "quality": "best"}
        )
        data = response.json()
        
        if data["success"]:
            print(f"Found: {data['data']['title']}")
            
            # Download
            response = await client.post(
                "http://localhost:8000/download",
                json={"url": url, "quality": "best"}
            )
            data = response.json()
            
            if data["success"]:
                # Get file
                file_response = await client.get(
                    f"http://localhost:8000/file/{data['data']['filename']}"
                )
                
                with open("video.mp4", "wb") as f:
                    f.write(file_response.content)
```

### JavaScript/Frontend

```javascript
async function downloadVideo(url) {
  // Extract info
  const extractRes = await fetch('http://localhost:8000/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, quality: 'best' }),
  });
  
  const extractData = await extractRes.json();
  
  if (extractData.success) {
    console.log('Video:', extractData.data.title);
    
    // Download
    const downloadRes = await fetch('http://localhost:8000/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, quality: 'best' }),
    });
    
    const downloadData = await downloadRes.json();
    
    if (downloadData.success) {
      // Get file
      const fileRes = await fetch(
        `http://localhost:8000/file/${downloadData.data.filename}`
      );
      const blob = await fileRes.blob();
      
      // Download in browser
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = downloadData.data.filename;
      a.click();
    }
  }
}
```

### cURL

```bash
# Extract info
curl -X POST http://localhost:8000/extract \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.instagram.com/reel/ABC123/", "quality": "best"}'

# Download
curl -X POST http://localhost:8000/download \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.instagram.com/reel/ABC123/", "quality": "best"}'

# Get file
curl -O http://localhost:8000/file/video_1704067200.mp4
```

## 🍪 Cookie Setup

Instagram and some platforms require authentication.

### Quick Setup:

1. **Install browser extension:**
   - Chrome: [Get cookies.txt LOCALLY](https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc)
   - Firefox: [cookies.txt](https://addons.mozilla.org/en-US/firefox/addon/cookies-txt/)

2. **Log in to Instagram** in your browser

3. **Export cookies** using the extension

4. **Save as `cookies.txt`** in project root

5. **Restart server**

See [COOKIES_SETUP.md](COOKIES_SETUP.md) for detailed instructions.

## 🎯 Supported Platforms

| Platform | Domains | Auth Required |
|----------|---------|---------------|
| Instagram | instagram.com, instagr.am | Recommended |
| TikTok | tiktok.com | Optional |
| Twitter/X | twitter.com, x.com | Optional |
| YouTube | youtube.com, youtu.be | No |
| Facebook | facebook.com, fb.watch | Recommended |
| Vimeo | vimeo.com | No |
| Reddit | reddit.com | Optional |
| Pinterest | pinterest.com | No |
| LinkedIn | linkedin.com | Required |
| Snapchat | snapchat.com | Optional |

## 🛡️ Error Handling

The API returns user-friendly error messages:

| Error Type | HTTP Code | Message |
|------------|-----------|---------|
| `PrivateAccountError` | 403 | This account or video is private |
| `VideoDeletedError` | 404 | This video has been deleted |
| `GeoBlockedError` | 403 | Not available in your region |
| `LoginRequiredError` | 401 | Login required |
| `RateLimitError` | 429 | Too many requests |
| `UnsupportedSiteError` | 400 | Site not supported |

**Example error response:**
```json
{
  "success": false,
  "error": "PrivateAccountError",
  "message": "This account or video is private",
  "timestamp": "2024-01-01T12:00:00"
}
```

## ⚙️ Configuration

Environment variables:

```bash
# Server
HOST=0.0.0.0
PORT=8000
DEBUG=False

# Downloads
DOWNLOAD_DIR=./downloads
TEMP_DIR=./temp
MAX_FILE_SIZE=104857600  # 100MB
DOWNLOAD_TIMEOUT=120  # seconds

# Cookies
COOKIES_FILE=./cookies.txt

# Rate Limiting
RATE_LIMIT_REQUESTS=10
RATE_LIMIT_WINDOW=60  # seconds

# Cleanup
CLEANUP_INTERVAL=3600  # 1 hour
FILE_RETENTION=3600  # 1 hour
```

Create `.env` file:
```bash
HOST=0.0.0.0
PORT=8000
COOKIES_FILE=/path/to/cookies.txt
```

## 🧪 Testing

```bash
# Run examples
python example_usage.py

# Test with pytest
pip install pytest pytest-asyncio
pytest tests/ -v
```

## 📊 Performance

- **Concurrent downloads:** Limited by semaphore (default: 3)
- **Rate limiting:** 10 requests per 60 seconds per IP
- **File cleanup:** Automatic every hour
- **Async I/O:** Non-blocking for high throughput

## 🔒 Security

- **Cookies:** Never commit `cookies.txt` to Git
- **Rate limiting:** Prevents abuse
- **File cleanup:** Prevents disk exhaustion
- **Input validation:** Pydantic models validate all inputs

## 🐛 Troubleshooting

### "Login required" for Instagram
- Add cookies.txt file
- Ensure cookies are fresh (re-export if >1 week old)
- Restart server after adding cookies

### "Rate limit exceeded"
- Wait and retry (default: 60 seconds)
- Increase `RATE_LIMIT_REQUESTS` in config

### "Video deleted"
- Video was removed by uploader or platform
- Try a different URL

### "Private account"
- Account is private, needs authentication
- Add cookies from an account that follows them

### Slow downloads
- Check internet connection
- Platform may be rate limiting
- Try lower quality setting

## 📝 License

MIT License - See LICENSE file.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new features
4. Submit pull request

## 📧 Support

- **Documentation:** See files in this directory
- **Examples:** `example_usage.py`
- **Cookies:** `COOKIES_SETUP.md`
- **Issues:** GitHub Issues

---

**Built with ❤️ by Creative Design Uz Team**

**Version:** 2.0.0  
**Last Updated:** 2024
