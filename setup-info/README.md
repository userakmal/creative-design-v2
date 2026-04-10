# 📚 SETUP INFO - Creative Design Platform

Welcome to the setup and documentation folder! This folder contains everything you need to set up, diagnose, and troubleshoot the Creative Design Platform.

---

## 📖 Documentation Files

### 1. [SETUP-GUIDE.md](./SETUP-GUIDE.md)
**Start here if you're new!**

Contains:
- ✅ Quick start instructions
- ✅ Installation steps
- ✅ How to start/stop services
- ✅ Project structure overview
- ✅ Access points and URLs
- ✅ Configuration details

**When to use:** First time setup or reinstalling

---

### 2. [DIAGNOSTICS.md](./DIAGNOSTICS.md)
**Find out what's wrong**

Contains:
- ✅ Automated diagnostic script
- ✅ Manual diagnostic steps
- ✅ How to check each component
- ✅ Common issues & solutions
- ✅ Performance checks
- ✅ Complete reset instructions

**When to use:** Something isn't working

---

### 3. [API-DOCUMENTATION.md](./API-DOCUMENTATION.md)
**API reference for developers**

Contains:
- ✅ All API endpoints
- ✅ Request/response formats
- ✅ Code examples (JavaScript & Python)
- ✅ Error handling
- ✅ Configuration options
- ✅ CORS settings

**When to use:** Building integrations or debugging API calls

---

### 4. [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
**Step-by-step problem solving**

Contains:
- ✅ 12+ common problems
- ✅ Detailed solutions for each
- ✅ Command-line diagnostics
- ✅ Browser debugging
- ✅ Network troubleshooting
- ✅ Advanced debugging techniques

**When to use:** Specific error needs fixing

---

## 🚀 Quick Links

### Start Services
```bash
# Start all services
..\start-all-fixed.bat

# Stop all services
..\stop-all-fixed.bat

# Run diagnostics
..\check-status.bat
```

### Access Points
- **Main Site:** http://localhost:5173
- **Admin Panel:** http://localhost:5173/admin
- **API Health:** http://localhost:3001/api/health

### Important Files
- **API Server:** `../api-server/upload-server.js`
- **Admin Panel:** `../client/src/pages/admin.page.tsx`
- **Telegram Bot:** `../telegram-video-bot/bot.py`
- **Videos DB:** `../api-server/public/data/videos.json`
- **Music DB:** `../api-server/public/data/music.json`

---

## 🎯 Common Tasks

### I want to upload a video
1. Start all services: `start-all-fixed.bat`
2. Open admin panel: http://localhost:5173/admin
3. Click "Video" tab
4. Enter video name
5. Select video file
6. Select thumbnail
7. Click "Video Yuklash"

### I want to check if API is working
```bash
curl http://localhost:3001/api/health
```

### I want to see uploaded videos
```bash
curl http://localhost:3001/api/videos
```

### Something is broken!
1. Read [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Run diagnostics: `..\check-status.bat`
3. Check browser console (F12)
4. Check API server console

### I want to reset everything
```bash
# Stop services
..\stop-all-fixed.bat

# Reset data
echo [] > ..\api-server\public\data\videos.json
echo [] > ..\api-server\public\data\music.json

# Restart
..\start-all-fixed.bat
```

---

## 📊 System Requirements

### Required
- ✅ Node.js 18+ (for frontend & API)
- ✅ npm 9+ (package manager)
- ✅ Python 3.8+ (for Telegram bot)
- ✅ Modern web browser (Chrome, Firefox, Edge)

### Optional
- ⚙️ FFmpeg (for video processing)
- 🌐 Internet connection (for video downloading)

---

## 🗂️ Where to Find Things

### Frontend Code
```
client/src/
├── pages/           ← All page components
├── components/      ← Reusable UI components
├── config.ts        ← App configuration
└── routes.tsx       ← Route definitions
```

### Backend Code
```
api-server/
├── upload-server.js  ← Main API server
└── public/           ← Uploaded files
    ├── data/         ← JSON databases
    ├── videos/       ← Video files
    ├── image/        ← Image files
    └── music/        ← Music files
```

### Telegram Bot
```
telegram-video-bot/
├── bot.py           ← Main bot file
├── config.py        ← Configuration
├── .env             ← Environment variables
└── requirements.txt ← Python dependencies
```

---

## 🔐 Default Credentials

### Admin Panel
- **URL:** http://localhost:5173/admin
- **Login:** No login required (local dev)
- **Upload Password:** `creative2026`

### Telegram Bot
- **Token:** Configured in `.env` file
- **Admin ID:** Add your Telegram ID in `.env`

---

## 📝 Notes

- All data is stored locally in JSON files
- Uploaded files are in `api-server/public/`
- Logs appear in console windows
- Bot logs go to `telegram-video-bot/bot.log`

---

## 🆘 Need More Help?

1. Check the troubleshooting guide first
2. Run the diagnostic script
3. Check console logs
4. Review API documentation
5. Search for similar issues online

---

## 📞 Support Resources

- **Node.js:** https://nodejs.org/
- **Python:** https://python.org/
- **FFmpeg:** https://ffmpeg.org/
- **React:** https://react.dev/
- **Express:** https://expressjs.com/
- **aiogram:** https://docs.aiogram.dev/

---

**Folder Created:** April 10, 2026
**Version:** 2.0.0
**Status:** ✅ Complete Documentation
