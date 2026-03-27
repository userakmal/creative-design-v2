# 🚀 Local Bot API Server Setup Guide

## Overview

The Local Bot API Server allows your bot to upload files up to **2GB** instead of the standard 50MB limit.

---

## ⚡ Quick Setup

### Step 1: Get API Credentials

1. Go to https://my.telegram.org/apps
2. Log in with your phone number
3. Click "Create Application"
4. Copy your **API ID** and **API Hash**

### Step 2: Configure Credentials

Edit `bot-api.env` file and add your credentials:

```env
TELEGRAM_BOT_TOKEN=8628132129:AAGuU0M2KaZJATpyINnh4xpGoQyXU6uuFso
TELEGRAM_API_ID=YOUR_API_ID_HERE
TELEGRAM_API_HASH=YOUR_API_HASH_HERE
```

### Step 3: Start Docker Desktop

1. Open Docker Desktop from Start Menu
2. Wait for Docker to start (whale icon turns green)

### Step 4: Start Bot API Server

**Option A: Use the Manager (Easy)**
```bash
# Double-click bot-api-manager.bat
# Or run:
bot-api-manager.bat
# Select option 1
```

**Option B: Manual Commands**
```bash
cd telegram-video-bot
docker-compose up -d
```

### Step 5: Update Bot Configuration

Edit `.env` file:

```env
# Add the API server URL
TELEGRAM_API_SERVER=http://localhost:8081

# Increase file size limit to 2GB
MAX_FILE_SIZE=2147483648
```

### Step 6: Restart Your Bot

```bash
# Stop current bot (if running)
taskkill /F /IM python.exe

# Start bot again
"C:\Users\Acer\AppData\Local\Programs\Python\Python312\python.exe" bot.py
```

---

## 📋 Commands

### Start Server
```bash
docker-compose up -d
```

### Stop Server
```bash
docker-compose down
```

### Check Logs
```bash
docker-compose logs -f
```

### Restart Server
```bash
docker-compose restart
```

---

## ✅ Verify It Works

1. Send `/stats` to your bot
2. Check bot logs for: `Using Local Bot API Server`
3. Try downloading a large video (>50MB)

---

## 🛠 Troubleshooting

### Docker not starting
- Enable virtualization in BIOS
- Check Hyper-V is enabled

### Connection refused
- Wait 10 seconds after starting
- Check `docker-compose ps` shows "Up"

### Bot still has 50MB limit
- Verify `TELEGRAM_API_SERVER` is set in `.env`
- Restart the bot after changing config

---

## 📊 Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Your Bot  │────▶│  Bot API Server  │────▶│   Telegram  │
│  (bot.py)   │     │  (localhost:8081)│     │    Servers  │
└─────────────┘     └──────────────────┘     └─────────────┘
                           │
                      ┌────▼────┐
                      │  Files  │
                      │ up to   │
                      │  2GB    │
                      └─────────┘
```

---

## 🔐 Security Notes

- Keep your API ID and Hash private
- Bot API Server only accepts connections from localhost by default
- Files are stored in Docker volume (`telegram-bot-api-data`)

---

## 📝 File Locations

| File | Purpose |
|------|---------|
| `bot-api.env` | API credentials |
| `docker-compose.yml` | Docker configuration |
| `bot-api-manager.bat` | Management script |
| `.env` | Bot configuration |

---

**Ready!** Your bot can now handle files up to 2GB! 🎉
