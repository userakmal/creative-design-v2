# CREATIVE DESIGN PLATFORM - SETUP GUIDE

## 📋 Platform Overview

This platform has 3 main components:

### 1. Frontend (React + Vite)
- **Location:** `client/`
- **Port:** 5173
- **Technology:** React 19, TypeScript, Vite
- **Routes:**
  - `/` - Main page
  - `/templates` - All designs
  - `/popular` - Popular designs
  - `/music` - Music library
  - `/custom` - Custom upload
  - `/video-downloader` - Video downloader
  - `/admin` - Admin panel

### 2. Backend API (Express + Multer)
- **Location:** `api-server/`
- **Port:** 3001
- **Technology:** Node.js, Express, Multer
- **Features:**
  - Video upload
  - Music upload
  - File management
  - Statistics

### 3. Telegram Bot (Python + aiogram)
- **Location:** `telegram-video-bot/`
- **Technology:** Python, aiogram, yt-dlp
- **Features:**
  - Video downloading
  - Audio extraction
  - 2GB upload support

---

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
# Install frontend dependencies
cd client
npm install

# Install backend dependencies
cd ../api-server
npm install

# Install Telegram bot dependencies
cd ../telegram-video-bot
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### Step 2: Start Services

#### Option A: Start All (Recommended)
```bash
# From project root
start-all-fixed.bat
```

#### Option B: Start Individually
```bash
# Terminal 1 - API Server
cd api-server
npm start

# Terminal 2 - Frontend
cd client
npm run dev

# Terminal 3 - Telegram Bot
cd telegram-video-bot
venv\Scripts\activate
python bot.py
```

### Step 3: Access Applications

- **Main Site:** http://localhost:5173
- **Admin Panel:** http://localhost:5173/admin
- **API Health:** http://localhost:3001/api/health
- **API Stats:** http://localhost:3001/api/stats

---

## 📁 Project Structure

```
creative-design-main/
│
├── setup-info/                    ← You are here!
│   ├── SETUP-GUIDE.md             ← This file
│   ├── DIAGNOSTICS.md             ← Diagnostic guide
│   ├── TROUBLESHOOTING.md         ← Common issues
│   └── API-DOCUMENTATION.md       ← API reference
│
├── client/                        ← Frontend
│   ├── src/
│   │   ├── pages/                 ← All page components
│   │   ├── components/            ← Reusable components
│   │   ├── config.ts              ← App configuration
│   │   ├── routes.tsx             ← Route definitions
│   │   └── index.tsx              ← Entry point
│   └── package.json
│
├── api-server/                    ← Backend API
│   ├── upload-server.js           ← Main server
│   ├── public/                    ← Uploaded files
│   │   ├── data/
│   │   │   ├── videos.json        ← Video metadata
│   │   │   └── music.json         ← Music metadata
│   │   ├── videos/                ← Video files
│   │   ├── image/                 ← Image files
│   │   └── music/                 ← Music files
│   └── package.json
│
├── telegram-video-bot/            ← Telegram Bot
│   ├── bot.py                     ← Main bot
│   ├── config.py                  ← Bot config
│   ├── .env                       ← Environment variables
│   └── requirements.txt
│
├── start-all-fixed.bat            ← Start script
├── stop-all-fixed.bat             ← Stop script
└── check-status.bat               ← Diagnostics
```

---

## 🔐 Configuration

### Admin Panel
- **URL:** http://localhost:5173/admin
- **No login required** for local development
- **Upload Password:** `creative2026`

### Telegram Bot
- **Bot Token:** 8628132129:AAGuU0M2KaZJATpyINnh4xpGoQyXU6uuFso
- **Admin ID:** Add your Telegram ID in `.env`

### API Server
- **Port:** 3001
- **CORS:** Enabled for all origins
- **Max File Size:** 500MB

---

## 📊 Data Flow

### Video Upload Flow
1. User uploads video via Admin Panel
2. Frontend sends FormData to API Server
3. API Server saves files to `public/videos/` and `public/image/`
4. API Server updates `public/data/videos.json`
5. Frontend refreshes video list
6. Video appears on main site

### Music Upload Flow
1. User uploads music via Admin Panel
2. Frontend sends FormData to API Server
3. API Server saves file to `public/music/`
4. API Server updates `public/data/music.json`
5. Frontend refreshes music list
6. Music appears on music page

---

## 🔍 How to Check if Everything Works

### 1. Check API Server
```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "🚀 Upload server ishlamoqda",
  "stats": {
    "videos": 0,
    "music": 0
  }
}
```

### 2. Check Videos
```bash
curl http://localhost:3001/api/videos
```

Expected: `[]` (empty array) or array of videos

### 3. Check Music
```bash
curl http://localhost:3001/api/music
```

Expected: `[]` (empty array) or array of music

### 4. Check Frontend
Open browser: http://localhost:5173

### 5. Check Admin Panel
Open browser: http://localhost:5173/admin

---

## 📝 Notes

- All uploaded files stored in `api-server/public/`
- Metadata stored in `api-server/public/data/*.json`
- Thumbnails auto-generated from videos
- FFmpeg required for video processing
- Bot requires internet connection

---

**Created:** April 10, 2026
**Version:** 2.0.0
