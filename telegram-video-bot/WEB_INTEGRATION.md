# Video Downloader API - Web Integration Guide

Complete guide for integrating the Video Downloader API into your React frontend at https://creative-design.uz/video-downloader

---

## 🚀 Quick Start

### 1. API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/extract` | POST | Extract video info and available qualities |
| `/api/download` | POST | Download video (returns direct URL or file) |
| `/api/download/{task_id}` | GET | Serve downloaded file |
| `/api/health` | GET | Health check |

### 2. Base URL

**Production:**
```
https://creative-design.uz/api
```

**Development:**
```
http://localhost:8000/api
```

---

## 📦 React Integration Example

### Using Fetch API

```tsx
// hooks/useVideoDownloader.ts
import { useState } from 'react';

interface VideoFormat {
  format_id: string;
  quality: string;
  height: number | null;
  filesize: number | null;
  filesize_formatted: string;
  ext: string;
  url?: string;
}

interface VideoInfo {
  success: boolean;
  title: string;
  thumbnail: string | null;
  duration: number | null;
  duration_formatted: string;
  uploader: string | null;
  formats: VideoFormat[];
  is_live: boolean;
}

interface DownloadResult {
  success: boolean;
  download_type: 'direct' | 'file';
  direct_url?: string;
  file_path?: string;
  filename?: string;
  message: string;
}

export function useVideoDownloader() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

  // Extract video information
  const extractVideo = async (url: string): Promise<VideoInfo | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to extract video');
      }

      const data: VideoInfo = await response.json();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Download video
  const downloadVideo = async (
    url: string,
    quality?: string
  ): Promise<DownloadResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, quality: quality || 'best' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Download failed');
      }

      const data: DownloadResult = await response.json();

      // Handle direct download (browser downloads directly)
      if (data.download_type === 'direct' && data.direct_url) {
        window.open(data.direct_url, '_blank');
      }

      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Download file from server (for merged videos)
  const downloadFile = async (task_id: string, filename: string) => {
    const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
    
    const link = document.createElement('a');
    link.href = `${API_BASE}/download/${task_id}`;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    loading,
    error,
    extractVideo,
    downloadVideo,
    downloadFile,
  };
}
```

### Using Axios (Recommended)

```tsx
// services/videoDownloader.ts
import axios, { AxiosInstance } from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 2 minute timeout for large downloads
});

export interface VideoFormat {
  format_id: string;
  quality: string;
  height: number | null;
  filesize: number | null;
  filesize_formatted: string;
  ext: string;
  url?: string;
}

export interface VideoInfo {
  success: boolean;
  title: string;
  thumbnail: string | null;
  duration: number | null;
  duration_formatted: string;
  uploader: string | null;
  formats: VideoFormat[];
  is_live: boolean;
}

export interface DownloadResult {
  success: boolean;
  download_type: 'direct' | 'file';
  direct_url?: string;
  file_path?: string;
  filename?: string;
  message: string;
}

export const videoDownloader = {
  // Extract video information
  async extract(url: string): Promise<VideoInfo> {
    const response = await api.post<VideoInfo>('/extract', { url });
    return response.data;
  },

  // Download video
  async download(url: string, quality?: string): Promise<DownloadResult> {
    const response = await api.post<DownloadResult>('/download', {
      url,
      quality: quality || 'best',
    });
    return response.data;
  },

  // Trigger browser download for direct URL
  triggerDirectDownload(url: string) {
    window.open(url, '_blank');
  },

  // Download file from server
  triggerFileDownload(taskId: string, filename: string) {
    const link = document.createElement('a');
    link.href = `${API_BASE}/download/${taskId}`;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};
```

---

## 🎨 React Component Example

