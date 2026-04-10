# Creative Design Platform - Complete Setup Guide

## 📋 Overview

This platform consists of three main components:
1. **Frontend Client** (React + Vite) - Port 5173
2. **API Server** (Express + Multer) - Port 3001
3. **Telegram Video Bot** (Python + aiogram) - Bot API Server on port 8081

## 🚀 Quick Start

### Option 1: Start All Services (Recommended)

```bash
# Start all services at once
start-all-fixed.bat

# Stop all services
stop-all-fixed.bat
```

### Option 2: Start Services Individually

```bash
# Terminal 1 - API Server
cd api-server
npm start

# Terminal 2 - Client
cd client
npm run dev

# Terminal 3 - Telegram Bot
cd telegram-video-bot
python bot.py
```

## 📱 Access Points

- **Main Website**: http://localhost:5173
- **Admin Panel**: http://localhost:5173/admin
- **API Server**: http://localhost:3001
- **API Health Check**: http://localhost:3001/api/health

## 🔧 Admin Panel Features

### Video Management
- ✅ Upload videos with custom thumbnails
- ✅ View all uploaded videos
- ✅ Delete videos
- ✅ Auto-generate thumbnails from video

### Music Management
- ✅ Upload music files
- ✅ View all uploaded music
- ✅ Delete music files
- ✅ Track artist and title

### Statistics
- ✅ Total videos count
- ✅ Total music count
- ✅ Disk usage tracking
- ✅ Real-time server status

## 🤖 Telegram Bot Setup

### Prerequisites
1. Python 3.8+ installed
2. FFmpeg installed and in PATH
3. Telegram Bot Token (from @BotFather)

### Installation

```bash
cd telegram-video-bot

# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Configuration

The `.env` file is already configured with:
- Bot Token: `8628132129:AAGuU0M2KaZJATpyINnh4xpGoQyXU6uuFso`
- API Server: `http://localhost:8081`
- Admin ID: (add your Telegram ID for admin access)

### Running the Bot

```bash
# Start Bot API Server first
start "" telegram-bot-api.exe --api-id=25312826 --api-hash=b4432c8746904c09d8668fa1cdc4149f --local

# Then start the bot
python bot.py
```

## 📁 Project Structure

```
creative-design-main/
├── client/                      # React Frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── admin.page.tsx       ✅ FIXED
│   │   │   ├── main.page.tsx
│   │   │   ├── templates.page.tsx
│   │   │   ├── music.page.tsx
│   │   │   ├── custom.page.tsx
│   │   │   └── downloader.page.tsx
│   │   ├── components/
│   │   ├── config.ts
│   │   ├── routes.tsx
│   │   └── index.tsx
│   └── package.json
│
├── api-server/                  # Express Backend
│   ├── upload-server.js         ✅ Main API Server
│   ├── public/
│   │   ├── data/
│   │   │   ├── videos.json      # Video metadata
│   │   │   └── music.json       # Music metadata
│   │   ├── videos/              # Uploaded videos
│   │   ├── image/               # Uploaded images
│   │   └── music/               # Uploaded music
│   └── package.json
│
├── telegram-video-bot/          # Telegram Bot
│   ├── bot.py                   ✅ Main bot file
│   ├── config.py
│   ├── downloader.py
│   ├── .env                     ✅ FIXED
│   └── requirements.txt
│
├── start-all-fixed.bat          ✅ Start script
├── stop-all-fixed.bat           ✅ Stop script
└── package.json
```

## 🔐 Admin Panel Login

The admin panel is accessible at: http://localhost:5173/admin

**No login required for local development** - the panel is open for easy management.

## 🎨 Features

### Frontend
- ✅ Modern React 19 with TypeScript
- ✅ React Router v7 for navigation
- ✅ Vite for fast development
- ✅ Responsive design
- ✅ Dark/Light themes
- ✅ Lazy loading for performance

### Backend
- ✅ Express.js API server
- ✅ Multer for file uploads
- ✅ Auto-generated thumbnails
- ✅ RESTful API endpoints
- ✅ CORS enabled
- ✅ Health check endpoint

### Telegram Bot
- ✅ Video downloading from 1000+ sites
- ✅ Audio extraction
- ✅ File caching system
- ✅ 2GB upload support (with local API server)
- ✅ Multi-language support (Uzbek, Russian, English)
- ✅ Admin dashboard
- ✅ Rate limiting

