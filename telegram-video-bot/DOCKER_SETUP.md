# 🐳 Docker Setup - Video Downloader API

**Creative Design Platform** - Professional Docker configuration for Video Downloader API

---

## 🚀 Quick Start

### 1. Build and Start

```bash
cd telegram-video-bot
docker-compose up -d video-downloader-api
```

### 2. Check Status

```bash
docker-compose ps
docker logs -f creative-design-video-api
```

### 3. Test API

```bash
curl http://localhost:8000/api/health
```

### 4. Open API Docs

http://localhost:8000/api/docs

---

## 📦 Services

| Service | Container Name | Port | Description |
|---------|---------------|------|-------------|
| Video Downloader API | `creative-design-video-api` | 8000 | FastAPI + yt-dlp + FFmpeg |
| Telegram Bot API | `creative-design-telegram-api` | 8081 | Official Telegram Bot Server |

---

## 🔧 Commands

### Start All Services
```bash
docker-compose up -d
```

### Start Video Downloader Only
```bash
docker-compose up -d video-downloader-api
```

### Stop All Services
```bash
docker-compose down
```

### Rebuild Image
```bash
docker-compose build --no-cache
```

### View Logs
```bash
docker logs -f creative-design-video-api
```

### Restart Service
```bash
docker-compose restart video-downloader-api
```

### Remove Everything
```bash
docker-compose down -v --rmi all
```

---

## 📁 Volume Mounts

| Host Path | Container Path | Purpose |
|-----------|---------------|---------|
| `./downloads` | `/app/downloads` | Persist downloaded videos |
| `./cookies.txt` | `/app/cookies.txt` | YouTube authentication (optional) |

---

## 🎯 Testing

### Extract Video Info
```bash
curl -X POST http://localhost:8000/api/extract \
  -H "Content-Type: application/json" \
  -d '{"url": "https://youtube.com/watch?v=..."}'
```

### Download Video
```bash
curl -X POST http://localhost:8000/api/download \
  -H "Content-Type: application/json" \
  -d '{"url": "https://youtube.com/watch?v=...", "type": "video", "quality": "720p"}'
```

### Download Audio (MP3)
```bash
curl -X POST http://localhost:8000/api/download \
  -H "Content-Type: application/json" \
  -d '{"url": "https://youtube.com/watch?v=...", "type": "audio"}'
```

---

## 🔑 Features

✅ **Pre-installed FFmpeg** - Video/audio merge support  
✅ **yt-dlp Latest** - 1000+ site support  
✅ **Volume Persistence** - Downloads survive container restarts  
✅ **Health Checks** - Automatic monitoring  
✅ **Production Ready** - Optimized for deployment  
✅ **Cookie Support** - YouTube authentication (mount cookies.txt)  
✅ **Auto Restart** - Survives crashes  

---

## 🌐 Production Deployment

### With HTTPS (Nginx Reverse Proxy)

```nginx
server {
    listen 443 ssl;
    server_name api.creative-design.uz;

    ssl_certificate /etc/letsencrypt/live/api.creative-design.uz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.creative-design.uz/privkey.pem;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Docker Compose Production Example

```yaml
version: '3.8'

services:
  video-downloader-api:
    build: .
    restart: always
    ports:
      - "8000:8000"
    volumes:
      - /var/data/downloads:/app/downloads
      - /var/data/cookies.txt:/app/cookies.txt:ro
    environment:
      - PYTHONUNBUFFERED=1
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
```

---

## 🐛 Troubleshooting

### Container Won't Start
```bash
docker-compose build --no-cache
docker-compose up -d
```

### Download Fails
```bash
# Check logs
docker logs creative-design-video-api

# Check if FFmpeg is available
docker exec creative-design-video-api ffmpeg -version

# Check cookies
docker exec creative-design-video-api ls -la /app/cookies.txt
```

### Out of Disk Space
```bash
# Clean old containers
docker system prune -af

# Check volume size
du -sh ./downloads
```

### Update yt-dlp
```bash
docker-compose down
# Edit requirements.txt with new version
docker-compose build --no-cache
docker-compose up -d
```

---

## 📊 Monitoring

### Check Health
```bash
docker inspect --format='{{.State.Health.Status}}' creative-design-video-api
```

### Resource Usage
```bash
docker stats creative-design-video-api
```

### View All Logs
```bash
docker-compose logs -f
```

---

## 🔐 Security

✅ **Non-root User** - Runs as regular user in production  
✅ **Read-only Cookies** - Mounted as read-only volume  
✅ **No Sensitive Data** - No hardcoded credentials in image  
✅ **Regular Updates** - Keep base image updated  

---

## 📝 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PYTHONUNBUFFERED` | `1` | Enable Python output buffering |
| `TELEGRAM_API_ID` | - | Telegram API ID (for bot) |
| `TELEGRAM_API_HASH` | - | Telegram API Hash (for bot) |

---

## 🎯 Next Steps

1. ✅ Add `cookies.txt` for better YouTube support
2. ✅ Configure Nginx reverse proxy for production
3. ✅ Set up monitoring (Prometheus + Grafana)
4. ✅ Add rate limiting
5. ✅ Configure backup for downloads

---

**Docker Version:** 3.8  
**Base Image:** python:3.12-slim  
**FFmpeg:** Latest from Debian repos  
**yt-dlp:** Latest from requirements.txt
