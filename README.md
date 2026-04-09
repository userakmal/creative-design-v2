# Creative Design Platform

Video templates platform with admin dashboard and universal video downloader.

## 🚀 Quick Start

### Start Everything

```bash
start-all.bat
```

That's it! This will:
- ✅ Start Upload Server (Express) - Port 3001
- ✅ Start Client (React + Vite) - Port 5173
- ✅ Start Video Downloader (FastAPI) - Port 8000
- ✅ Open browser automatically

## 🌐 Access Points

- **Main App**: http://localhost:5173
- **Video Downloader**: http://localhost:5173/video-downloader
- **Admin Panel**: http://localhost:5173/admin
- **Video API Docs**: http://localhost:8000/api/docs

## 🏗️ Project Structure

```
creative-design-main/
├── api-server/                 # BACKEND
│   ├── upload-server.js        # Express API
│   ├── public/                 # Uploaded files
│   └── video-downloader/       # Python FastAPI
│
├── client/                     # FRONTEND
│   ├── src/                    # UI code
│   └── vite.config.ts
│
├── scripts/                    # Utility scripts
│
├── telegram-video-bot/         # Telegram bot (optional)
├── start-all.bat               # ✅ Start everything
├── package.json
└── README.md
```

## 📋 Prerequisites

- **Node.js 18+**
- **Python 3.10+**
- **FFmpeg** (for video processing)

## 🎯 Supported Video Platforms

✅ YouTube, Instagram, TikTok, Twitter/X, Facebook, Vimeo + 1000 more

## 📝 Environment

### api-server/.env
```env
PORT=3001
ADMIN_PASSWORD=creative2026
```

### api-server/video-downloader/.env
```env
PORT=8000
DOWNLOAD_DIR=downloads
```
