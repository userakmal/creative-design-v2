# Admin Panel Fix - Complete

## ✅ What Was Fixed

The admin panel upload functionality has been completely rebuilt to work with Node.js instead of PHP.

### Changes Made:

1. **Created new upload server** (`upload-server.js`)
   - Express.js backend with multer for file uploads
   - CORS enabled for cross-origin requests
   - Saves videos to `public/videos/`
   - Saves images to `public/image/`
   - Updates `data/videos.json` automatically

2. **Updated admin panel** (`pages/admin.page.tsx`)
   - Now connects to `http://localhost:3001/api/upload`
   - Added server connection status indicator
   - Better error messages
   - Auto-checks server connection every 5 seconds

3. **Updated package.json**
   - `npm run dev` starts both Vite and upload server
   - `npm run server` starts upload server only

4. **Created helper scripts**
   - `start-upload-server.bat` - Easy way to start upload server

## 🚀 How to Start

### Option 1: Start Everything Together (Recommended)

```bash
npm run dev
```

This starts:
- Vite frontend on http://localhost:5173
- Upload server on http://localhost:3001

### Option 2: Start Separately

Terminal 1:
```bash
npm run server
```

Terminal 2:
```bash
npm run dev
```

### Option 3: Use Batch File

Double-click `start-upload-server.bat` to start the upload server, then open the admin panel in your browser.

## 📋 How to Upload Videos

1. Go to http://localhost:5173/admin
2. Login with:
   - Username: `admin`
   - Password: `creative2026`
3. Check the server status indicator (should be green)
4. Fill in the form:
   - Video title
   - Upload thumbnail image
   - Upload video file
5. Click "Videoni Yuklash va Saqlash"
6. After success, go to `/templates` to see your new video

## 🔧 Troubleshooting

### Server Not Connecting (Red Status)

If you see "Upload server topilmadi":

1. Make sure upload server is running:
   ```bash
   npm run server
   ```
   Or double-click `start-upload-server.bat`

2. Check if port 3001 is available:
   ```bash
   netstat -ano | findstr :3001
   ```

3. Test server manually:
   Open browser and go to: http://localhost:3001/api/health
   
   You should see: `{"status":"ok","message":"Upload server is running"}`

### Upload Fails

1. Check browser console for errors (F12)
2. Check terminal where upload server is running
3. Verify password is exactly: `creative2026`
4. Make sure files are not too large (max 200MB)

### Videos Not Showing After Upload

1. Refresh the page (Ctrl+R)
2. Check `data/videos.json` - new video should be listed there
3. Check `public/videos/` folder - video file should exist
4. Check `public/image/` folder - thumbnail should exist

## 📁 File Structure

```
creative-design-main/
├── public/
│   ├── videos/          # Uploaded video files (mp4, mov, webm)
│   └── image/           # Uploaded thumbnail images (jpg, png, webp)
├── data/
│   └── videos.json      # Dynamic video database (auto-updated)
├── pages/
│   └── admin.page.tsx   # Admin panel frontend
├── upload-server.js     # Backend upload server (Node.js/Express)
├── start-upload-server.bat  # Easy start script
└── ADMIN_FIX.md         # This file
```

## 🌐 Production Deployment

For production hosting:

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Upload to server:**
   - Upload all files from `dist/` folder
   - Upload `upload-server.js`
   - Upload `data/videos.json`
   - Upload `public/videos/` and `public/image/` folders

3. **Run upload server on hosting:**
   ```bash
   node upload-server.js
   ```
   
   Or with PM2 (recommended for production):
   ```bash
   pm2 start upload-server.js --name video-upload
   pm2 save
   ```

4. **Update admin panel API URL** (if needed):
   Edit `pages/admin.page.tsx` line 52:
   ```typescript
   const response = await fetch("YOUR_SERVER_URL/api/upload", {
   ```

## 🔒 Security Notes

⚠️ **Current setup is for development/local use:**
- Password is hardcoded (change it in both `admin.page.tsx` and `upload-server.js`)
- No HTTPS (use HTTPS in production)
- No file type validation (currently accepts all types)
- No authentication tokens

For production, add:
- Environment variables for passwords
- HTTPS/SSL certificates
- Proper user authentication
- File type validation
- Virus scanning

## 📞 Support

If you still have issues:
1. Check console logs in browser (F12)
2. Check terminal output from upload server
3. Verify Node.js is installed: `node --version`
4. Verify dependencies: `npm install`
