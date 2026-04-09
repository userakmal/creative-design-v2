# Creative Design Platform - Setup Guide

## 📋 Prerequisites

- **Node.js 18+**
- **Python 3.10+**
- **FFmpeg** (for video processing)

## 🚀 Quick Start

### 1. Install Dependencies (First Time Only)

```bash
# Node.js
npm run install:all

# Python
cd api-server/video-downloader
pip install -r requirements.txt
cd ../..
```

### 2. Start Everything

```bash
start-all.bat
```

### 3. Access

- **Main App**: http://localhost:5173
- **Video Downloader**: http://localhost:5173/video-downloader
- **Admin Panel**: http://localhost:5173/admin

## 🏗️ Architecture

```
creative-design-main/
├── api-server/                 # BACKEND
│   ├── upload-server.js        # Express API (Port 3001)
│   ├── public/                 # Uploaded files
│   └── video-downloader/       # Python FastAPI (Port 8000)
│
├── client/                     # FRONTEND
│   ├── src/                    # UI code
│   └── vite.config.ts          # Proxy config
│
├── scripts/                    # Utility scripts
├── telegram-video-bot/         # Telegram bot (optional)
├── start-all.bat               # Start everything
├── package.json
└── README.md
```

## 🔧 API Endpoints

### Upload Server (3001)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload video + thumbnail |
| GET | `/api/videos` | Get all videos |
| DELETE | `/api/videos/:id` | Delete video |
| PUT | `/api/videos/:id` | Rename video |

### Video Downloader (8000)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/extract` | Extract video info |
| POST | `/api/download` | Download video |
| GET | `/api/health` | Health check |

## 🐛 Troubleshooting

**Video Downloader not working:**
```bash
cd api-server/video-downloader
pip install -r requirements.txt
python api_enhanced.py
```

**Upload Server issues:**
```bash
cd api-server
npm install
npm start
```

**Client not loading:**
```bash
cd client
rm -rf node_modules .vite
npm install
npm run dev
```
