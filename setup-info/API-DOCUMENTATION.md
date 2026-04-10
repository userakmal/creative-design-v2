# API DOCUMENTATION

## 🌐 API Server Reference

**Base URL:** http://localhost:3001

---

## Health & Status Endpoints

### GET /api/health

Check server health and basic stats.

**Request:**
```
GET /api/health
```

**Response (200 OK):**
```json
{
  "status": "ok",
  "message": "🚀 Upload server ishlamoqda",
  "stats": {
    "videos": 5,
    "music": 3
  },
  "uptime": "3600s"
}
```

---

### GET /api/stats

Get detailed server statistics.

**Request:**
```
GET /api/stats
```

**Response (200 OK):**
```json
{
  "videos": 5,
  "music": 3,
  "files": {
    "videos": 5,
    "images": 5,
    "music": 3
  },
  "diskUsage": "125.3 MB",
  "lastVideoUpload": "Dizayn 1",
  "lastMusicUpload": "Choli Qushi - Acoustic"
}
```

---

## Video Endpoints

### GET /api/videos

Get all uploaded videos.

**Request:**
```
GET /api/videos
```

**Response (200 OK):**
```json
[
  {
    "id": 1001,
    "title": "To'y Taklifnomasi",
    "image": "/image/i_1234567890.jpg",
    "videoUrl": "/videos/v_1234567890.mp4",
    "uploadedAt": "2026-04-10T12:00:00.000Z",
    "size": "15.2 MB"
  }
]
```

**Response (500 Error):**
```json
{
  "error": "Videolarni o'qishda xatolik"
}
```

---

### POST /api/upload

Upload a new video with thumbnail.

**Request:**
```
POST /api/upload
Content-Type: multipart/form-data
```

**FormData:**
```
title: "Video Name"
video: <File> (video file)
image: <File> (thumbnail image)
password: "creative2026"
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "\"To'y Taklifnomasi\" muvaffaqiyatli yuklandi!",
  "data": {
    "id": 1001,
    "title": "To'y Taklifnomasi",
    "image": "/image/i_1234567890.jpg",
    "videoUrl": "/videos/v_1234567890.mp4",
    "uploadedAt": "2026-04-10T12:00:00.000Z",
    "size": "15.2 MB"
  },
  "totalVideos": 6
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Parol noto'g'ri"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Video va rasm fayllarini yuklang"
}
```

**Supported Formats:**
- **Video:** MP4, MOV, AVI, MKV, WEBM
- **Image:** JPG, JPEG, PNG, WEBP, GIF, BMP
- **Max Size:** 500MB

---

### DELETE /api/videos/:id

Delete a video by ID.

**Request:**
```
DELETE /api/videos/1001
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "\"To'y Taklifnomasi\" o'chirildi",
  "deletedId": 1001,
  "totalVideos": 5
}
```

**Response (404 Not Found):**
```json
{
  "error": "Video topilmadi"
}
```

---

### PUT /api/videos/:id

Update video information (rename).

**Request:**
```
PUT /api/videos/1001
Content-Type: application/json

{
  "title": "New Video Name"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Nom o'zgartirildi",
  "data": {
    "id": 1001,
    "title": "New Video Name",
    "image": "/image/i_1234567890.jpg",
    "videoUrl": "/videos/v_1234567890.mp4"
  }
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Nom kiritish kerak"
}
```

---

## Music Endpoints

### GET /api/music

Get all uploaded music.

**Request:**
```
GET /api/music
```

**Response (200 OK):**
```json
[
  {
    "id": 1001,
    "title": "Choli Qushi - Acoustic",
    "author": "Turkish Vibe",
    "duration": "0:35",
    "url": "/music/m_1234567890.m4a",
    "uploadedAt": "2026-04-10T12:00:00.000Z",
    "size": "2.1 MB"
  }
]
```

---

### POST /api/upload-music

Upload a new music file.

**Request:**
```
POST /api/upload-music
Content-Type: multipart/form-data
```

**FormData:**
```
title: "Music Name"
author: "Artist Name"
music: <File> (audio file)
password: "creative2026"
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "\"Choli Qushi - Acoustic\" muvaffaqiyatli yuklandi!",
  "data": {
    "id": 1001,
    "title": "Choli Qushi - Acoustic",
    "author": "Turkish Vibe",
    "duration": "0:00",
    "url": "/music/m_1234567890.m4a",
    "uploadedAt": "2026-04-10T12:00:00.000Z",
    "size": "2.1 MB"
  },
  "totalMusic": 4
}
```

**Supported Formats:**
- MP3, M4A, WAV, OGG, AAC, FLAC
- **Max Size:** 500MB

---

### DELETE /api/music/:id

Delete music by ID.

**Request:**
```
DELETE /api/music/1001
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "\"Choli Qushi - Acoustic\" o'chirildi",
  "deletedId": 1001,
  "totalMusic": 3
}
```

---

### PUT /api/music/:id

Update music information.

**Request:**
```
PUT /api/music/1001
Content-Type: application/json

{
  "title": "New Title",
  "author": "New Artist"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Musiqa yangilandi",
  "data": {
    "id": 1001,
    "title": "New Title",
    "author": "New Artist"
  }
}
```

---

## Static File Access

Uploaded files are served statically:

- **Videos:** http://localhost:3001/videos/{filename}
- **Images:** http://localhost:3001/image/{filename}
- **Music:** http://localhost:3001/music/{filename}
- **Data:** http://localhost:3001/data/{filename}

---

## Error Handling

### Common HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Upload successful |
| 400 | Bad Request | Missing fields, invalid format |
| 401 | Unauthorized | Wrong password |
| 404 | Not Found | Video/music not found |
| 413 | File Too Large | Exceeds 500MB limit |
| 500 | Server Error | Internal server error |

### Error Response Format

```json
{
  "error": "Error message in Uzbek"
}
```

---

## Code Examples

### JavaScript - Upload Video

```javascript
const formData = new FormData();
formData.append('title', 'My Video');
formData.append('video', videoFile);
formData.append('image', thumbnailFile);
formData.append('password', 'creative2026');

const response = await fetch('http://localhost:3001/api/upload', {
  method: 'POST',
  body: formData
});

const data = await response.json();
console.log(data);
```

### JavaScript - Get Videos

```javascript
const response = await fetch('http://localhost:3001/api/videos');
const videos = await response.json();
console.log(videos);
```

### JavaScript - Delete Video

```javascript
const response = await fetch('http://localhost:3001/api/videos/1001', {
  method: 'DELETE'
});

const data = await response.json();
console.log(data);
```

### Python - Upload Music

```python
import requests

files = {
    'music': open('song.mp3', 'rb')
}
data = {
    'title': 'Song Title',
    'author': 'Artist Name',
    'password': 'creative2026'
}

response = requests.post(
    'http://localhost:3001/api/upload-music',
    files=files,
    data=data
)

print(response.json())
```

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3001 | Server port |
| ADMIN_PASSWORD | creative2026 | Upload password |

### Change Password

Edit `api-server/upload-server.js`:
```javascript
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'your-new-password';
```

Or set environment variable:
```bash
set ADMIN_PASSWORD=your-new-password
npm start
```

---

## Rate Limiting

Currently, **no rate limiting** is implemented. All requests are processed immediately.

---

## CORS Configuration

CORS is enabled for **all origins**:
```javascript
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

---

**API Version:** 1.0.0
**Last Updated:** April 10, 2026
