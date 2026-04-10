# DIAGNOSTICS GUIDE

## 🔍 How to Diagnose Issues

### Quick Diagnostic Script

Run the diagnostic tool:
```bash
check-status.bat
```

This will check:
- ✅ Node.js installation
- ✅ npm installation
- ✅ Python installation
- ✅ FFmpeg installation
- ✅ Dependencies status
- ✅ Configuration files
- ✅ Port availability

---

## 📊 Manual Diagnostic Steps

### Step 1: Check if Servers are Running

#### Check API Server (Port 3001)
```bash
netstat -ano | findstr ":3001"
```

If running, you should see output. If not, start it:
```bash
cd api-server
npm start
```

#### Check Frontend (Port 5173)
```bash
netstat -ano | findstr ":5173"
```

If running, you should see output. If not, start it:
```bash
cd client
npm run dev
```

---

### Step 2: Check API Health

Open browser or use curl:
```bash
curl http://localhost:3001/api/health
```

**Good Response:**
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

**Bad Response:** Connection refused
- **Solution:** Start API server

---

### Step 3: Check Data Files

#### Check Videos Database
```bash
type api-server\public\data\videos.json
```

Should contain: `[]` or array of video objects

#### Check Music Database
```bash
type api-server\public\data\music.json
```

Should contain: `[]` or array of music objects

**If files don't exist:**
```bash
echo [] > api-server\public\data\videos.json
echo [] > api-server\public\data\music.json
```

---

### Step 4: Check Uploads Directory

```bash
dir api-server\public\videos
dir api-server\public\image
dir api-server\public\music
```

All directories should exist and contain uploaded files.

---

### Step 5: Check Browser Console

1. Open http://localhost:5173/admin
2. Press F12 to open DevTools
3. Go to Console tab
4. Look for errors

**Common Errors:**
- `Failed to fetch` → API server not running
- `404 Not Found` → Wrong API endpoint
- `CORS error` → Server CORS not configured

---

## 🐛 Common Issues & Solutions

### Issue 1: Admin Panel Shows "Offline"

**Symptoms:**
- Red "Offline" indicator
- Stats show 0
- Cannot upload

**Diagnosis:**
```bash
curl http://localhost:3001/api/health
```

**Solution:**
```bash
cd api-server
npm start
```

---

### Issue 2: Upload Fails

**Symptoms:**
- Progress bar stuck
- Error message appears
- File not uploaded

**Check:**
1. Is API server running?
   ```bash
   curl http://localhost:3001/api/health
   ```

2. Is password correct?
   - Must be: `creative2026`

3. File size within limit?
   - Max: 500MB

**Solution:**
- Restart API server
- Check password in admin panel code
- Verify file size

---

### Issue 3: Videos Not Showing

**Symptoms:**
- Uploaded but not visible
- Empty list in admin
- Empty list on main page

**Check:**
1. Check videos.json:
   ```bash
   type api-server\public\data\videos.json
   ```

2. Check API response:
   ```bash
   curl http://localhost:3001/api/videos
   ```

3. Check browser network tab for errors

**Solution:**
- If videos.json is corrupt, fix or reset:
  ```bash
  echo [] > api-server\public\data\videos.json
  ```

---

### Issue 4: Telegram Bot Not Working

**Symptoms:**
- Bot doesn't respond
- Bot crashes on start
- Import errors

**Check:**
1. Is .env file present?
   ```bash
   dir telegram-video-bot\.env
   ```

2. Are dependencies installed?
   ```bash
   cd telegram-video-bot
   venv\Scripts\activate
   pip list
   ```

3. Is bot token correct?
   - Check .env file

**Solution:**
```bash
cd telegram-video-bot
venv\Scripts\activate
pip install -r requirements.txt
python bot.py
```

---

### Issue 5: Port Already in Use

**Symptoms:**
- Error: "Port 3001 already in use"
- Cannot start server

**Diagnosis:**
```bash
netstat -ano | findstr ":3001"
```

**Solution:**
```bash
# Kill process on port 3001
for /f "tokens=5" %a in ('netstat -ano ^| findstr ":3001"') do taskkill /F /PID %a

# Or use stop script
stop-all-fixed.bat
```

---

## 📈 Performance Diagnostics

### Check Disk Usage
```bash
du -sh api-server/public/videos
du -sh api-server/public/image
du -sh api-server/public/music
```

### Check Memory Usage
- Open Task Manager
- Look for node.exe processes
- Check memory consumption

### Check Network Speed
- Upload speed affects video upload time
- Download speed affects video playback

---

## 🔧 Reset Everything

If all else fails, complete reset:

```bash
# Stop all services
stop-all-fixed.bat

# Delete node_modules
rmdir /s /q client\node_modules
rmdir /s /q api-server\node_modules

# Reinstall
cd client && npm install
cd ../api-server && npm install

# Restart
cd ..
start-all-fixed.bat
```

---

## 📞 Getting Help

If diagnostics don't help:

1. **Check logs:**
   - API server console output
   - Browser console errors
   - Bot log file: `telegram-video-bot/bot.log`

2. **Verify configuration:**
   - `.env` files present
   - Tokens correct
   - Ports available

3. **Test individual components:**
   - Start API server alone
   - Test with curl
   - Start frontend alone
   - Test in browser

---

**Last Updated:** April 10, 2026
