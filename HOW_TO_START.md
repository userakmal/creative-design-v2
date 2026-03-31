# 🚀 CREATIVE DESIGN - QUICK START GUIDE

## ⚡ ONE-CLICK START (RECOMMENDED)

**Double-click this file:**
```
START_EVERYTHING.bat
```

This will automatically start:
- ✅ Docker Bot API Server (Port 8081)
- ✅ FastAPI Video Backend (Port 8000)
- ✅ React Web App (Port 5173)
- ✅ Telegram Video Bot

**That's it!** Your entire ecosystem will be running.

---

## 🌐 ACCESS YOUR SERVICES

Once started, you can access:

| Service | URL | Purpose |
|---------|-----|---------|
| **Web App** | http://localhost:5173 | Main website |
| **Video Downloader** | http://localhost:5173/video-downloader | FetchV-style downloader |
| **API Docs** | http://localhost:8000/api/docs | FastAPI documentation |
| **Telegram Bot** | @CD_Video_Downloaderbot | Telegram video bot |

---

## 📋 PREREQUISITES

Make sure you have installed:

1. **Node.js** (v18 or higher) - https://nodejs.org/
2. **Python 3.12** - https://python.org/
3. **Docker Desktop** - https://docker.com/products/docker-desktop

---

## 🔧 MANUAL START (IF NEEDED)

### 1. Start Docker Bot API
```bash
cd telegram-video-bot
docker compose up -d
```

### 2. Start FastAPI Backend
```bash
cd telegram-video-bot
python api_enhanced.py
```

### 3. Start React Web App
```bash
npm run dev
```

### 4. Start Telegram Bot
```bash
cd telegram-video-bot
python bot.py
```

---

## 🎯 HOW TO USE VIDEO DOWNLOADER

1. **Open Web App**: http://localhost:5173/video-downloader
2. **Paste Video URL**: YouTube, Instagram, TikTok, etc.
3. **Click "Tahlil Qilish"**: Analyze the video
4. **Select Format**: Choose quality (1080p, 720p, etc.)
5. **Click "Yuklab olish"**: Download the video

---

## 🛑 HOW TO STOP

**Option 1: Close All Windows**
- Simply close all the command prompt windows that opened

**Option 2: Kill Processes**
```bash
taskkill /F /IM python.exe
taskkill /F /IM node.exe
docker compose down
```

---

## 📖 DOCUMENTATION

- **FetchV Integration**: See `FETCHV_INTEGRATION.md`
- **API Reference**: http://localhost:8000/api/docs
- **Telegram Bot Setup**: See `telegram-video-bot/README.md`

---

## 🆘 TROUBLESHOOTING

### Issue: "Port already in use"
**Solution:** Close other apps using that port or change port in config

### Issue: "Docker not running"
**Solution:** Start Docker Desktop first

### Issue: "npm not found"
**Solution:** Install Node.js from https://nodejs.org/

### Issue: "Module not found"
**Solution:** Run `npm install` in the project root

### Issue: Video downloader not working
**Solution:** 
1. Make sure FastAPI backend is running (Port 8000)
2. Check API health: http://localhost:8000/api/health
3. Ensure `cookies.txt` exists in `telegram-video-bot/` folder

---

## 📞 SUPPORT

For issues or questions:
- Check logs in command windows
- Visit API docs: http://localhost:8000/api/docs
- Contact: Creative Design UZ Team

---

**Made with ❤️ by Creative Design UZ**
