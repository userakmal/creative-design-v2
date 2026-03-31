# 📱 Mobile Admin Panel - Deployment Guide

## ✅ What's New

You can now **delete and rename videos** from your phone on the production website!

### Features:
- 🗑️ **Delete videos** - Remove unwanted videos (deletes video, image, and JSON entry)
- ✏️ **Rename videos** - Change video titles instantly
- 📱 **Mobile-friendly** - Works perfectly on phones
- 🔒 **Password protected** - Secure admin access
- 🌐 **Production ready** - Works on https://creative-design.uz

---

## 🚀 How to Deploy to Production

### Option 1: Manual Upload (Recommended)

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Upload these files to your server (creative-design.uz):**
   - `dist/` folder → Upload to your web root
   - `upload-server.js` → Upload to your server
   - `package.json` → Upload to your server
   - `public/` folder → Upload to your server (contains videos, images, data)

3. **On your server (VPS/Hosting), run:**
   ```bash
   npm install
   node upload-server.js
   ```

4. **Keep the server running** (use PM2 or similar):
   ```bash
   npm install -g pm2
   pm2 start upload-server.js --name creative-upload
   pm2 save
   pm2 startup
   ```

---

### Option 2: Using Deploy Script

If you have FTP/SFTP access:

```bash
npm run deploy
```

---

## 📱 How to Use on Your Phone

1. **Open admin panel:**
   - Go to: `https://creative-design.uz/admin`

2. **Login:**
   - Username: `admin`
   - Password: `creative2026`

3. **Manage videos:**
   - Scroll to "Yuklangan Videolar" section
   - See all uploaded videos with thumbnails
   - **To rename:** Click ✏️ icon → Edit name → Click ✓ to save
   - **To delete:** Click 🗑️ icon → Confirm deletion

---

## 🔧 Server Configuration

### Required Ports:
- **Port 5173** - Vite dev server (local development)
- **Port 3001** - Upload server (required for admin functions)

### Production Server Setup:

Create a systemd service file `/etc/systemd/system/creative-upload.service`:

```ini
[Unit]
Description=Creative Design Upload Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/creative-design
ExecStart=/usr/bin/node /var/www/creative-design/upload-server.js
Restart=always
Environment=NODE_ENV=production
Environment=PORT=3001

[Install]
WantedBy=multi-user.target
```

Then enable and start:
```bash
sudo systemctl enable creative-upload
sudo systemctl start creative-upload
sudo systemctl status creative-upload
```

---

## 🎯 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Check server status |
| GET | `/api/videos` | Get all uploaded videos |
| POST | `/api/upload` | Upload new video |
| PUT | `/api/videos/:id` | Rename video |
| DELETE | `/api/videos/:id` | Delete video |

---

## 📂 File Structure

```
creative-design-main/
├── public/
│   ├── videos/       # Uploaded video files
│   ├── image/        # Uploaded image files
│   └── data/
│       └── videos.json  # Video metadata
├── pages/
│   └── admin.page.tsx  # Admin panel UI
├── upload-server.js    # Upload & management API
└── dist/              # Built production files
```

---

## 🔐 Security Notes

- Admin password: `creative2026` (change in `upload-server.js` and `admin.page.tsx`)
- Consider adding HTTPS on production
- Restrict admin panel access by IP if possible

---

## 🆘 Troubleshooting

### Server not starting:
```bash
# Check if port 3001 is in use
netstat -ano | findstr :3001

# Kill the process
taskkill /F /PID <process_id>

# Restart server
node upload-server.js
```

### Videos not showing:
1. Check server is running: `http://localhost:3001/api/health`
2. Check videos.json exists: `public/data/videos.json`
3. Refresh admin panel

### Can't delete videos:
1. Check file permissions on server
2. Ensure upload-server.js has write access to public/ folder

---

## 📞 Support

For issues or questions, contact: Creative_designuz
