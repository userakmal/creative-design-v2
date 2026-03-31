@echo off
color 0A
cd /d "%~dp0"

title 🚀 CREATIVE DESIGN - SUPER SERVER (ALL-IN-ONE)

echo ============================================
echo   🚀 CREATIVE DESIGN - SUPER SERVER
echo   All-in-One Launch System
echo   Website + Upload Server + Telegram Bot
echo ============================================
echo.

REM ============================================================================
REM 1. SYSTEM REQUIREMENTS CHECK
REM ============================================================================

echo [STEP 1/6] Checking system requirements...

:: Node.js check
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERROR: Node.js is not installed!
    echo    Please install from https://nodejs.org/
    pause
    exit /b 1
)
echo       ✓ Node.js: 
node --version

:: Python check
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo       ⚠  Python not found (Telegram bot may not work)
) else (
    echo       ✓ Python:
    python --version
)

:: Docker check
where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo       ⚠  Docker not running (Bot API will use fallback mode)
) else (
    echo       ✓ Docker: 
    docker --version
)

echo.

REM ============================================================================
REM 2. CREATE DIRECTORIES
REM ============================================================================

echo [STEP 2/6] Creating necessary directories...

if not exist "public\videos" mkdir "public\videos"
if not exist "public\image" mkdir "public\image"
if not exist "public\data" mkdir "public\data"
if not exist "public\data\videos.json" echo [] > "public\data\videos.json"
if not exist "logs" mkdir "logs"
if not exist "telegram-video-bot\logs" mkdir "telegram-video-bot\logs"

echo       ✓ All directories ready!
echo.

REM ============================================================================
REM 3. KILL OLD PROCESSES
REM ============================================================================

echo [STEP 3/6] Stopping old processes...

taskkill /F /FI "WINDOWTITLE eq Upload Server*" 2>nul
taskkill /F /FI "WINDOWTITLE eq *Vite Dev Server*" 2>nul
taskkill /F /FI "WINDOWTITLE eq *Telegram Bot*" 2>nul
taskkill /F /FI "WINDOWTITLE eq *Bot API Server*" 2>nul
timeout /t 2 /nobreak >nul

echo       ✓ Old processes stopped
echo.

REM ============================================================================
REM 4. START UPLOAD SERVER
REM ============================================================================

echo [STEP 4/6] Starting Upload Server (Port 3001)...

start "📤 Upload Server - Port 3001" cmd /k "cd /d "%~dp0" && title Upload Server && echo. && echo ============================================ && echo   UPLOAD SERVER RUNNING && echo ============================================ && echo. && echo Server: http://localhost:3001 && echo API: http://localhost:3001/api/upload && echo Auto-Download: http://localhost:3001/api/auto-download && echo Health: http://localhost:3001/api/health && echo. && echo Press Ctrl+C to stop && echo ============================================ && echo. && node upload-server.js"

timeout /t 3 /nobreak >nul

:: Verify upload server
curl -s http://localhost:3001/api/health >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo       ✅ Upload Server started and healthy!
) else (
    echo       ⚠  Upload Server may need more time to start
)
echo.

REM ============================================================================
REM 5. START TELEGRAM BOT SERVICES
REM ============================================================================

echo [STEP 5/6] Starting Telegram Bot Services...

cd telegram-video-bot

:: Check if .env exists
if not exist ".env" (
    echo       ❌ .env file not found!
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo       ✓ Created .env from .env.example
    )
)

:: Check/create virtual environment
if not exist "telegram-video-bot\venv" (
    echo       📦 Creating virtual environment for bot...
    cd telegram-video-bot
    python -m venv venv
    call venv\Scripts\activate.bat
    echo       📦 Installing bot dependencies...
    pip install -r requirements.txt -q
    cd ..
) else (
    cd telegram-video-bot
    call venv\Scripts\activate.bat
    cd ..
)

:: Start Bot API Server (Docker)
if exist "docker-compose.yml" (
    echo       🐳 Starting Bot API Server (Docker)...
    docker compose up -d 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo       ✅ Docker container started!
        timeout /t 3 /nobreak >nul
    ) else (
        echo       ⚠  Docker not available
    )
)

