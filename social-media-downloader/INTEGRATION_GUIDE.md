# 🔗 Integration Guide

Complete guide for integrating the Social Media Downloader API with your frontend or existing backend.

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│  FastAPI Server  │────▶│   yt-dlp        │
│   (React/Vue)   │     │  (Python)        │     │   (Downloader)  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │  Social Media    │
                        │  (Instagram,     │
                        │   TikTok, etc.)  │
                        └──────────────────┘
```

## Flow

1. **Frontend** sends URL to API
2. **FastAPI** validates and passes to yt-dlp
3. **yt-dlp** extracts video info or downloads file
4. **API** returns result to frontend
5. **Frontend** displays or downloads video

---

## Frontend Integration

### React Example

```jsx
// components/VideoDownloader.jsx
import React, { useState } from 'react';

const API_URL = 'http://localhost:8000';

export function VideoDownloader() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoInfo, setVideoInfo] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

  // Extract video info
  const handleExtract = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, quality: 'best', format: 'mp4' }),
      });

      const data = await response.json();

      if (data.success) {
        setVideoInfo(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  // Download video
  const handleDownload = async () => {
    setDownloading(true);
    setError(null);

    try {
      // Start download
      const response = await fetch(`${API_URL}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, quality: 'best', format: 'mp4' }),
      });

      const data = await response.json();

      if (data.success) {
        // Get file
        const fileResponse = await fetch(`${API_URL}/file/${data.data.filename}`);
        const blob = await fileResponse.blob();

        // Create download link
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = data.data.filename;
        a.click();

        URL.revokeObjectURL(downloadUrl);

        // Clean up server file
        await fetch(`${API_URL}/file/${data.data.filename}`, {
          method: 'DELETE',
        });

        alert('Download complete!');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Download failed');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="video-downloader">
      <form onSubmit={handleExtract}>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste video URL..."
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Extracting...' : 'Get Video'}
        </button>
      </form>

      {error && <div className="error">{error}</div>}

      {videoInfo && (
        <div className="video-info">
          <h3>{videoInfo.title}</h3>
          <p>Platform: {videoInfo.platform}</p>
          <p>Uploader: {videoInfo.uploader}</p>
          {videoInfo.thumbnail && (
            <img src={videoInfo.thumbnail} alt="Thumbnail" />
          )}
          <button onClick={handleDownload} disabled={downloading}>
            {downloading ? 'Downloading...' : 'Download'}
          </button>
        </div>
      )}
    </div>
  );
}
```

### Vue Example

```vue
<!-- components/VideoDownloader.vue -->
<template>
  <div class="video-downloader">
    <form @submit.prevent="extractVideo">
      <input
        v-model="url"
        type="url"
        placeholder="Paste video URL..."
      />
      <button :disabled="loading">
        {{ loading ? 'Extracting...' : 'Get Video' }}
      </button>
    </form>

    <div v-if="error" class="error">{{ error }}</div>

    <div v-if="videoInfo" class="video-info">
      <h3>{{ videoInfo.title }}</h3>
      <p>Platform: {{ videoInfo.platform }}</p>
      <p>Uploader: {{ videoInfo.uploader }}</p>
      <img v-if="videoInfo.thumbnail" :src="videoInfo.thumbnail" />
      <button @click="downloadVideo" :disabled="downloading">
        {{ downloading ? 'Downloading...' : 'Download' }}
      </button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      url: '',
      loading: false,
      downloading: false,
      videoInfo: null,
      error: null,
    };
  },
  methods: {
    async extractVideo() {
      this.loading = true;
      this.error = null;

      try {
        const response = await fetch('http://localhost:8000/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: this.url, quality: 'best' }),
        });

        const data = await response.json();

        if (data.success) {
          this.videoInfo = data.data;
        } else {
          this.error = data.message;
        }
      } catch (err) {
        this.error = 'Failed to connect to server';
      } finally {
        this.loading = false;
      }
    },

    async downloadVideo() {
      this.downloading = true;
      this.error = null;

      try {
        const response = await fetch('http://localhost:8000/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: this.url, quality: 'best' }),
        });

        const data = await response.json();

        if (data.success) {
          // Get file
          const fileResponse = await fetch(
            `http://localhost:8000/file/${data.data.filename}`
          );
          const blob = await fileResponse.blob();

          // Download
          const downloadUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = data.data.filename;
          a.click();
          URL.revokeObjectURL(downloadUrl);

          // Cleanup
          await fetch(`http://localhost:8000/file/${data.data.filename}`, {
            method: 'DELETE',
          });
        } else {
          this.error = data.message;
        }
      } catch (err) {
        this.error = 'Download failed';
      } finally {
        this.downloading = false;
      }
    },
  },
};
</script>
```

### Vanilla JavaScript

```javascript
class VideoDownloader {
  constructor(apiBaseUrl = 'http://localhost:8000') {
    this.apiBaseUrl = apiBaseUrl;
  }

