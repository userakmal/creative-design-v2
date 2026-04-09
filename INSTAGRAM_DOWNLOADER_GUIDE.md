# 📱 INSTAGRAM AUTO DOWNLOADER & UPLOADER

## 🎯 **XUSUSIYATLARI**

Admin paneldan Instagram video URL ni qo'yasiz va:
1. ✅ Video avtomatik yuklab olinadi
2. ✅ Thumbnail avtomatik extract qilinadi
3. ✅ Serverga avtomatik upload qilinadi
4. ✅ Production ga avtomatik sync qilinadi (FTP)
5. ✅ Saytda darhol ko'rinadi!

---

## 🚀 **QAANDAY ISHLATILADI**

### **1. Admin Panel ga Kiring**
```
http://localhost:5173/admin
Login: admin
Parol: creative2026
```

### **2. Instagram Video URL ni Copy Qiling**

Instagram dan video linkini oling:
- Reels: `https://www.instagram.com/reel/ABC123/`
- Post: `https://www.instagram.com/p/ABC123/`
- IGTV: `https://www.instagram.com/tv/ABC123/`

### **3. Admin Paneldan Yuklang**

1. **"📱 Instagram dan Video Yuklash"** kartasini toping
2. **Instagram URL** maydoniga linkni qo'ying
3. **Video Nomi** (ixtiyoriy) - bo'sh qoldirsangiz original nom ishlatiladi
4. **"📱 Instagram dan Yuklash"** tugmasini bosing

### **4. Avtomatik Jarayon**

```
📥 Instagram URL qabul qilindi
   ↓
🐍 Python yt-dlp orqali video yuklab olindi
   ↓
🖼️ Thumbnail avtomatik extract qilindi
   ↓
📤 Serverga upload qilindi
   ↓
☁️ FTP orqali production ga sync qilindi
   ↓
✅ Saytda ko'rindi!
```

---

## 🛠️ **TEXNIK TAFSILOTLAR**

### **Backend Architecture:**

```
Admin Panel (React)
   ↓ POST /api/download-instagram
Upload Server (Node.js)
   ↓ spawn('python')
Instagram Downloader (Python + yt-dlp)
   ↓ Download video + thumbnail
Upload Server
   ↓ Save to public/videos/ and public/image/
   ↓ Update public/data/videos.json
   ↓ Trigger autoSyncToFTP()
Production CDN (creative-design.uz)
   ✅ Video accessible via CDN
```

### **Files Created:**

1. **`instagram-downloader.py`** - Python download script
   - Uses yt-dlp for Instagram
   - Extracts video and thumbnail
   - Returns JSON result

2. **`upload-server.js`** - New API endpoint
   - `POST /api/download-instagram`
   - Validates URL and password
   - Runs Python script
   - Processes result
   - Uploads to server
   - Triggers FTP sync

3. **`pages/admin.page.tsx`** - UI components
   - Instagram download form
   - Progress indicator
   - Error handling
   - Success feedback

---

## 📋 **REQUIREMENTS**

### **Python Packages:**
```bash
pip install yt-dlp
```

✅ Already installed!

### **Node.js:**
- Express.js server running
- upload-server.js on port 3001

### **Admin Credentials:**
- Login: `admin`
- Password: `creative2026`

---

## 🎬 **USAGE EXAMPLES**

### **Example 1: Instagram Reel**

**Input:**
```
URL: https://www.instagram.com/reel/CzABC123def/
Title: Wedding Invitation Design
```

**Process:**
1. yt-dlp downloads the reel
2. Extracts thumbnail image
3. Saves as `v_1234567890.mp4` and `i_1234567890.jpg`
4. Adds to `videos.json`
5. Uploads to CDN via FTP

**Result:**
```json
{
  "id": 54,
  "title": "Wedding Invitation Design",
  "image": "/image/i_1234567890.jpg",
  "videoUrl": "/videos/v_1234567890.mp4",
  "uploadedAt": "2026-04-09T...",
  "size": "5.2 MB"
}
```

### **Example 2: Instagram Post (No Custom Title)**

**Input:**
```
URL: https://www.instagram.com/p/AbC123XyZ/
Title: (leave empty)
```

**Result:**
- Uses Instagram's original caption as title
- Or falls back to `Instagram #55`

---

## ⚠️ **TROUBLESHOOTING**

### **Issue 1: "Video yuklab olinmadi"**

**Possible Causes:**
1. Instagram URL noto'g'ri
2. Video private yoki o'chirilgan
3. Instagram rate limiting