## 🐛 Fixed Issues

### Admin Panel Fixes:
1. ✅ **File corruption** - Recreated complete admin.page.tsx
2. ✅ **Missing JSX return** - Added proper JSX rendering
3. ✅ **Server connection** - Fixed API endpoints
4. ✅ **Upload functionality** - Connected to upload-server.js
5. ✅ **Delete functionality** - Added delete handlers
6. ✅ **Stats display** - Connected to /api/stats
7. ✅ **Video/Music lists** - Proper rendering with metadata
8. ✅ **Progress bars** - Real-time upload progress
9. ✅ **Image preview** - Thumbnail preview on upload
10. ✅ **Tab switching** - Video/Music tabs working

### Telegram Bot Fixes:
1. ✅ **Missing .env file** - Created with proper configuration
2. ✅ **Bot API Server** - Configured for 2GB uploads
3. ✅ **Database setup** - SQLite caching configured
4. ✅ **Error handling** - Improved error messages

## 📊 API Endpoints

### Upload Server (http://localhost:3001)

```
GET  /api/health          - Health check
GET  /api/stats           - Server statistics
GET  /api/videos          - Get all videos
POST /api/upload          - Upload video (requires password)
DELETE /api/videos/:id    - Delete video

GET  /api/music           - Get all music
POST /api/upload-music    - Upload music (requires password)
DELETE /api/music/:id     - Delete music
```

**Upload Password**: `creative2026` (configured in upload-server.js)

### Video Downloader API (http://localhost:8000)

```
GET  /api/health          - Health check
POST /api/extract         - Extract video info
POST /api/download        - Download video
```

## 🎯 Usage Examples

### Upload a Video via Admin Panel

1. Go to http://localhost:5173/admin
2. Click "Video" tab
3. Enter video name
4. Click to select video file
5. Click to select thumbnail
6. Click "Video Yuklash"
7. Wait for upload to complete
8. Video appears in list below

### Upload Music via Admin Panel

1. Go to http://localhost:5173/admin
2. Click "Music" tab
3. Enter music name and artist
4. Click to select music file
5. Click "Musiqa Yuklash"
6. Music appears in list

### Use Telegram Bot

1. Start the bot: `python bot.py`
2. Open bot in Telegram
3. Send a video URL
4. Bot downloads and sends video
5. Click "Download Audio" for MP3

## ⚙️ Configuration

### Change Admin Password

Edit `api-server/upload-server.js`:
```javascript
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'creative2026';
```

### Change Ports

**Client**: Edit `client/vite.config.ts`
**API Server**: Set `PORT` environment variable or edit `api-server/upload-server.js`
**Bot API Server**: Edit `bot-api.env`

### Add Admin to Telegram Bot

Get your Telegram ID from @userinfobot, then edit `.env`:
```
ADMIN_ID=your_telegram_user_id
```

## 🧪 Testing

```bash
# Check API Server
curl http://localhost:3001/api/health

# Check Client
curl http://localhost:5173

# Check Video Downloader
curl http://localhost:8000/api/health
```

## 📝 Notes

- All uploaded files are stored in `api-server/public/`
- Video metadata is in `api-server/public/data/videos.json`
- Music metadata is in `api-server/public/data/music.json`
- Thumbnails are auto-generated from videos if not provided
- FFmpeg is required for video/audio processing
- Bot requires internet connection for downloading videos

## 🆘 Troubleshooting

### Admin Panel not loading
- Check if API server is running: http://localhost:3001/api/health
- Restart with: `cd api-server && npm start`

### Upload failing
- Ensure API server is running
- Check browser console for errors
- Verify password is correct: `creative2026`

### Bot not responding
- Check if .env file exists
- Verify bot token is correct
- Check bot.log for errors
- Ensure FFmpeg is installed

### Videos not showing
- Check network tab in browser dev tools
- Verify videos.json has data
- Clear browser cache

## 📞 Support

For issues or questions:
- Check the log files in each service
- Review this guide
- Check configuration files
- Verify all services are running

---

**Created by**: Creative_designuz
**Version**: 2.0.0
**Last Updated**: April 10, 2026
