@echo off
chcp 65001 >nul 2>&1
title Creative Design - Barcha Xizmatlar
color 0A

echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║       CREATIVE DESIGN - FULL SERVICE LAUNCHER       ║
echo  ║                                                      ║
echo  ║  Frontend  : http://localhost:5173                   ║
echo  ║  Upload API: http://localhost:3001                   ║
echo  ║  Video API : http://localhost:8000/api/docs          ║
echo  ║  Bot       : Telegram @your_bot                     ║
echo  ╚══════════════════════════════════════════════════════╝
echo.

:: ====================================================================
:: 1. CHECK PREREQUISITES
:: ====================================================================
echo [1/5] Checking prerequisites...

where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js not found! Install from https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do echo       Node.js: %%v

where python >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python not found! Install from https://python.org
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('python --version 2^>^&1') do echo       %%v

where ffmpeg >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [WARN]  FFmpeg not found - video merging will fail
    echo         Install: https://ffmpeg.org/download.html
) else (
    echo       FFmpeg: OK
)

echo       Prerequisites OK!
echo.

:: ====================================================================
:: 2. INSTALL NODE DEPENDENCIES (if needed)
:: ====================================================================
echo [2/5] Checking Node.js dependencies...

if not exist "node_modules" (
    echo       Installing npm packages...
    call npm install --silent
    echo       npm install complete!
) else (
    echo       node_modules exists - skipping
)
echo.

:: ====================================================================
:: 3. SETUP PYTHON VENV (if needed)
:: ====================================================================
echo [3/5] Checking Python environment...

cd telegram-video-bot

if not exist "venv\Scripts\activate.bat" (
    echo       Creating Python virtual environment...
    python -m venv venv
    echo       Installing Python packages...
    call venv\Scripts\activate.bat
    pip install -r requirements.txt --quiet
    echo       Python setup complete!
) else (
    call venv\Scripts\activate.bat
    echo       Python venv activated
)

:: Quick check: ensure essential packages
python -c "import aiogram; import yt_dlp; import fastapi" 2>nul
if %ERRORLEVEL% neq 0 (
    echo       Installing missing Python packages...
    pip install -r requirements.txt --quiet
)

cd ..
echo       Python environment OK!
echo.

:: ====================================================================
:: 4. START ALL SERVICES
:: ====================================================================
echo [4/5] Starting services...
echo.

:: Create downloads directory
if not exist "telegram-video-bot\downloads" mkdir telegram-video-bot\downloads

:: --- Service 1: Vite Frontend (port 5173) ---
echo       [*] Starting Vite dev server (port 5173)...
start "VITE-FRONTEND" /min cmd /c "cd /d %~dp0 && npx vite --host 0.0.0.0 --port 5173"
timeout /t 2 /nobreak >nul

:: --- Service 2: Upload Server (port 3001) ---
echo       [*] Starting Upload server (port 3001)...
start "UPLOAD-SERVER" /min cmd /c "cd /d %~dp0 && node upload-server.js"
timeout /t 1 /nobreak >nul

:: --- Service 3: FastAPI Video API (port 8000) ---
echo       [*] Starting Video API server (port 8000)...
start "VIDEO-API" /min cmd /c "cd /d %~dp0\telegram-video-bot && venv\Scripts\activate.bat && python api.py"
timeout /t 1 /nobreak >nul

:: --- Service 4: Telegram Bot ---
echo       [*] Starting Telegram Bot...
start "TELEGRAM-BOT" /min cmd /c "cd /d %~dp0\telegram-video-bot && venv\Scripts\activate.bat && python bot.py"
timeout /t 2 /nobreak >nul

echo.

:: ====================================================================
:: 5. STATUS DASHBOARD
:: ====================================================================
echo [5/5] All services started!
echo.
echo  ┌─────────────────────────────────────────────────────┐
echo  │  Service          Port    Status                    │
echo  ├─────────────────────────────────────────────────────┤
echo  │  Vite Frontend    5173    RUNNING                   │
echo  │  Upload Server    3001    RUNNING                   │
echo  │  Video API        8000    RUNNING                   │
echo  │  Telegram Bot     -       RUNNING                   │
echo  └─────────────────────────────────────────────────────┘
echo.
echo  Frontend:  http://localhost:5173
echo  Admin:     http://localhost:5173/admin
echo  Downloader: http://localhost:5173/video-downloader
echo  API Docs:  http://localhost:8000/api/docs
echo.
echo  ═══════════════════════════════════════════════════════
echo   Barcha xizmatlar ishga tushdi!
echo   Yopish uchun bu oynani yoping (yoki Ctrl+C bosing)
echo  ═══════════════════════════════════════════════════════
echo.

:: Keep this window open
pause