**Solution:**
- URL ni tekshiring (instagram.com bo'lishi kerak)
- Boshqa video bilan urinib ko'ring
- 5 daqiqa kutib qayta urinib ko'ring

### **Issue 2: "Python not found"**

**Solution:**
```bash
# Check Python installation
python --version

# If not installed, download from:
# https://www.python.org/downloads/
```

### **Issue 3: "yt-dlp not installed"**

**Solution:**
```bash
pip install yt-dlp
```

### **Issue 4: Download stuck at 90%**

**Possible Causes:**
- Large video file
- Slow internet
- Instagram server response time

**Solution:**
- Wait up to 2-3 minutes for large videos
- Check internet connection
- Try smaller videos first

---

## 🔧 **ADVANCED CONFIGURATION**

### **Custom Output Directory:**

Edit `upload-server.js`:
```javascript
const downloadDir = path.join(__dirname, 'downloads', 'instagram');
```

### **Change Video Format:**

Edit `instagram-downloader.py`:
```python
ydl_opts = {
    'format': 'best[ext=mp4]/best',  # Change to 'worst' for smaller files
    ...
}
```

### **Disable Auto-Sync to FTP:**

Edit `upload-server.js` - comment out this line:
```javascript
// autoSyncToFTP();  // Disabled
```

---

## 📊 **FLOW DIAGRAM**

```
┌─────────────────────────────────────────────────┐
│          ADMIN PANEL (React Frontend)            │
│  ┌──────────────────────────────────────────┐   │
│  │ 📱 Instagram dan Video Yuklash           │   │
│  │ URL: [____________________________]      │   │
│  │ Title: [___________________________]     │   │
│  │ [📱 Instagram dan Yuklash]               │   │
│  └──────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────┘
                     │ POST /api/download-instagram
                     ▼
┌─────────────────────────────────────────────────┐
│          UPLOAD SERVER (Node.js)                 │
│  1. Validate password & URL                      │
│  2. Spawn Python process                         │
│  3. Wait for completion                          │
│  4. Process downloaded files                     │
│  5. Add to videos.json                           │
│  6. Trigger FTP sync                             │
└────────────────────┬────────────────────────────┘
                     │ python instagram-downloader.py
                     ▼
┌─────────────────────────────────────────────────┐
│        PYTHON DOWNLOADER (yt-dlp)                │
│  1. Connect to Instagram                         │
│  2. Download video (best quality MP4)            │
│  3. Extract thumbnail (JPG)                      │
│  4. Return JSON result                           │
└────────────────────┬────────────────────────────┘
                     │ Files downloaded
                     ▼
┌─────────────────────────────────────────────────┐
│          LOCAL STORAGE                           │
│  public/videos/v_TIMESTAMP.mp4                   │
│  public/image/i_TIMESTAMP.jpg                    │
│  public/data/videos.json (updated)               │
└────────────────────┬────────────────────────────┘
                     │ autoSyncToFTP()
                     ▼
┌─────────────────────────────────────────────────┐
│          PRODUCTION CDN (FTP)                    │
│  /www/creative-design.uz/videos/v_TIMESTAMP.mp4  │
│  /www/creative-design.uz/image/i_TIMESTAMP.jpg   │
│  /www/creative-design.uz/data/videos.json        │
└────────────────────┬────────────────────────────┘
                     │ Accessible via
                     ▼
┌─────────────────────────────────────────────────┐
│          WEBSITE                                 │
│  https://creative-design.uz/templates            │
│  ✅ New video visible!                           │
└─────────────────────────────────────────────────┘
```

---

## 🎯 **SUPPORTED URLS**

✅ **Works With:**
- Instagram Reels: `instagram.com/reel/...`
- Instagram Posts: `instagram.com/p/...`
- Instagram TV: `instagram.com/tv/...`
- Public Instagram accounts

❌ **Doesn't Work With:**
- Private Instagram accounts
- Instagram Stories (expired)
- Invalid URLs
- Non-Instagram URLs

---

## 💡 **TIPS & TRICKS**

1. **Use Short Titles**: Keep titles under 50 characters
2. **Check Before Upload**: Make sure video is public on Instagram
3. **Wait Patiently**: Large videos take 1-3 minutes
4. **Refresh After Upload**: Press F5 to see new video in list
5. **Test First**: Try with a short reel before uploading important content

---

## 🔒 **SECURITY**

- ✅ Password protected (same as admin panel)
- ✅ URL validation (must contain instagram.com)
- ✅ Server-side processing (no client-side downloads)
- ✅ Automatic cleanup (temp files deleted)
- ✅ FTP credentials not exposed to frontend

---

**🎉 Instagram dan video yuklash endi juda oson!**

Just paste the URL and click the button - everything else is automatic! 🚀
