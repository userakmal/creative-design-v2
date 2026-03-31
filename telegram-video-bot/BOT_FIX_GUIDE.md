# 🤖 TELEGRAM BOT - ISHGA TUSHIRISH

## ❌ MUAMMO: Bot javob bermayapti

---

## ✅ YECHIM: To'liq qayta ishga tushirish

### VARIANT 1: START_EVERYTHING.bat (Tavsiya)

```bash
# Hamma narsani ishga tushiradi
START_EVERYTHING.bat
```

Bu:
- ✅ Upload Server (3001)
- ✅ Website (5173)
- ✅ Bot API (8000)
- ✅ Telegram Bot (avtomatik)

---

### VARIANT 2: Alohida Bot Ishga Tushirish

```bash
cd telegram-video-bot
START_BOT_FULL.bat
```

Bu:
- ✅ Virtual environment tekshiradi
- ✅ Dependencies o'rnatadi
- ✅ Docker container ishga tushiradi
- ✅ Bot API Server (8000)
- ✅ Telegram Bot

---

### VARIANT 3: Debug Mode

```bash
cd telegram-video-bot
START_BOT_DEBUG.bat
```

Bu:
- ✅ Token tekshiradi
- ✅ Dependencies tekshiradi
- ✅ Bot API Server tekshiradi
- ✅ Debug mode da ishga tushiradi

---

## 🔍 TEKSHIRISH

### 1. Bot Token

```bash
cd telegram-video-bot
python -c "from dotenv import load_dotenv; load_dotenv(); import os; print('Token:', os.getenv('TELEGRAM_BOT_TOKEN')[:20] + '...')"
```

Natija: `8628132129:AAGuU0M2K...`

---

### 2. Bot API Server

```bash
curl http://localhost:8081
```

Natija: `{"ok":false,"error_code":404,"description":"Not Found"}`
✅ Bu normal! Server ishlayapti.

---

### 3. Bot Jarayoni

```bash
tasklist | findstr "python"
```

Natija:
```
python.exe    12345  ...  bot.py
python.exe    12346  ...  api_enhanced.py
```

---

### 4. Bot Loglari

```bash
type telegram-video-bot\bot.log | findstr "INFO ERROR"
```

Natija:
```
2026-03-31 17:30:00 | INFO | Bot ishga tushdi
2026-03-31 17:30:01 | INFO | Polling boshlandi
```

---

## 📱 TELEGRAM DA TEKSHIRISH

### 1. Botni Qidiring

```
@CD_Video_Downloaderbot
```

### 2. /start Bosing

Bot javob berishi kerak:
```
Assalomu alaykum! Men Video Downloader botman.
Video yuboring yoki link tashlang...
```

### 3. Video Yuboring

Instagram/YouTube linkini yuboring:
```
https://www.instagram.com/reel/ABC123/
```

Bot javob:
```
📥 Yuklanmoqda...
```

---

## 🛠️ MUAMMOLARNI HAL QILISH

### 1. "Bot topilmadi"

**Sabab:** Token noto'g'ri

**Yechim:**
```bash
# .env faylni tekshiring
type telegram-video-bot\.env

# Token to'g'riligini tekshiring
# Telegram dan @BotFather ga /mybots bosing
```

---

### 2. "Bot javob bermayapti"

**Sabab:** Bot ishmayapti

**Yechim:**
```bash
# Botni qayta ishga tushiring
cd telegram-video-bot
START_BOT_FULL.bat

# Yoki debug mode da
START_BOT_DEBUG.bat
```

---

### 3. "Polling xatosi"

**Sabab:** Internet yoki Telegram bloklangan

**Yechim:**
```bash
# Internetni tekshiring
ping google.com

# Proxy kerak bo'lsa
# .env faylga qo'shing:
# HTTPS_PROXY=http://proxy:port
```

---

### 4. "Docker container ishlamayapti"

**Sabab:** Docker o'chgan

**Yechim:**
```bash
# Docker ni ishga tushiring
docker compose up -d

# Yoki Python fallback ishlating
# START_BOT_FULL.bat avtomatik qiladi
```

---

### 5. "aiogram topilmadi"

**Sabab:** Dependencies o'rnatilmagan

**Yechim:**
```bash
cd telegram-video-bot
call venv\Scripts\activate
pip install -r requirements.txt
```

---

## 🎯 TO'LIQ QAYTA ISHGA TUSHIRISH

```bash
# 1. Barcha Python jarayonlarini to'xtatish
taskkill /F /IM python.exe

# 2. Docker container ni to'xtatish
cd telegram-video-bot
docker compose down

# 3. Hamma narsani qayta ishga tushirish
cd ..
START_EVERYTHING.bat
```

---

## ✅ TEKSHIRISH CHECKLIST

```
□ .env fayl mavjud
□ Token to'g'ri
□ Docker container ishlayapti
□ Bot API Server (8000) ishlayapti
□ Bot jarayoni bor
□ Bot loglarida xato yo'q
□ Telegram da bot javob beradi
```

**Barchasi ✓ bo'lsa - bot ishlayapti! 🎉**

---

## 📞 YORDAM

### Loglarni Ko'rish

```bash
# Bot loglari
type telegram-video-bot\bot.log

# API loglari
type telegram-video-bot\api.log
```

### Debug Mode

```bash
cd telegram-video-bot
START_BOT_DEBUG.bat
```

Bu barcha xabarlarni ko'rsatadi va xatolarni topadi.

---

## 🎁 BONUS

### Tezkor Buyruqlar:

```bash
# Botni to'xtatish
taskkill /F /IM python.exe

# Botni qayta ishga tushirish
cd telegram-video-bot && START_BOT_FULL.bat

# Bot statusini tekshirish
tasklist | findstr "bot.py"

# Loglarni tozalash
del telegram-video-bot\*.log
```

---

**Yaratdi:** Creative_designuz  
**Sana:** 2026-03-31  
**Versiya:** 1.0 - Bot Fix  
**Status:** ✅ READY
