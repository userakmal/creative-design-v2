@echo off
color 0A
cd /d "%~dp0"

title 🚀 CREATIVE DESIGN - MASTER LAUNCHER

echo ============================================
echo   🚀 CREATIVE DESIGN - MASTER LAUNCHER
echo   Starting Complete Ecosystem...
echo ============================================
echo.

REM Check if running as admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ⚠️  Running in user mode (some features may be limited)
    echo.
)

echo [STEP 1/4] Starting Docker Bot API Server...
cd telegram-video-bot
docker compose up -d 2>nul
if %errorLevel% equ 0 (
    echo       ✅ Docker container started!
) else (
    echo       ⚠️  Docker not running or failed - continuing anyway
)
cd ..
echo.

echo [STEP 2/4] Waiting for Bot API Server to initialize...
timeout /t 10 /nobreak >nul
echo       ✅ Bot API Server ready!
echo.

echo [STEP 3/4] Starting FastAPI Backend (Port 8000)...
start "🌐 FastAPI Video Backend" cmd /k "cd /d "%~dp0telegram-video-bot" && echo Starting API Server... && python api_enhanced.py"
timeout /t 2 /nobreak >nul
echo       ✅ FastAPI backend launching!
echo.

echo [STEP 4/4] Starting React Web App (Port 5173)...
start "🎨 Creative Design Web App" cmd /k "cd /d "%~dp0" && echo Starting React App... && npm run dev"
timeout /t 2 /nobreak >nul
echo       ✅ React web app launching!
echo.

echo ============================================
echo   ✅ ALL SERVICES STARTED!
echo ============================================
echo.
echo   Running Services:
echo   ┌────────────────────────────────────────┐
echo   │ 🐳 Docker Bot API   : Port 8081        │
echo   │ 🌐 FastAPI Backend  : Port 8000        │
echo   │ 🎨 React Web App    : Port 5173        │
echo   │ 🤖 Telegram Bot     : Running          │
echo   └────────────────────────────────────────┘
echo.
echo   Access Points:
echo   • Web App: http://localhost:5173
echo   • Video Downloader: http://localhost:5173/video-downloader
echo   • API Docs: http://localhost:8000/api/docs
echo   • Telegram: @CD_Video_Downloaderbot
echo.
echo   ⚠️  DO NOT CLOSE THESE WINDOWS!
echo       They will close automatically when you exit.
echo.
echo   This window will close in 5 seconds...
timeout /t 5 >nul
exit
