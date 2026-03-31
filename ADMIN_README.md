# Admin Panel - Video Upload Guide

## How to Use the Admin Panel

The admin panel allows you to upload new videos directly to your website online.

### Quick Start

1. **Start the development server:**
   ```bash
   npm run dev
   ```
   
   This will start both:
   - Vite frontend server (port 5173)
   - Upload backend server (port 3001)

2. **Access the admin panel:**
   - Open your browser and go to: `http://localhost:5173/admin`
   - Or from the main page, double-click the heart icon

3. **Login credentials:**
   - Username: `admin`
   - Password: `creative2026`

4. **Upload a new video:**
   - Enter a title for your video
   - Upload a thumbnail image (JPG, PNG, or WEBP)
   - Upload the video file (MP4, MOV, or WEBM)
   - Click "Videoni Yuklash va Saqlash"

### How It Works

When you upload a video:
1. The video file is saved to `public/videos/`
2. The thumbnail image is saved to `public/image/`
3. A new entry is automatically added to `data/videos.json`
4. The website automatically loads new videos from this JSON file

### File Structure

```
creative-design-main/
├── public/
│   ├── videos/          # Uploaded video files
│   └── image/           # Uploaded thumbnail images
├── data/
│   └── videos.json      # Dynamic video database
├── pages/
│   └── admin.page.tsx   # Admin panel frontend
├── upload-server.js     # Backend upload server
└── ADMIN_README.md      # This file
```

### Production Deployment

For production hosting:

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Deploy to your hosting:**
   - Upload the `dist` folder contents
   - Make sure to also upload:
     - `upload-server.js`
     - `data/videos.json`
     - `public/videos/` folder
     - `public/image/` folder

3. **Run the upload server on your hosting:**
   ```bash
   node upload-server.js
   ```
   
   Or use a process manager like PM2:
   ```bash
   pm2 start upload-server.js --name video-upload
   ```

### Troubleshooting

**Error: "Server bilan ulanishda xato"**
- Make sure the upload server is running (`npm run server`)
- Check if port 3001 is available

**Error: "Parol noto'g'ri"**
- The password must be: `creative2026`
- This is configured in both `admin.page.tsx` and `upload-server.js`

**Videos not showing up**
- Check `data/videos.json` to ensure the upload was recorded
- Clear browser cache and reload
- Check that video files exist in `public/videos/`

### Security Notes

⚠️ **Important:** This is a simple upload system. For production use:
- Change the default password
- Add proper authentication
- Use HTTPS
- Implement file size limits
- Add virus scanning for uploads

### API Endpoint

**POST** `http://localhost:3001/api/upload`

Form data:
- `title` (string): Video title
- `video` (file): Video file (mp4, mov, webm)
- `image` (file): Thumbnail image (jpg, png, webp)
- `password` (string): Upload password

Response:
```json
{
  "success": true,
  "message": "Video muvaffaqiyatli saqlandi!",
  "data": {
    "id": 49,
    "title": "My New Video",
    "image": "/image/i_1234567890.jpg",
    "videoUrl": "/videos/v_1234567890.mp4"
  }
}
```
