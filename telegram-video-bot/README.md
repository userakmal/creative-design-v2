# 🎬 Telegram Video Downloader Bot

A production-ready, advanced Telegram bot for downloading videos from any platform with smart caching and 2GB upload support.

## ✨ Features

### Core Capabilities
- **Universal URL Support**: Download from YouTube, Instagram, TikTok, Twitter/X, Facebook, Vimeo, and 1000+ more sites via `yt-dlp`
- **HLS Stream Processing**: Native `.m3u8` stream download and compilation to MP4 using `ffmpeg`
- **Smart File ID Caching**: Instant responses for previously downloaded videos via SQLite/Redis caching
- **2GB Upload Support**: Configured for Telegram Local Bot API Server to bypass 50MB limit
- **Fully Asynchronous**: Non-blocking operations using `aiogram v3` and async subprocesses

### Advanced Features
- **Cache Hit Optimization**: Cached videos are sent instantly using Telegram's `file_id` - no re-download
- **Automatic Cleanup**: Local files deleted after successful upload to save disk space
- **Progress Tracking**: Real-time download/upload progress updates
- **Error Handling**: Graceful handling of dead links, size limits, and processing errors
- **Statistics Dashboard**: Track downloads, cache performance, and bot uptime

## 📁 Project Structure

```
telegram-video-bot/
├── bot.py              # Main bot with aiogram v3 handlers
├── config.py           # Environment-based configuration
├── database.py         # SQLite/Redis cache backend
├── downloader.py       # yt-dlp and ffmpeg integration
├── models.py           # Data models and enums
├── utils.py            # Helper functions
├── requirements.txt    # Python dependencies
├── .env.example        # Environment template
└── README.md           # This file
```

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+ (for Local Bot API Server, optional)
- FFmpeg installed and in PATH

### Installation

1. **Clone and setup:**
```bash
cd telegram-video-bot
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. **Install FFmpeg:**

**Windows:**
```bash
# Using winget
winget install Gyan.FFmpeg

# Or download from: https://ffmpeg.org/download.html
```

**Linux:**
```bash
sudo apt install ffmpeg  # Debian/Ubuntu
sudo dnf install ffmpeg  # Fedora
```

**macOS:**
```bash
brew install ffmpeg
```

3. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your settings
```

4. **Get Bot Token:**
   - Message [@BotFather](https://t.me/BotFather) on Telegram
   - Send `/newbot` and follow instructions
   - Copy the token to `.env`

5. **Run the bot:**
```bash
python bot.py
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TELEGRAM_BOT_TOKEN` | **Required** Bot token from @BotFather | - |
| `TELEGRAM_API_SERVER` | Local API server URL for 2GB uploads | `None` |
| `DB_TYPE` | Cache backend: `sqlite` or `redis` | `sqlite` |
| `SQLITE_DB_PATH` | SQLite database file | `cache.db` |
| `CACHE_TTL` | Cache expiration (seconds) | `604800` (7 days) |
| `MAX_FILE_SIZE` | Max upload size in bytes | `2147483648` (2GB) |
| `DOWNLOAD_DIR` | Temporary download directory | `downloads` |
| `ENABLE_HLS_PROCESSING` | Enable .m3u8 stream handling | `true` |

### Local Bot API Server (2GB Uploads)

To enable files larger than 50MB, set up a Local Bot API Server:

```bash
# Clone Telegram source
git clone https://github.com/tdorgachev/telegram-bot-api.git
cd telegram-bot-api

# Build
mkdir build && cd build
cmake ..
make

# Run with your bot token
./telegram-bot-api --api-id=YOUR_API_ID --api-hash=YOUR_API_HASH --server=0.0.0.0 --port=8081
```

Then in `.env`:
```
TELEGRAM_API_SERVER=http://localhost:8081
MAX_FILE_SIZE=2147483648
```

## 📖 Usage

### Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Start the bot and see welcome message |
| `/help` | Show usage instructions |
| `/stats` | View bot statistics |
| `/cache` | Show cache information |

### Downloading Videos

1. Send any video URL to the bot
2. Bot checks cache first (instant if cached!)
3. Downloads and processes the video
4. Uploads to Telegram with metadata caption
5. Caches `file_id` for future instant access

### Supported Platforms

- **Video**: YouTube, Vimeo, Dailymotion, Twitch
- **Social**: Instagram, TikTok, Twitter/X, Facebook, Reddit
- **Direct**: Any `.m3u8` HLS stream URL
- **More**: 1000+ sites via yt-dlp

## 🏗 Architecture

### Cache System

```
URL Received
    │
    ▼
Hash URL (SHA-256)
    │
    ▼
Check Cache ──────► Hit ──────► Send file_id (instant!)
    │
    ▼
Miss
    │
    ▼
Download Video
    │
    ▼
Upload to Telegram
    │
    ▼
Capture file_id
    │
    ▼
Store in Cache
    │
    ▼
Delete Local File
```

### Download Pipeline

1. **URL Validation** - Check format and supported domains
2. **Info Extraction** - Get metadata via yt-dlp
3. **Size Validation** - Ensure within limits
4. **HLS Detection** - Identify .m3u8 streams
5. **Download/Process** - yt-dlp or ffmpeg for HLS
6. **Upload** - Send to Telegram with progress
7. **Cache** - Store file_id for future
8. **Cleanup** - Remove local file

## 🛠 Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| `VideoTooLargeError` | File exceeds MAX_FILE_SIZE | Use Local API Server or reduce quality |
| `InvalidURLError` | Unsupported or dead link | Check URL validity |
| `HLSProcessingError` | FFmpeg processing failed | Ensure FFmpeg is installed |
| `DownloadError` | Network or platform issue | Retry or check platform support |

## 📊 Monitoring

### Statistics (`/stats`)

- Total downloads
- Cache hits/misses
- Cache hit rate percentage
- Cached entries count
- Total cache size
- Bot uptime

### Logs

Logs are written to `bot.log` with rotation:
- Max size: 10MB
- Retention: 7 days
- Compression: ZIP

## 🔐 Security Notes

- Bot token stored in `.env` (never commit!)
- Input validation on all URLs
- File size limits enforced
- Temporary files cleaned after upload
- No user data persistence beyond cache

## 📝 License

MIT License - See LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Run tests
5. Submit PR

## 📧 Support

For issues or questions, open an issue on GitHub.

---

**Built with:** aiogram v3 | yt-dlp | ffmpeg | SQLite/Redis | asyncio
