# 🎬 Video Upload Fix - Complete Guide

## ❌ Problem
Video upload through admin panel is not working.

## ✅ Root Causes (Common Issues)

### 1. Server Not Running
**Problem:** API server on port 3001 is not started
**Solution:** Start the API server

### 2. File Upload Size Limits
**Problem:** Video exceeds 500MB limit
**Solution:** Reduce video size or increase server limit

### 3. CORS/Connection Issues
**Problem:** Frontend can't connect to backend
**Solution:** Verify SERVER_URL configuration

### 4. Password Mismatch
**Problem:** Admin password doesn't match server configuration
**Solution:** Ensure password is `creative2026`

### 5. Missing Directories
**Problem:** Upload directories don't exist
**Solution:** Server creates them automatically, but check permissions

---

## 🔍 Step-by-Step Diagnostics

### Step 1: Check API Server Status
```bash
# Open browser and check:
http://localhost:3001/api/health

# Should return:
{
  "status": "ok",
  "message": "🚀 Upload server ishlamoqda",
  "stats": { "videos": X, "music": Y },
  "uptime": "123s"
}
```

### Step 2: Check Server Logs
```bash
# Look at API server console output
# Should show successful starts and no errors
```

### Step 3: Check Browser Console
```
1. Open DevTools (F12)
2. Go to Console tab
3. Try uploading a video
4. Look for error messages
```

### Step 4: Check Network Tab
```
1. Open DevTools (F12)
2. Go to Network tab
3. Try uploading a video
4. Check the POST /api/upload request
5. Look at response body for error details
```

---

## 🛠️ Quick Fixes

### Fix 1: Restart All Services
```bash
# Stop everything first
stop-all.bat

# Then start fresh
start-all-fixed.bat
```

### Fix 2: Clear Old Uploads
```bash
# Navigate to upload directories
cd api-server\public\videos
del /q *

cd ..\image
del /q *

cd ..\data
# Reset videos.json
echo [] > videos.json
```

### Fix 3: Verify Configuration
Check these files:
- `api-server/upload-server.js` - Line 16: ADMIN_PASSWORD
- `client/src/pages/admin.page.tsx` - Line 18: ADMIN_PASSWORD
- Both should be: `creative2026`

### Fix 4: Test with Small File
```
Try uploading a very small video file (< 50MB)
This helps identify if it's a size limit issue
```

---

## 📋 Upload Checklist

Before uploading, verify:
- [ ] API server is running (check http://localhost:3001/api/health)
- [ ] Status shows "Online" in admin panel
- [ ] Video file is under 500MB
- [ ] Video format: MP4, MOV, AVI, MKV, or WEBM
- [ ] Thumbnail format: JPG, PNG, WEBP
- [ ] Video title is not empty
- [ ] Both video and image files are selected

---

## 🚀 Manual Upload Test

### Using curl (Advanced):
```bash
curl -X POST http://localhost:3001/api/upload ^
  -F "title=Test Video" ^
  -F "video=@path/to/test.mp4" ^
  -F "image=@path/to/thumb.jpg" ^
  -F "password=creative2026"
```

### Expected Response:
```json
{
  "success": true,
  "message": "\"Test Video\" muvaffaqiyatli yuklandi!",
  "data": {
    "id": 1001,
    "title": "Test Video",
    "image": "/image/i_xxx.jpg",
    "videoUrl": "/videos/v_xxx.mp4",
    "uploadedAt": "2026-04-10T...",
    "size": "X.X MB"
  },
  "totalVideos": 2
}
```

---

## 🐛 Common Error Messages

### "Parol noto'g'ri"
**Cause:** Password mismatch
**Fix:** Check both client and server have same password

### "Video va rasm fayllarini yuklang"
**Cause:** Missing files in upload
**Fix:** Select both video and thumbnail

### "Fayl hajmi juda katta (max 500MB)"
**Cause:** File too large
**Fix:** Compress video or increase limit in upload-server.js

### "Tarmoq xatosi"
**Cause:** Server not reachable
**Fix:** Start API server, check firewall settings

### "Server javobini o'qib bo'lmadi"
**Cause:** Server returned invalid JSON
**Fix:** Check server logs for errors

---

## 📊 Server Log Analysis

### Good Log (Successful Upload):
```
✅ Yangi video yuklandi: "My Video" (ID: 1001)
   📁 Video: v_1234567890.mp4 (25.3 MB)
   🖼️ Rasm: i_1234567890.jpg (245.6 KB)
```

### Bad Log (Failed Upload):
```
❌ Upload error: [Error details here]
```

---

## 🔧 Advanced Fixes

### Increase Upload Size Limit
Edit `api-server/upload-server.js`, line 68:
```javascript
limits: { fileSize: 1024 * 1024 * 1024 }, // Change to 1GB
```

### Enable Debug Logging
Add to `upload-server.js` before upload handler:
```javascript
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`);
  next();
});
```

### Check File Permissions (Windows)
```bash
# Ensure directories are writable
icacls api-server\public\videos
icacls api-server\public\image
```

---

## ✅ Verification After Fix

### Test Upload:
1. Go to http://localhost:5173/admin
2. Enter video title
3. Select small video file (< 50MB)
4. Select thumbnail image
5. Click "Video Yuklash"
6. Should see progress bar and success message

### Verify Files Created:
```bash
# Check upload directories
dir api-server\public\videos
dir api-server\public\image
type api-server\public\data\videos.json
```

### Check Frontend Display:
1. Go to main page
2. Videos should appear in gallery
3. Thumbnail should load
4. Video should play

---

## 📞 Still Not Working?

### Collect Debug Info:
1. Run: `check-status.bat`
2. Screenshot browser console errors
3. Copy API server console output
4. Note exact error message

### Common Last Resorts:
```bash
# Complete reset (WARNING: deletes all uploads)
cd api-server\public
rmdir /s /q videos image music data
# Restart server - it will recreate directories
```

---

**Last Updated:** April 10, 2026
**Status:** Ready for troubleshooting
