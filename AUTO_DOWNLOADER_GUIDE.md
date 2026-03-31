# 📥 INSTAGRAM/YOUTUBE AUTO DOWNLOADER

## 🎯 NIMA BU?

Instagram Reels va YouTube videolarini **link orqali** avtomatik yuklab, **templatesga qo'shish** tizimi!

---

## ⚡ TEZKOR START

### 1. Serverni Ishga Tushirish

```bash
START_EVERYTHING.bat
```

### 2. Admin Panelga Kirish

```
http://localhost:5173/admin
Login: admin
Password: creative2026
```

### 3. Link Tashlash

1. **Instagram/YouTube** dan linkni ko'chirib oling
2. Admin panelda **"Instagram/YouTube dan Avto Yuklash"** bo'limiga tashlang
3. **"Avto Yuklash"** tugmasini bosing
4. 10-30 soniya kuting
5. Tayyor! Video templatesga qo'shildi ✅

---

## 📱 QANDAY ISHLAYDI?

```
Instagram/YouTube
      ↓
Linkni ko'chirish
      ↓
Admin panelga tashlash
      ↓
Avtomatik yuklash
      ↓
Templatesga qo'shish
      ↓
✅ Tayyor!
```

---

## 🎯 QO'LLAB-QUVVATLANADIGAN SAYTLAR

| Platform | Turi | Misol |
|----------|------|-------|
| **Instagram Reels** | ✅ Ha | `instagram.com/reel/ABC123` |
| **Instagram Video** | ✅ Ha | `instagram.com/p/ABC123` |
| **YouTube** | ✅ Ha | `youtube.com/watch?v=ABC123` |
| **YouTube Shorts** | ✅ Ha | `youtube.com/shorts/ABC123` |
| **TikTok** | ⚠️ Test | `tiktok.com/@user/video/123` |
| **Facebook** | ⚠️ Test | `facebook.com/watch/?v=123` |

---

## 🔧 TEXNIK TAFSILOTLAR

### Fayl Tuzilishi:

```
creative-design-main/
├── upload-server.js              # Node.js server (API)
├── pages/admin.page.tsx          # Admin panel UI
├── telegram-video-bot/
│   └── auto_template_downloader.py  # Python downloader
└── public/
    ├── videos/                   # Yuklangan videolar
    ├── image/                    # Yuklangan rasmlar
    └── data/
        └── videos.json           # Video ma'lumotlar
```

### API Endpoints:

```
POST /api/auto-download
Body: { url, password }
Response: { success, message }
```

### Texnologiyalar:

- **Backend:** Node.js + Express
- **Frontend:** React + TypeScript
- **Downloader:** Python + yt-dlp
- **Merge:** FFmpeg

---

## 📋 ISHLATISH QOIDALARI

### 1. Link To'g'riligini Tekshirish

```
✅ Instagram: https://www.instagram.com/reel/ABC123/
✅ YouTube: https://www.youtube.com/watch?v=ABC123
✅ Shorts: https://youtube.com/shorts/ABC123

❌ instagram.com (to'liq link emas)
❌ youtube.com (to'liq link emas)
```

### 2. Video Hajmi

- **Max limit:** 200MB
- **Optimal:** 50MB dan kam
- **Katta video:** Uzoq vaqt oladi

### 3. Internet Tezligi

- **Yaxshi:** 10+ Mbps → 10-30 soniya
- **O'rta:** 5 Mbps → 30-60 soniya
- **Sekin:** 1 Mbps → 2-5 daqiqa

---

## 🛠️ MUAMMOLARNI HAL QILISH

### 1. "Video yuklashda xatolik"

**Sabab:**
- Internet yo'q
- Link noto'g'ri
- Sayt bloklangan

**Yechim:**
```
1. Internetni tekshiring
2. Linkni to'g'riligini tekshiring
3. Boshqa link bilan urinib ko'ring
```

### 2. "Python script topilmadi"

**Sabab:**
- `auto_template_downloader.py` yo'q

**Yechim:**
```bash
# Faylni yarating
telegram-video-bot/auto_template_downloader.py
```

### 3. "FFmpeg topilmadi"

**Sabab:**
- FFmpeg o'rnatilmagan