```tsx
// components/VideoDownloader.tsx
import React, { useState } from 'react';
import { videoDownloader, VideoInfo, VideoFormat } from '../services/videoDownloader';

export const VideoDownloader: React.FC = () => {
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const info = await videoDownloader.extract(url);
      setVideoInfo(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract video');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (format: VideoFormat) => {
    try {
      const result = await videoDownloader.download(url, format.quality);
      
      if (result.download_type === 'direct' && result.direct_url) {
        videoDownloader.triggerDirectDownload(result.direct_url);
      } else if (result.file_path && result.filename) {
        // Extract task_id from file_path
        const taskId = result.file_path.split('/').pop()?.split('_')[0] || '';
        videoDownloader.triggerFileDownload(taskId, result.filename);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    }
  };

  return (
    <div className="video-downloader">
      <form onSubmit={handleExtract}>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste video URL (YouTube, Instagram, TikTok...)"
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Extracting...' : 'Get Video'}
        </button>
      </form>

      {error && <div className="error">{error}</div>}

      {videoInfo && (
        <div className="video-info">
          <h3>{videoInfo.title}</h3>
          
          {videoInfo.thumbnail && (
            <img src={videoInfo.thumbnail} alt={videoInfo.title} />
          )}

          <div className="meta">
            {videoInfo.duration_formatted && (
              <span>⏱️ {videoInfo.duration_formatted}</span>
            )}
            {videoInfo.uploader && <span>👤 {videoInfo.uploader}</span>}
          </div>

          <div className="formats">
            <h4>Available Qualities:</h4>
            {videoInfo.formats.map((format) => (
              <button
                key={format.format_id}
                onClick={() => handleDownload(format)}
                className="format-btn"
              >
                📹 {format.quality}
                {format.filesize_formatted !== 'Unknown' && (
                  <span> ({format.filesize_formatted})</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
```

---

## 🔧 Environment Variables

Create `.env` file in your React project:

```env
# Development
REACT_APP_API_URL=http://localhost:8000/api

# Production
# REACT_APP_API_URL=https://creative-design.uz/api
```

---

## 🚀 Start API Server

### Development Mode (Auto-Reload)

```bash
cd telegram-video-bot
python api.py
```

Or with uvicorn directly:

```bash
uvicorn api:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode

```bash
uvicorn api:app --host 0.0.0.0 --port 8000 --workers 4
```

### With Gunicorn (Recommended for Production)

```bash
pip install gunicorn
gunicorn api:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

---

## 📝 API Response Examples

### Extract Response

```json
{
  "success": true,
  "title": "Amazing Video Title",
  "thumbnail": "https://i.ytimg.com/vi/xxx/maxresdefault.jpg",
  "duration": 180,
  "duration_formatted": "3:00",
  "uploader": "Channel Name",
  "formats": [
    {
      "format_id": "134",
      "quality": "360p",
      "height": 360,
      "filesize": 5242880,
      "filesize_formatted": "5.0 MB",
      "ext": "mp4"
    },
    {
      "format_id": "136",
      "quality": "720p",
      "height": 720,
      "filesize": 15728640,
      "filesize_formatted": "15.0 MB",
      "ext": "mp4"
    }
  ],
  "is_live": false
}
```

### Download Response (Direct)

```json
{
  "success": true,
  "download_type": "direct",
  "direct_url": "https://scontent.cdninstagram.com/v/t50.2886-16/...",
  "filename": "instagram_video.mp4",
  "message": "Direct download URL generated. Your browser will download the file."
}
```

### Download Response (File)

```json
{
  "success": true,
  "download_type": "file",
  "file_path": "/path/to/downloads/abc123_video.mp4",
  "filename": "video.mp4",
  "message": "File ready for download"
}
```

---

## ⚠️ Important Notes

1. **CORS**: API only accepts requests from:
   - `https://creative-design.uz`
   - `http://localhost:3000`
   - `http://127.0.0.1:3000`

2. **File Cleanup**: Downloaded files are automatically deleted after 1 hour

3. **Timeout**: Default timeout is 2 minutes for large downloads

4. **Cookies**: Ensure `cookies.txt` exists in the bot directory for YouTube downloads

5. **FFmpeg**: Required for merging video+audio (YouTube 1080p+)

---

## 🧪 Testing

### Test with cURL

```bash
# Extract
curl -X POST http://localhost:8000/api/extract \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'

# Download
curl -X POST http://localhost:8000/api/download \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "quality": "720p"}'

# Health Check
curl http://localhost:8000/api/health
```

### Test with Browser

Open API docs: http://localhost:8000/api/docs

---

## 📞 Support

For issues or questions, check the API logs:
```bash
tail -f api.log
```
