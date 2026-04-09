# Creative Design Platform

A modern platform for video invitations, design showcases, and media management with AI-powered features.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+ (optional, for Telegram bot)

### Installation

```bash
# Install dependencies
npm install

# Start the application (Web App + Upload Server)
npm start

# Or run development mode only
npm run dev

# Run upload server separately
npm run server
```

Alternatively, on Windows:
```bash
run.bat
```

## 📁 Project Structure

```
creative-design-platform/
├── 📱 Frontend
│   ├── index.tsx                 # Application entry point
│   ├── routes.tsx                # React Router configuration
│   ├── config.ts                 # App configuration
│   ├── types.ts                  # TypeScript type definitions
│   ├── index.css                 # Global styles
│   ├── index.html                # HTML template
│   │
│   ├── pages/                    # React page components
│   │   ├── main.page.tsx         # Home page
│   │   ├── templates.page.tsx    # Design templates
│   │   ├── downloader.page.tsx   # Video downloader
│   │   ├── music.page.tsx        # Music library
│   │   ├── admin.page.tsx        # Admin panel
│   │   └── custom.page.tsx       # Custom orders
│   │
│   ├── components/               # Reusable components
│   ├── data/                     # Static data (JSON)
│   └── public/                   # Static assets
│       ├── videos/               # Video files
│       ├── image/                # Image files
│       ├── music/                # Music files
│       └── logo/                 # Logo files
│
├── 🔧 Backend
│   ├── upload-server.js          # Express upload server (port 3001)
│   ├── admin-server.js           # Admin API server
│   │
│   └── telegram-video-bot/       # Telegram Bot & API
│       ├── bot.py                # Telegram bot (aiogram v3)
│       ├── api.py                # FastAPI video API
│       ├── config.py             # Bot configuration
│       ├── downloader.py         # yt-dlp downloader
│       ├── database.py           # SQLite cache
│       └── handlers/             # Bot handlers
│
└── 📝 Config
    ├── package.json              # Node.js dependencies
    ├── tsconfig.json             # TypeScript configuration
    ├── vite.config.ts            # Vite bundler config
    └── .env.example              # Environment variables template
```

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **React Router 7** - Client-side routing
- **Lucide React** - Icon library

### Backend
- **Express.js 5** - Node.js web framework
- **Multer** - File upload handling
- **CORS** - Cross-origin resource sharing

### Telegram Bot
- **Python aiogram v3** - Async Telegram bot framework
- **FastAPI** - Python API framework
- **yt-dlp** - Video downloading library

## 🌐 Services

| Service | Port | URL |
|---------|------|-----|
| Web App | 5173 | http://localhost:5173 |
| Admin Panel | 5173 | http://localhost:5173/admin |
| Video Downloader | 5173 | http://localhost:5173/video-downloader |
| Upload Server | 3001 | http://localhost:3001 |
| Video API | 8000 | http://localhost:8000/api/docs |

## 📦 Available Scripts

- `npm start` - Start web app + upload server
- `npm run dev` - Start development server
- `npm run server` - Start upload server only
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Type check with TypeScript

## 🚀 Deployment

Media files are hosted at: `https://creative-design.uz/media/`

To upload new media:
```bash
node upload-to-hosting.js
```

See hosting documentation for FTP credentials.

## 🔐 Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Key variables:
- `PORT` - Web app port (default: 5173)
- `UPLOAD_SERVER_PORT` - Upload server port (default: 3001)
- `TELEGRAM_BOT_TOKEN` - Telegram bot token
- `GOOGLE_AI_API_KEY` - Google AI (Gemini) API key

## 📝 Development Guidelines

1. **Type Safety**: All code must be properly typed
2. **Error Handling**: Use try-catch blocks and error boundaries
3. **Code Style**: Follow existing naming conventions
4. **Commits**: Write clear, descriptive commit messages
5. **Testing**: Test features before committing

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

Private project - All rights reserved