  async extractVideo(url, quality = 'best') {
    const response = await fetch(`${this.apiBaseUrl}/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, quality }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message);
    }

    return data.data;
  }

  async downloadVideo(url, quality = 'best') {
    // Start download
    const response = await fetch(`${this.apiBaseUrl}/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, quality }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message);
    }

    // Get file
    const fileResponse = await fetch(
      `${this.apiBaseUrl}/file/${data.data.filename}`
    );

    if (!fileResponse.ok) {
      throw new Error('Failed to retrieve file');
    }

    const blob = await fileResponse.blob();

    // Create download
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = data.data.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);

    // Cleanup server
    await fetch(`${this.apiBaseUrl}/file/${data.data.filename}`, {
      method: 'DELETE',
    });

    return data.data;
  }

  async getPlatforms() {
    const response = await fetch(`${this.apiBaseUrl}/platforms`);
    const data = await response.json();
    return data.data.platforms;
  }
}

// Usage
const downloader = new VideoDownloader();

// Extract info
downloader
  .extractVideo('https://www.instagram.com/reel/ABC123/')
  .then((video) => console.log('Video:', video))
  .catch((err) => console.error('Error:', err));

// Download
downloader
  .downloadVideo('https://www.tiktok.com/@user/video/123')
  .then(() => console.log('Download complete!'))
  .catch((err) => console.error('Error:', err));
```

---

## Backend Integration

### Node.js/Express

```javascript
// routes/download.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

const API_URL = 'http://localhost:8000';

router.post('/extract', async (req, res) => {
  try {
    const { url, quality } = req.body;

    const response = await axios.post(`${API_URL}/extract`, {
      url,
      quality,
      format: 'mp4',
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.post('/download', async (req, res) => {
  try {
    const { url, quality } = req.body;

    // Start download
    const downloadResponse = await axios.post(`${API_URL}/download`, {
      url,
      quality,
      format: 'mp4',
    });

    const { filename } = downloadResponse.data.data;

    // Stream file to client
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const fileResponse = await axios.get(
      `${API_URL}/file/${filename}`,
      { responseType: 'stream' }
    );

    fileResponse.data.pipe(res);

    // Cleanup after sending
    fileResponse.data.on('end', async () => {
      await axios.delete(`${API_URL}/file/${filename}`);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### PHP

```php
// download.php
<?php

class VideoDownloader {
    private $apiUrl = 'http://localhost:8000';

    public function extractVideo($url, $quality = 'best') {
        $ch = curl_init($this->apiUrl . '/extract');
        
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
        ]);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
            'url' => $url,
            'quality' => $quality,
            'format' => 'mp4',
        ]));

        $response = curl_exec($ch);
        curl_close($ch);

        return json_decode($response, true);
    }

    public function downloadVideo($url, $quality = 'best') {
        // Start download
        $downloadResult = $this->extractVideo($url, $quality);
        
        if (!$downloadResult['success']) {
            return ['success' => false, 'error' => $downloadResult['message']];
        }

        // Get file
        $filename = $downloadResult['data']['filename'];
        $fileUrl = $this->apiUrl . '/file/' . $filename;

        $ch = curl_init($fileUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $fileData = curl_exec($ch);
        curl_close($ch);

        // Save locally
        file_put_contents('downloads/' . $filename, $fileData);

        // Cleanup server
        $ch = curl_init($this->apiUrl . '/file/' . $filename);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
        curl_exec($ch);
        curl_close($ch);

        return [
            'success' => true,
            'filename' => $filename,
            'path' => 'downloads/' . $filename,
        ];
    }
}

// Usage
$downloader = new VideoDownloader();

// Extract
$info = $downloader->extractVideo('https://www.instagram.com/reel/ABC123/');
echo json_encode($info);

// Download
$result = $downloader->downloadVideo('https://www.tiktok.com/@user/video/123');
echo json_encode($result);
```

---

## Docker Deployment

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Create directories
RUN mkdir -p downloads temp

# Expose port
EXPOSE 8000

# Run
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  downloader:
    build: .
    ports:
      - "8000:8000"
    volumes:
      - ./downloads:/app/downloads
      - ./cookies.txt:/app/cookies.txt
    environment:
      - DOWNLOAD_DIR=/app/downloads
      - COOKIES_FILE=/app/cookies.txt
    restart: unless-stopped
```

Run with:
```bash
docker-compose up -d
```

---

## Production Checklist

- [ ] Set up cookies for Instagram
- [ ] Configure rate limiting
- [ ] Set up file cleanup cron job
- [ ] Monitor disk usage
- [ ] Set up logging/monitoring
- [ ] Configure CORS for your frontend domain
- [ ] Add HTTPS/TLS
- [ ] Set up load balancing (if needed)
- [ ] Monitor API performance

---

**Need Help?** Check the examples in `example_usage.py` or open an issue.
