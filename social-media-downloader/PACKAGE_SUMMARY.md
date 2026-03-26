# 📦 Social Media Downloader - Complete Package

## ✅ What You Have

A **production-ready** video downloader API backend with:

### Core Features
- ✅ **FastAPI Backend** - Modern, async Python web framework
- ✅ **yt-dlp Integration** - Supports 1000+ sites including Instagram, TikTok, Twitter, YouTube
- ✅ **Cookie Authentication** - Bypass login walls and private account restrictions
- ✅ **Quality Selection** - Best, high, medium, low quality options
- ✅ **Async Performance** - Non-blocking I/O for high concurrency
- ✅ **Error Handling** - User-friendly error messages for common issues
- ✅ **Rate Limiting** - Built-in abuse protection
- ✅ **Auto Cleanup** - Automatic file cleanup
- ✅ **Health Monitoring** - Server health checks and disk usage tracking

### Files Created

| File | Purpose |
|------|---------|
| `app/main.py` | **Main API server** - FastAPI application with all endpoints |
| `requirements.txt` | **Dependencies** - Python packages needed |
| `example_usage.py` | **Code examples** - Python client examples |
| `README.md` | **Full documentation** - Setup and usage guide |
| `COOKIES_SETUP.md` | **Cookie configuration** - How to set up Instagram auth |
| `INTEGRATION_GUIDE.md` | **Frontend/Backend integration** - React, Vue, Node.js, PHP examples |
| `start.bat` | **Quick start script** - One-click server launch (Windows) |
| `.gitignore` | **Git configuration** - Excludes sensitive files |

## 🚀 Quick Start (5 Minutes)

### 1. Install Dependencies

```bash
cd social-media-downloader
pip install -r requirements.txt
```

### 2. Set Up Cookies (For Instagram)

1. Install browser extension: "Get cookies.txt LOCALLY"
2. Log in to Instagram
3. Export cookies as `cookies.txt`
4. Place in project root

### 3. Run Server

**Windows:**
```bash
start.bat
```

**Linux/Mac:**
```bash
python -m uvicorn app.main:app --reload
```

### 4. Test API

Open browser: `http://localhost:8000/docs`

## 📖 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/health` | GET | Detailed health status |
| `/platforms` | GET | List supported platforms |
| `/extract` | POST | Extract video info (no download) |
| `/download` | POST | Download video to server |
| `/file/{filename}` | GET | Retrieve downloaded file |
| `/file/{filename}` | DELETE | Delete file from server |

## 🎯 Supported Platforms

- ✅ Instagram (Reels, Posts, Stories, IGTV)
- ✅ TikTok
- ✅ Twitter/X
- ✅ YouTube (Videos, Shorts)
- ✅ Facebook
- ✅ Vimeo
- ✅ Reddit
- ✅ Pinterest
- ✅ LinkedIn
- ✅ Snapchat
- ✅ And 1000+ more via yt-dlp

## 🔧 Configuration

Create `.env` file:

```bash
# Server
PORT=8000
HOST=0.0.0.0

# Downloads
DOWNLOAD_DIR=./downloads
MAX_FILE_SIZE=104857600  # 100MB

# Cookies
COOKIES_FILE=./cookies.txt

# Rate Limiting
RATE_LIMIT_REQUESTS=10
RATE_LIMIT_WINDOW=60
```

## 📝 Example Usage

### Python

```python
import httpx

async def download():
    async with httpx.AsyncClient() as client:
        # Extract info
        response = await client.post(
            "http://localhost:8000/extract",
            json={"url": "https://www.instagram.com/reel/ABC123/"}
        )
        data = response.json()
        
        if data["success"]:
            print(f"Found: {data['data']['title']}")
            
            # Download
            response = await client.post(
                "http://localhost:8000/download",
                json={"url": "https://www.instagram.com/reel/ABC123/"}
            )
            data = response.json()
            
            if data["success"]:
                print(f"Downloaded: {data['data']['filename']}")
```

### JavaScript

```javascript
async function download(url) {
  const response = await fetch('http://localhost:8000/download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, quality: 'best' }),
  });
  
  const data = await response.json();
  
  if (data.success) {
    // Get file
    const fileResponse = await fetch(
      `http://localhost:8000/file/${data.data.filename}`
    );
    const blob = await fileResponse.blob();
    
    // Download
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = data.data.filename;
    a.click();
  }
}
```

## 🛡️ Error Handling

The API returns clean error messages:

| Error | Code | Message |
|-------|------|---------|
| Private Account | 403 | This account is private |
| Video Deleted | 404 | This video has been deleted |
| Geo-Blocked | 403 | Not available in your region |
| Login Required | 401 | Login required |
| Rate Limited | 429 | Too many requests |

## 🔐 Security Notes

- **Never commit `cookies.txt`** to Git (it's in `.gitignore`)
- **Use HTTPS** in production
- **Set up CORS** for your frontend domain
- **Monitor disk usage** to prevent exhaustion
- **Rate limit** to prevent abuse

## 📊 Performance

- **Concurrent requests:** Async I/O handles hundreds simultaneously
- **Rate limiting:** 10 requests per 60 seconds per IP (configurable)
- **File cleanup:** Automatic every hour
- **Download timeout:** 120 seconds per video

## 🧪 Testing

```bash
# Run examples
python example_usage.py

# Test health
curl http://localhost:8000/health

# Extract info
curl -X POST http://localhost:8000/extract \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.instagram.com/reel/ABC123/"}'
```

## 🐛 Troubleshooting

### "Login required" for Instagram
→ Add `cookies.txt` file (see COOKIES_SETUP.md)

### "Rate limit exceeded"
→ Wait 60 seconds or increase `RATE_LIMIT_REQUESTS`

### "Video deleted"
→ Video was removed by uploader

### Slow downloads
→ Check internet connection
→ Try lower quality setting

## 📚 Documentation

| Document | Description |
|----------|-------------|
| `README.md` | Main documentation |
| `COOKIES_SETUP.md` | Cookie authentication guide |
| `INTEGRATION_GUIDE.md` | Frontend/Backend integration |
| `example_usage.py` | Python code examples |

## 🎓 Next Steps

1. **Set up cookies** - Follow COOKIES_SETUP.md
2. **Test with real URLs** - Try Instagram, TikTok, Twitter
3. **Integrate with frontend** - See INTEGRATION_GUIDE.md
4. **Deploy to production** - Use Docker or direct deployment
5. **Monitor and scale** - Set up logging and monitoring

## 🤝 Support

- **Documentation:** See files in `social-media-downloader/` directory
- **Examples:** `example_usage.py`
- **Issues:** Check error messages in API responses
- **Updates:** Keep yt-dlp updated: `pip install -U yt-dlp`

---

## 🎉 Summary

You now have a **complete, production-ready video downloader API** that:

✅ Works with Instagram, TikTok, Twitter, YouTube, and 1000+ sites  
✅ Handles authentication via cookies  
✅ Provides clean error messages  
✅ Supports quality selection  
✅ Has async performance for high concurrency  
✅ Includes rate limiting and auto cleanup  
✅ Comes with full documentation and examples  

**Just run `start.bat` and start downloading!** 🚀

---

**Built with ❤️ by Creative Design Uz Team**  
**Version:** 2.0.0  
**License:** MIT