**Yechim:**
```bash
# Windows
winget install Gyan.FFmpeg

# Yoki
choco install ffmpeg
```

### 4. "YouTube video yuklanmayapti"

**Sabab:**
- Cookies kerak
- Geo-block

**Yechim:**
```
1. cookies.txt faylni yarating
2. Browserdan cookies export qiling
3. telegram-video-bot/cookies.txt ga tashlang
```

---

## 🎯 MISOLLAR

### Instagram Reels:

```
Link: https://www.instagram.com/reel/C1234567890/
Natija: 
  ✓ Video yuklandi
  ✓ Thumbnail yuklandi
  ✓ Templatesga qo'shildi (ID: 53)
```

### YouTube:

```
Link: https://www.youtube.com/watch?v=dQw4w9WgXcQ
Natija:
  ✓ Video yuklandi (720p)
  ✓ Thumbnail yuklandi
  ✓ Templatesga qo'shildi (ID: 54)
```

### YouTube Shorts:

```
Link: https://youtube.com/shorts/ABC123xyz
Natija:
  ✓ Video yuklandi
  ✓ Thumbnail yuklandi
  ✓ Templatesga qo'shildi (ID: 55)
```

---

## 📊 NATIJANI TEKSHIRISH

### 1. Templates Sahifasi

```
http://localhost:5173/templates
```

Eng oxirida yangi video paydo bo'ladi.

### 2. Admin Panel - Yuklangan Videolar

```
http://localhost:5173/admin
↓
"Yuklangan Videolar" bo'limi
```

Bu yerda video ro'yxatini ko'rasiz.

### 3. Fayl Papkalari

```
public/videos/        → Video fayl
public/image/         → Thumbnail
public/data/videos.json → Ma'lumotlar
```

---

## 🚀 KEYINGI QADAMLAR

### 1. Batch Download (Ko'p Linklar)

JSON fayl yarating: `links.json`

```json
{
  "urls": [
    "https://instagram.com/reel/ABC123",
    "https://youtube.com/watch?v=XYZ789",
    "https://youtube.com/shorts/QWE456"
  ]
}
```

Keyin:

```bash
cd telegram-video-bot
python auto_template_downloader.py links.json
```

### 2. Telegram Bot Integration

Telegram botga link tashlasangiz, avtomatik templatesga qo'shadi.

### 3. API Integration

```javascript
fetch('http://localhost:3001/api/auto-download', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://instagram.com/reel/ABC123',
    password: 'creative2026'
  })
})
```

---

## 🔐 XAVFSIZLIK

### Password Himoya

```javascript
Password: creative2026
```

Upload server password tekshiradi.

### Rate Limiting

Har bir download orasida 2 soniya kutish.

### File Size Limit

Max: 200MB (katta fayllar serverni sekinlashtiradi).

---

## 📞 YORDAM

### Loglarni Tekshirish

```bash
# Upload server log
upload-server.js console

# Python script log
telegram-video-bot/auto_template_downloader.py output
```

### Debug Mode

```python
# auto_template_downloader.py da
print(f"Debug: {variable}")
```

---

## ✅ TEKSHIRISH CHECKLIST

```
□ START_EVERYTHING.bat ishga tushdi
□ Upload server port 3001 da ishlayapti
□ Admin panel ochiladi
□ "Avto Yuklash" formasi ko'rinadi
□ Instagram link ishladi
□ YouTube link ishladi
□ Video templatesda ko'rindi
```

**Barchasi ✓ bo'lsa - TAYYOR! 🎉**

---

## 🎁 BONUS

### Tezkor Buyruqlar:

```bash
# Bitta video
python auto_template_downloader.py "https://instagram.com/reel/ABC123"

# Ko'p video
python auto_template_downloader.py links.json

# Interactive mode
python auto_template_downloader.py
```

### API Test:

```bash
curl -X POST http://localhost:3001/api/auto-download \
  -H "Content-Type: application/json" \
  -d '{"url":"https://instagram.com/reel/ABC123","password":"creative2026"}'
```

---

**Yaratdi:** Creative_designuz  
**Sana:** 2026-03-31  
**Versiya:** 1.0 - Auto Downloader  
**Status:** ✅ READY