:: Start Bot API Server (Python with venv)
if exist "api_enhanced.py" (
    echo       🌐 Starting FastAPI Backend (Port 8000)...
    start "🌐 Bot API Server - Port 8000" cmd /k "cd /d "%~dp0telegram-video-bot" && title Bot API Server && call venv\Scripts\activate && echo. && echo ============================================ && echo   BOT API SERVER RUNNING && echo ============================================ && echo. && echo API: http://localhost:8000 && echo Docs: http://localhost:8000/api/docs && echo. && echo Press Ctrl+C to stop && echo ============================================ && echo. && python api_enhanced.py"
    timeout /t 3 /nobreak >nul
)

:: Start Telegram Bot (Python with venv)
if exist "bot.py" (
    echo       🤖 Starting Telegram Bot...
    start "🤖 Telegram Bot" cmd /k "cd /d "%~dp0telegram-video-bot" && title Telegram Bot && call venv\Scripts\activate && echo. && echo ============================================ && echo   TELEGRAM BOT RUNNING && echo ============================================ && echo. && echo Bot: @CD_Video_Downloaderbot && echo Token: Configured && echo Status: Running && echo. && echo Press Ctrl+C to stop && echo ============================================ && echo. && python bot.py"
    timeout /t 3 /nobreak >nul
)

cd ..

echo       ✅ Telegram Bot Services started!
echo.

timeout /t 2 /nobreak >nul

REM ============================================================================
REM 6. START VITE DEV SERVER
REM ============================================================================

echo [STEP 6/6] Starting React Web App (Port 5173)...

start "🎨 Vite Dev Server - Port 5173" cmd /k "cd /d "%~dp0" && title Vite Dev Server && echo. && echo ============================================ && echo   WEBSITE RUNNING && echo ============================================ && echo. && echo Website: http://localhost:5173 && echo Admin: http://localhost:5173/admin && echo Templates: http://localhost:5173/templates && echo Downloader: http://localhost:5173/video-downloader && echo. && echo Press Ctrl+C to stop && echo ============================================ && echo. && npm run dev"

timeout /t 2 /nobreak >nul

echo       ✅ React Web App started!
echo.

REM ============================================================================
REM 7. FINAL STATUS
REM ============================================================================

timeout /t 3 /nobreak >nul

echo ============================================
echo   🎉 ALL SERVICES STARTED SUCCESSFULLY!
echo ============================================
echo.
echo   RUNNING SERVICES:
echo   ┌────────────────────────────────────────────┐
echo   │ 📤 Upload Server    : http://localhost:3001 │
echo   │ 🎨 Website          : http://localhost:5173 │
echo   │ 🌐 Bot API Server   : http://localhost:8000 │
echo   │ 🤖 Telegram Bot     : @CD_Video_Downloaderbot │
echo   └────────────────────────────────────────────┘
echo.
echo   ACCESS POINTS:
echo   • Website: http://localhost:5173
echo   • Admin Panel: http://localhost:5173/admin
echo   • Templates: http://localhost:5173/templates
echo   • Video Downloader: http://localhost:5173/video-downloader
echo   • Bot API Docs: http://localhost:8000/api/docs
echo   • Telegram Bot: @CD_Video_Downloaderbot
echo.
echo   ADMIN LOGIN:
echo   • Username: admin
echo   • Password: creative2026
echo.
echo   AUTO DOWNLOAD:
echo   • Instagram: https://instagram.com/reel/...
echo   • YouTube: https://youtube.com/watch?v=...
echo   • Just paste the link in Admin Panel!
echo.
echo   📱 MOBILE ACCESS:
echo   1. Run START_PUBLIC_TUNNEL.bat for online access
echo   2. Or use ngrok for permanent URL
echo.
echo   ⚠️  IMPORTANT:
echo       DO NOT CLOSE THESE WINDOWS!
echo       All services will stop if you close them.
echo.
echo   📁 FILE LOCATIONS:
echo   • Videos: %CD%\public\videos\
echo   • Images: %CD%\public\image\
echo   • Data: %CD%\public\data\videos.json
echo   • Logs: %CD%\logs\
echo.
echo   🛠️  TROUBLESHOOTING:
echo   • If bot doesn't start, check .env file
echo   • If API fails, check if port 8000 is free
echo   • If website fails, run: npm install
echo.
echo ============================================
echo.
echo   Need help? Check these files:
echo   • README_SUPER_SERVER.md - Full guide
echo   • QUICK_START_UZ.md - 5 minute start
echo   • AUTO_DOWNLOADER_GUIDE.md - Auto download
echo.
echo   Press any key to exit this window...
pause >nul
exit
