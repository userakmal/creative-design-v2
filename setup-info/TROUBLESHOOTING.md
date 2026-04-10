# TROUBLESHOOTING GUIDE

## 🐛 Common Problems & Solutions

---

## PROBLEM 1: Admin panel ochilmaydi

### Symptoms:
- Blank page
- Loading spinner forever
- "Yuklanmoqda..." text stuck

### Causes:
1. API server ishlamayapti
2. Frontend ishlamayapti
3. Port band

### Solution:

**Step 1:** Check if API server is running
```bash
curl http://localhost:3001/api/health
```

If connection refused:
```bash
cd api-server
npm start
```

**Step 2:** Check if frontend is running
```bash
# Should see Vite output
cd client
npm run dev
```

**Step 3:** Check ports
```bash
netstat -ano | findstr ":3001"
netstat -ano | findstr ":5173"
```

If ports are taken, kill processes or use different ports.

**Step 4:** Clear browser cache
- Ctrl + Shift + Delete
- Clear cache and cookies
- Reload page

---

## PROBLEM 2: Video yuklanmayapti

### Symptoms:
- Progress bar stuck
- Error message appears
- Upload fails

### Causes:
1. API server not running
2. Wrong password
3. File too large
4. Invalid file format

### Solution:

**Step 1:** Verify API server is running
```bash
curl http://localhost:3001/api/health
```

Should return: `{"status": "ok"}`

**Step 2:** Check password
- Must be exactly: `creative2026`
- Case sensitive!

**Step 3:** Check file size
- Max: 500MB
- If larger, reduce file size

**Step 4:** Check file format
- **Video:** MP4, MOV, AVI, MKV, WEBM
- **Image:** JPG, JPEG, PNG, WEBP

**Step 5:** Check browser console for errors
- Press F12
- Go to Console tab
- Look for red errors

**Step 6:** Check API server console
- Look for error messages
- Check if request received

---

## PROBLEM 3: Yuklangan videolar ko'rinmayapti

### Symptoms:
- Upload successful but video not showing
- Empty list in admin panel
- Empty list on main page

### Causes:
1. videos.json corrupt
2. Frontend not fetching data
3. API endpoint wrong

### Solution:

**Step 1:** Check videos.json file
```bash
type api-server\public\data\videos.json
```

Should contain valid JSON array. If corrupt:
```bash
echo [] > api-server\public\data\videos.json
```

**Step 2:** Test API endpoint
```bash
curl http://localhost:3001/api/videos
```

Should return array of videos or `[]`

**Step 3:** Check browser network tab
- F12 → Network tab
- Refresh page
- Look for `/api/videos` request
- Check response

**Step 4:** Force refresh
- Ctrl + Shift + R
- Or clear cache and reload

---

## PROBLEM 4: Musiqa yuklanmayapti

### Same as video upload issues

**Check:**
1. API server running
2. Password correct
3. File format supported (MP3, M4A, WAV, OGG, AAC, FLAC)
4. File size under 500MB

**Test:**
```bash
curl http://localhost:3001/api/music
```

---

## PROBLEM 5: "Offline" ko'rsatkichi

### Symptoms:
- Red "Offline" badge in admin panel
- Stats show 0

### Causes:
- API server not running
- Wrong server URL
- CORS issue

### Solution:

**Step 1:** Start API server
```bash
cd api-server
npm start
```

**Step 2:** Check server URL in admin panel
- Should be: `http://localhost:3001`
- Check browser console for URL errors

**Step 3:** Test health endpoint
```bash
curl http://localhost:3001/api/health
```

If working, should turn green "Online"

---

## PROBLEM 6: Telegram bot ishlamayapti

### Symptoms:
- Bot doesn't respond
- Bot crashes
- Import errors

### Causes:
1. Dependencies not installed
2. .env file missing
3. Wrong bot token
4. Python not installed

### Solution:

**Step 1:** Check .env file exists
```bash
dir telegram-video-bot\.env
```

If missing, create it (see setup guide)

**Step 2:** Install dependencies
```bash
cd telegram-video-bot
venv\Scripts\activate
pip install -r requirements.txt
```

**Step 3:** Check bot token
- Open .env file
- Verify token is correct
- Check token with @BotFather

**Step 4:** Run bot with verbose output
```bash
python bot.py
```

Watch for error messages in console

---

## PROBLEM 7: Port already in use

