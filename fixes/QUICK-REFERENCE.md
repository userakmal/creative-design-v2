# ⚡ CREATIVE DESIGN PLATFORM - QUICK REFERENCE CARD

---

## 🚀 START EVERYTHING (3 steps)

```bash
# 1. Start all services
start-all-fixed.bat

# 2. Wait 10 seconds

# 3. Open browser
http://localhost:5173/admin
```

---

## 🔐 ADMIN LOGIN

- **URL:** http://localhost:5173/admin
- **Password:** creative2026
- **No username required** (local development)

---

## 📹 UPLOAD VIDEO (5 steps)

1. Go to http://localhost:5173/admin
2. Click "📹 Video" tab
3. Fill in: Video name + Select video file + Select thumbnail
4. Click "📤 Video Yuklash"
5. Wait for progress bar (0% → 100%)

**Requirements:**
- Video: MP4, MOV, AVI, MKV, WEBM (< 500MB)
- Thumbnail: JPG, PNG, WEBP

---

## 🎵 UPLOAD MUSIC (4 steps)

1. Go to http://localhost:5173/admin
2. Click "🎵 Musiqa" tab
3. Fill in: Music name + Artist + Select music file
4. Click "📤 Musiqa Yuklash"

**Requirements:**
- Audio: MP3, M4A, WAV, OGG, AAC, FLAC (< 500MB)

---

## 🔍 CHECK SERVER STATUS

### Method 1: Browser
```
http://localhost:3001/api/health
```

### Method 2: Admin Panel
Look for green "Online" badge at top right

### Method 3: Command Line
```bash
curl http://localhost:3001/api/health
```

---

## 🛠️ FIX UPLOAD ISSUES

### Quick Fix (Recommended)
```bash
fixes\fix-video-upload.bat
```

### Complete Reset
```bash
fixes\complete-reset-and-fix.bat
```

### Manual Restart
```bash
# Stop all
stop-all-fixed.bat

# Start all
start-all-fixed.bat
```

---

## 📊 KEY URLS

| Service | URL |
|---------|-----|
| **Admin Panel** | http://localhost:5173/admin |
| **Main Website** | http://localhost:5173 |
| **API Health** | http://localhost:3001/api/health |
| **API Stats** | http://localhost:3001/api/stats |
| **Videos List** | http://localhost:3001/api/videos |
| **Music List** | http://localhost:3001/api/music |

---

## 🐛 TROUBLESHOOTING (Quick)

| Problem | Solution |
|---------|----------|
| Admin shows "Offline" | Start API server: `start-all-fixed.bat` |
| "Parol noto'g'ri" | Password is: `creative2026` |
| "Fayl hajmi juda katta" | File must be < 500MB |
| "Tarmoq xatosi" | Server not running → restart |
| Upload stuck at 0% | Check network tab (F12) |

---

## 📁 IMPORTANT FILES

### Configuration
- `api-server/upload-server.js` - Server code (line 16: password)
- `client/src/pages/admin.page.tsx` - Admin UI (line 18: password)

### Data Files
- `api-server/public/data/videos.json` - Video metadata
- `api-server/public/data/music.json` - Music metadata

### Upload Folders
- `api-server/public/videos/` - Video files
- `api-server/public/image/` - Thumbnail images
- `api-server/public/music/` - Music files

---

## 🎯 VERIFICATION CHECKLIST

After uploading, verify:
- [ ] ✅ Success toast message appeared
- [ ] ✅ Video appears in list below upload form
- [ ] ✅ Thumbnail image loads correctly
- [ ] ✅ Video shows in main website gallery
- [ ] ✅ File exists in `api-server/public/videos/`
- [ ] ✅ Entry exists in `videos.json`

---

## ⌨️ USEFUL COMMANDS

```bash
# Check Node.js
node --version

# Check npm
npm --version

# Install dependencies (API server)
cd api-server && npm install

# Install dependencies (Client)
cd client && npm install

# Start API server
cd api-server && npm start

# Start Client
cd client && npm run dev

# Check ports
netstat -ano | findstr ":3001"
netstat -ano | findstr ":5173"

# View uploaded videos
dir api-server\public\videos

# View uploaded images
dir api-server\public\image

# View data files
type api-server\public\data\videos.json
```

---

## 📞 WHEN ASKING FOR HELP

Provide this information:
1. Run: `check-status.bat` and share output
2. Open browser DevTools (F12)
3. Go to Console tab, copy any errors
4. Go to Network tab, find POST /api/upload, check response
5. Screenshot admin panel
6. Copy API server console output

---

**Password:** creative2026  
**Version:** 2.1.0  
**Last Updated:** April 10, 2026
