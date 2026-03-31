# FetchV-Style Video Downloader - Integration Guide

## Overview

This guide shows you how to integrate the FetchV.net-style video downloader into your React web application at `https://creative-design.uz/video-downloader`.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend                           │
│  (FetchVDashboard.jsx)                                       │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ URL Input    │  │ Format Table │  │ Lottie       │      │
│  │ & Analyze    │  │ (FetchV      │  │ Loading      │      │
│  │              │  │  Style)      │  │ Spinner      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    HTTP/JSON API
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  FastAPI Backend                             │
│  (api_enhanced.py)                                           │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ /api/extract │  │ /api/download│  │ HLS/FFmpeg   │      │
│  │ Format       │  │ Stream File  │  │ Merger       │      │
│  │ Analyzer     │  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    yt-dlp + FFmpeg
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Video Sources                                   │
│  YouTube • Instagram • TikTok • HLS/m3u8 • etc.             │
└─────────────────────────────────────────────────────────────┘
```

---

## Step 1: Backend Setup

### 1.1 Install Dependencies

```bash
cd telegram-video-bot
pip install uvicorn fastapi python-multipart
```

### 1.2 Start the Enhanced API

```bash
# Development (auto-reload)
python api_enhanced.py

# Production
uvicorn api_enhanced:app --host 0.0.0.0 --port 8000 --workers 4
```

### 1.3 API Endpoints

#### **POST /api/extract** - Analyze Video

```bash
curl -X POST http://localhost:8000/api/extract \
  -H "Content-Type: application/json" \
  -d '{"url": "https://youtube.com/watch?v=abc123"}'
```

**Response:**
```json
{
  "success": true,
  "title": "Video Title",
  "thumbnail": "https://...",
  "duration": 180,
  "duration_formatted": "3:00",
  "uploader": "Channel Name",
  "merged_formats": [
    {
      "format_id": "137+140",
      "quality": "1080p",
      "height": 1080,
      "filesize": 52428800,
      "filesize_formatted": "50.00 MB",
      "ext": "mp4",
      "vcodec": "avc1.640028",
      "acodec": "mp4a.40.2"
    }
  ],
  "video_formats": [...],
  "audio_formats": [...],
  "hls_streams": [...]
}
```

#### **POST /api/download** - Download Video

```bash
curl -X POST http://localhost:8000/api/download \
  -H "Content-Type: application/json" \
  -d '{"url": "https://youtube.com/watch?v=abc123", "quality": "1080p"}'
```

**Response:**
```json
{
  "success": true,
  "download_type": "file",
  "file_path": "/path/to/video.mp4",
  "filename": "video.mp4",
  "task_id": "a1b2c3d4",
  "message": "File ready for download",
  "filesize": 52428800
}
```

#### **GET /api/download/{task_id}** - Serve File

```bash
curl http://localhost:8000/api/download/a1b2c3d4 \
  --output video.mp4
```

---

## Step 2: Frontend Integration

### 2.1 Add React Component

Copy `FetchVDashboard.jsx` to your React project:

```bash
cp components/FetchVDashboard.jsx /path/to/your/react-app/src/
```

### 2.2 Update CORS Settings

In `api_enhanced.py`, update the CORS whitelist:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://creative-design.uz",  # Your domain
        "https://www.creative-design.uz",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 2.3 Add Loading Spinner (Optional)

For professional Lottie animations:

```bash
npm install lottie-web
```

Download a free loading animation from [LottieFiles](https://lottiefiles.com/) and place it in `/public/loading_spinner.json`.

---

## Step 3: HLS/m3u8 Stream Support

The enhanced API automatically handles HLS streams:

1. **Detection**: URLs with `.m3u8` or `protocol: hls` are identified
2. **Processing**: FFmpeg downloads and merges TS chunks
3. **Delivery**: Single MP4 file served to client

### Example: HLS Stream Download

```javascript
// Frontend
const response = await fetch('/api/extract', {
  method: 'POST',
  body: JSON.stringify({
    url: 'https://example.com/stream.m3u8'
  })
});

const data = await response.json();

// data.hls_streams will contain HLS stream info
// data.merged_formats will have the downloadable MP4
```

---

## Step 4: Production Deployment

### 4.1 Backend (FastAPI)

```bash
# Using systemd (Linux)
sudo nano /etc/systemd/system/video-downloader.service

[Unit]
Description=Video Downloader API
After=network.target

[Service]
User=www-data
WorkingDirectory=/path/to/telegram-video-bot
ExecStart=/usr/bin/python3 -m uvicorn api_enhanced:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable video-downloader
sudo systemctl start video-downloader
```

### 4.2 Frontend (React/Vite)

```bash
# Build for production
npm run build

# Deploy dist/ folder to your web server
# Or use Vercel/Netlify
```

---

## Step 5: Testing

### Test Extract Endpoint

```bash
curl -X POST http://localhost:8000/api/extract \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

### Test Download Endpoint

```bash
curl -X POST http://localhost:8000/api/download \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "quality": "720p"}'
```

### Test in Browser

1. Start backend: `python api_enhanced.py`
2. Start frontend: `npm run dev`
3. Visit `http://localhost:5173` (or your Vite port)
4. Paste a video URL
5. Click "Tahlil Qilish"
6. Select a format and download

---

## Features Comparison

| Feature | Original | FetchV Enhanced |
|---------|----------|-----------------|
| Format Selection | Basic | ✅ Comprehensive Table |
| Format Categories | None | ✅ Merged, Video, Audio, HLS |
| File Size Display | No | ✅ Yes (formatted) |
| Codec Info | No | ✅ Yes (vcodec, acodec) |
| HLS Support | Basic | ✅ Advanced (FFmpeg merge) |
| UI/UX | Simple | ✅ FetchV-style Dashboard |
| Loading Animation | None | ✅ Lottie Spinner |
| Error Handling | Basic | ✅ Detailed Messages |

---

## Troubleshooting

### Issue: CORS Error

**Solution:** Update `allow_origins` in `api_enhanced.py` to include your domain.

### Issue: YouTube Downloads Fail

**Solution:** Ensure `cookies.txt` is present in `telegram-video-bot/` folder.

### Issue: HLS Streams Timeout

**Solution:** Increase timeout in `api_enhanced.py`:
```python
"socket_timeout": 120,  # Increase from 60
"retries": 5,           # Increase from 3
```

### Issue: Lottie Not Loading

**Solution:** Check console for errors. Ensure `loading_spinner.json` is in `/public` folder.

---

## API Documentation

Access interactive API docs at:
- **Swagger UI**: `http://localhost:8000/api/docs`
- **ReDoc**: `http://localhost:8000/api/redoc`

---

## Support

For issues or questions:
- Check logs: `tail -f api.log`
- API health: `http://localhost:8000/api/health`
- Contact: Creative Design UZ Team

---

**Ready to launch!** 🚀

Your FetchV-style video downloader is now ready for production use at `https://creative-design.uz/video-downloader`.