### Symptoms:
- Error: "Port 3001 already in use"
- Cannot start server

### Solution:

**Option 1:** Kill process on port
```bash
# Find PID
netstat -ano | findstr ":3001"

# Kill process (replace PID)
taskkill /F /PID 1234
```

**Option 2:** Use stop script
```bash
stop-all-fixed.bat
```

**Option 3:** Change port

Edit `api-server/upload-server.js`:
```javascript
const PORT = process.env.PORT || 3002; // Change to 3002
```

Then update frontend config to use new port.

---

## PROBLEM 8: Dependencies not installing

### npm install fails

**Causes:**
- No internet
- Corrupted npm cache
- Wrong Node.js version

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Reinstall
cd client
npm install

cd ../api-server
npm install
```

### pip install fails

**Causes:**
- No internet
- Python not installed
- Virtual environment not activated

**Solution:**
```bash
cd telegram-video-bot

# Create venv
python -m venv venv

# Activate
venv\Scripts\activate

# Install
pip install -r requirements.txt
```

---

## PROBLEM 9: FFmpeg not found

### Symptoms:
- Video processing fails
- Audio extraction fails
- Error: "ffmpeg not found"

### Solution:

**Option 1:** Install via winget (Windows)
```bash
winget install ffmpeg
```

**Option 2:** Manual install
1. Download from: https://ffmpeg.org/download.html
2. Extract to folder
3. Add to PATH

**Option 3:** Verify installation
```bash
ffmpeg -version
```

Should show version info

---

## PROBLEM 10: Blank white page

### Symptoms:
- Browser shows white page
- No errors
- Nothing loads

### Causes:
1. JavaScript error
2. React not mounted
3. Build issue

### Solution:

**Step 1:** Check browser console
- F12 → Console
- Look for errors

**Step 2:** Check if Vite is running
```bash
cd client
npm run dev
```

Should show:
```
VITE v6.2.0  ready in xxx ms

➜  Local:   http://localhost:5173/
```

**Step 3:** Rebuild if needed
```bash
cd client
npm run build
npm run dev
```

---

## PROBLEM 11: CORS errors

### Symptoms:
- "CORS policy" error in console
- API requests blocked

### Solution:

CORS is already enabled in API server. If still getting errors:

**Check** `api-server/upload-server.js`:
```javascript
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

Should be present. If not, add it.

---

## PROBLEM 12: Slow performance

### Symptoms:
- Upload very slow
- Page loads slow
- Laggy UI

### Causes:
1. Large files
2. Slow network
3. Low memory

### Solution:

**Step 1:** Check file sizes
- Keep under 100MB for faster uploads
- Compress videos if needed

**Step 2:** Check network speed
```bash
# Test internet speed
# Use speedtest website
```

**Step 3:** Monitor memory
- Open Task Manager
- Check RAM usage
- Close unnecessary apps

**Step 4:** Use production build
```bash
cd client
npm run build
npm run preview
```

---

## Advanced Troubleshooting

### Enable Debug Logging

**API Server:**
Add to `upload-server.js`:
```javascript
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});
```

**Frontend:**
Add to admin page:
```javascript
console.log('API Response:', data);
console.log('API Error:', error);
```

### Network Debugging

**Check all endpoints:**
```bash
# Health
curl http://localhost:3001/api/health

# Videos
curl http://localhost:3001/api/videos

# Music
curl http://localhost:3001/api/music

# Stats
curl http://localhost:3001/api/stats
```

### Database Reset

**Reset videos:**
```bash
echo [] > api-server\public\data\videos.json
```

**Reset music:**
```bash
echo [] > api-server\public\data\music.json
```

**⚠️ Warning:** This deletes all uploaded data!

---

## Getting More Help

If none of these solutions work:

1. **Check logs:**
   - API server console
   - Browser console
   - Bot log file

2. **Gather information:**
   - Error messages
   - Screenshots
   - Steps to reproduce

3. **Test individually:**
   - Start API server alone
   - Test with curl
   - Start frontend alone
   - Test in browser

4. **Complete reinstall:**
   ```bash
   stop-all-fixed.bat
   rmdir /s /q client\node_modules
   rmdir /s /q api-server\node_modules
   cd client && npm install
   cd ../api-server && npm install
   cd ..
   start-all-fixed.bat
   ```

---

**Last Updated:** April 10, 2026
**Version:** 1.0.0
