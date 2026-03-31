# Creative Design Platform

Full-stack creative design showcase with video downloader bot.

## Architecture

```
creative-design-main/
├── START.bat                    # 🚀 Launch all services with one click
├── STOP.bat                     # ⏹️ Stop all services
│
├── index.tsx                    # React app entry point
├── routes.tsx                   # Client-side routing
├── config.ts                    # App configuration (videos, settings)
├── index.css                    # Global styles
├── index.html                   # HTML template
├── vite.config.ts               # Vite bundler configuration
├── package.json                 # Node.js dependencies
│
├── pages/                       # React pages
│   ├── main.page.tsx            # Landing page
│   ├── templates.page.tsx       # Design templates gallery
│   ├── downloader.page.tsx      # Video downloader (web UI)
│   ├── music.page.tsx           # Music page
│   ├── custom.page.tsx          # Custom design page
│   └── admin.page.tsx           # Admin dashboard
│
├── components/                  # Shared React components
│   ├── Header.tsx
│   ├── HeroShowcase.tsx
│   ├── MenuButton.tsx
│   ├── VideoCard.tsx
│   ├── LoadingSpinner.jsx
│   └── FetchVDashboard.jsx
│
├── upload-server.js             # Express upload server (port 3001)
├── public/                      # Static assets
│
└── telegram-video-bot/          # Telegram Bot + API (Python)
    ├── bot.py                   # Main bot (aiogram v3)
    ├── api.py                   # FastAPI REST backend (port 8000)
    ├── config.py                # Environment configuration
    ├── downloader.py            # yt-dlp download engine
    ├── database.py              # SQLite/Redis cache backend
    ├── models.py                # Data models
    ├── utils.py                 # Utility functions
    ├── keyboards.py             # Telegram keyboard builders
    ├── handlers/                # Modular bot handlers
    │   ├── admin.py             # Admin commands
    │   ├── language.py          # Language selection
    │   └── quality.py           # YouTube quality selector
    ├── locales/                 # Translations (uz, ru, en)
    ├── .env                     # Bot environment variables
    ├── requirements.txt         # Python dependencies
    └── cookies.txt              # YouTube auth cookies
```

## Quick Start

### One-Click Launch
```
START.bat
```
This will:
1. Check Node.js, Python, FFmpeg
2. Install dependencies (first run only)
3. Start all 4 services in parallel

### Manual Start (individual services)

**Frontend (Vite):**
```bash
npm run dev
```

**Telegram Bot:**
```bash
cd telegram-video-bot
venv\Scripts\activate
python bot.py
```

**Video API:**
```bash
cd telegram-video-bot
venv\Scripts\activate
python api.py
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| Vite Frontend | 5173 | React web application |
| Upload Server | 3001 | Video/image upload API |
| Video API | 8000 | yt-dlp extraction REST API |
| Telegram Bot | — | Video downloader bot |

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, React Router
- **Upload Server:** Express.js, Multer
- **Telegram Bot:** Python, aiogram v3, SQLite
- **Video API:** FastAPI, yt-dlp, FFmpeg
- **Video Engine:** yt-dlp with cookies.txt auth
