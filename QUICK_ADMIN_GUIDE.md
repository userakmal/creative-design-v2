# 🎯 Quick Admin Guide - Creative Design

## 📱 Access Admin Panel

### On Localhost (Computer):
- URL: http://localhost:5173/admin
- Login: `admin`
- Password: `creative2026`

### On Production (Phone):
- URL: https://creative-design.uz/admin
- Login: `admin`
- Password: `creative2026`

---

## ✏️ How to Rename a Video

1. Go to Admin Panel
2. Scroll to "Yuklangan Videolar" section
3. Click the **✏️ (pencil)** icon next to the video
4. Type the new name
5. Press **Enter** or click **✓ (save)** icon
6. Done! Name updated instantly

---

## 🗑️ How to Delete a Video

1. Go to Admin Panel
2. Scroll to "Yuklangan Videolar" section
3. Click the **🗑️ (trash)** icon next to the video
4. Confirm deletion in the popup
5. Done! Video removed from website

**What gets deleted:**
- ✅ Video file from server
- ✅ Image thumbnail
- ✅ Entry from videos.json
- ✅ Removed from website automatically

---

## 📤 How to Upload New Video

1. Go to Admin Panel
2. Fill in the form:
   - **Video nomi** - Enter title (e.g., "Dizayn 50")
   - **Rasm** - Select thumbnail image (.jpg, .png)
   - **Video** - Select video file (.mp4, .mov)
3. Click **"Videoni Yuklash va Saqlash"**
4. Wait for upload to complete
5. Done! Video appears on /templates page

---

## 🎨 Video Management Features

| Action | Icon | Location |
|--------|------|----------|
| Rename | ✏️ | Next to each video |
| Delete | 🗑️ | Next to each video |
| Refresh | 🔄 | Top right of video list |
| Upload | 📤 | Top of admin panel |

---

## ⚠️ Important Notes

1. **Deleting is permanent** - Cannot undo!
2. **Server must be running** - Port 3001 for admin functions
3. **Password protected** - Only admins can manage videos
4. **Mobile friendly** - Works on any phone browser

---

## 🔧 Server Commands

### Start Everything:
```bash
# Start upload server
start-upload-server.bat

# Or start dev server
npm run dev
```

### Check if server is running:
Open browser: http://localhost:3001/api/health

Should show: `{"status":"ok","message":"Upload server is running"}`

---

## 📱 Mobile Usage

1. Open phone browser
2. Go to: https://creative-design.uz/admin
3. Login with credentials
4. Manage videos on the go!

**Optimized for:**
- ✅ iPhone Safari
- ✅ Android Chrome
- ✅ Any modern mobile browser

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't login | Check password: `creative2026` |
| Videos not loading | Check server is running on port 3001 |
| Can't delete | Refresh page and try again |
| Upload fails | Check file size (max 200MB) |

---

**Created by:** Creative_designuz
**Version:** 2.0 (Mobile Admin)
