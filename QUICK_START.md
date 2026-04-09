# 🚀 CREATIVE DESIGN PLATFORM - QUICK START GUIDE

## 📋 OVERVIEW

Professional Creative Design Platform for video invitations, design showcases, and media management with:
- ✅ Instagram video auto-downloader
- ✅ Admin panel with upload capabilities
- ✅ Auto-sync to production via FTP
- ✅ Music library management
- ✅ Video downloader tool

---

## 🎯 QUICK START

### **Start All Services:**
```
Double-click: CRrunner.bat
```

### **Stop All Services:**
```
Double-click: CRstopper.bat
```

---

## 🌐 SERVICE URLS

After running `CRrunner.bat`, access:

| Service | URL | Description |
|---------|-----|-------------|
| 🌐 **Web App** | http://localhost:5173 | Main website |
| 🔐 **Admin Panel** | http://localhost:5173/admin | Upload & manage content |
| 📝 **Templates** | http://localhost:5173/templates | Browse video templates |
| 🎵 **Music** | http://localhost:5173/music | Music library |
| 📥 **Downloader** | http://localhost:5173/video-downloader | Download videos |
| 📤 **Upload Server** | http://localhost:3001 | Backend API server |

---

## 🔐 ADMIN CREDENTIALS

```
Login: admin
Password: creative2026
```

---

## 📱 INSTAGRAM VIDEO DOWNLOAD

### **From Admin Panel:**

1. Go to **Admin Panel** → **Video** tab
2. Find **"📱 Instagram dan Video Yuklash"** card
3. Paste Instagram URL:
   - Reels: `https://www.instagram.com/reel/ABC123/`
   - Posts: `https://www.instagram.com/p/ABC123/`
4. (Optional) Enter custom title
5. Click **"📱 Instagram dan Yuklash"**
6. Wait 1-3 minutes for download & upload
7. Video automatically appears on website!

### **How It Works:**

```
Instagram URL
   ↓
🐍 Python downloads video (yt-dlp)
   ↓
🖼️ Extract thumbnail
   ↓
📤 Upload to server
   ↓
☁️ Sync to production (FTP)
   ↓
✅ Visible on website!
```

---

## 📂 PROJECT STRUCTURE

```
creative-design-platform/
├── 🚀 Runners
│   ├── CRrunner.bat              ← Start all services
│   └── CRstopper.bat             ← Stop all services
│
├── 📱 Frontend
│   ├── index.tsx                 ← App entry point
│   ├── config.ts                 ← Configuration
│   ├── routes.tsx                ← Router config
│   ├── types.ts                  ← TypeScript types
│   └── pages/
│       ├── main.page.tsx         ← Home page
│       ├── templates.page.tsx    ← Video templates
│       ├── admin.page.tsx        ← Admin panel
│       ├── music.page.tsx        ← Music library
│       └── downloader.page.tsx   ← Video downloader
│
├── 🔧 Backend
│   ├── upload-server.js          ← Express API server
│   ├── instagram-downloader.py   ← Instagram download script
│   └── upload-to-hosting.js      ← FTP sync script
│
├── 📁 Data
│   ├── public/
│   │   ├── videos/               ← Video files
│   │   ├── image/                ← Image files
│   │   ├── music/                ← Music files
│   │   ├── logo/                 ← Logo files
│   │   └── data/                 ← JSON metadata
│   └── downloads/instagram/      ← Temp download folder
│
└── 📝 Config
    ├── package.json              ← Node.js dependencies
    ├── tsconfig.json             ← TypeScript config
    └── vite.config.ts            ← Vite bundler config
```

---

## 🛠️ AVAILABLE COMMANDS

### **NPM Scripts:**

```bash
# Start services
npm start                  # Start both web app and upload server
npm run dev                # Start web app only
npm run server             # Start upload server only

# Build
npm run build              # Build for production
npm run preview            # Preview production build

# Type check
npm run lint               # TypeScript type checking

# Clean
npm run clean              # Remove build artifacts
```

### **Batch Files:**

```bash
CRrunner.bat               # Start all services (recommended)
CRstopper.bat              # Stop all services (recommended)
```

---

## 🎯 COMMON TASKS

### **Upload Video from Instagram:**
1. Open Admin Panel
2. Paste Instagram URL
3. Click "Instagram dan Yuklash"
4. Wait for completion
5. Video appears on website!

### **Upload Video Manually:**
1. Open Admin Panel
2. Go to Video tab
3. Fill in title
4. Select video file
5. Select thumbnail image
6. Click "Video Yuklash"

### **Upload Music:**
1. Open Admin Panel
2. Go to Music tab
3. Fill in title and author
4. Select music file
5. Click "Musiqa Yuklash"

### **Manage Videos:**
- **Rename:** Click edit icon next to video
- **Delete:** Click delete icon next to video
- **Preview:** Click on video thumbnail

---

## ⚠️ TROUBLESHOOTING

### **Port Already in Use:**

**Error:** "Port 3001 is already in use"

**Solution:**
```bash
# Run CRstopper.bat first
CRstopper.bat

# Then run CRrunner.bat
CRrunner.bat
```

### **Dependencies Not Installed:**

**Error:** "Cannot find module"

**Solution:**
```bash
npm install
```

### **Instagram Download Fails:**

**Possible Causes:**
- Invalid URL
- Private account
- Video deleted

**Solution:**
- Check URL format
- Ensure video is public
- Try different video

### **Python Not Found:**

**Solution:**
1. Install Python from https://www.python.org/
2. During installation, check "Add Python to PATH"
3. Restart terminal
4. Run: `pip install yt-dlp`

---

## 🔒 SECURITY

- ✅ Admin panel password protected
- ✅ Upload server password protected
- ✅ Instagram downloader requires password
- ✅ FTP credentials not exposed to frontend
- ✅ File upload size limits enforced

---

## 📊 TECH STACK

### **Frontend:**
- React 19
- TypeScript
- Vite
- React Router 7
- Lucide React (icons)

### **Backend:**
- Express.js 5
- Multer (file uploads)
- CORS

### **Python:**
- yt-dlp (video downloading)
- Instagram support

### **Deployment:**
- FTP auto-sync
- Production CDN
- Vite build optimization

---

## 🎓 DEVELOPER NOTES

### **Adding New Features:**

1. **New Page:**
   ```bash
   # Create page file
   pages/new-page.page.tsx
   
   # Add to routes.tsx
   import { NewPage } from "./pages/new-page.page";
   <Route path="/new" element={<NewPage />} />
   ```

2. **New API Endpoint:**
   ```javascript
   // Add to upload-server.js
   app.post('/api/new-endpoint', async (req, res) => {
     // Your code here
   });
   ```

3. **Update Config:**
   ```typescript
   // Edit config.ts
   export const config = {
     // Your config here
   };
   ```

### **Build for Production:**

```bash
npm run build
```

Output in `dist/` folder - deploy to your hosting.

---

## 📞 SUPPORT

### **Documentation Files:**

- `README.md` - Main documentation
- `INSTAGRAM_DOWNLOADER_GUIDE.md` - Instagram download feature
- `FINAL_FIX_SUMMARY.md` - Latest fixes summary
- `HOSTING_FIX.md` - Hosting configuration
- `VIDEO_DEBUG.md` - Video debugging guide

### **Diagnostic Tools:**

```bash
node check-hosting.js           # Check hosting accessibility
node check-media.js             # Check media files
node check-hosting-config.js    # Check server config
node detect-hosting-structure.js # Auto-detect structure
```

---

## 🎉 READY TO USE!

Your Creative Design Platform is ready. Just run:

```
CRrunner.bat
```

And start creating amazing content! 🚀

---

**Last Updated:** April 9, 2026  
**Version:** 2.0  
**Status:** ✅ Production Ready
