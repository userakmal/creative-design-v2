@echo off
setlocal enabledelayedexpansion
title CRrunner - Creative Design Platform
color 0A

:: ============================================================================
:: CREATIVE DESIGN PLATFORM - PROFESSIONAL RUNNER v3.0
:: Starts ALL services: Node.js + Python APIs + Telegram Bot
:: ============================================================================

cls
echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║                                                          ║
echo  ║     CREATIVE DESIGN PLATFORM - CRrunner v3.0            ║
echo  ║                                                          ║
echo  ║   Web App + Upload Server + Video API + Telegram Bot     ║
echo  ║                                                          ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.

:: ============================================================================
:: STEP 1: CHECK PREREQUISITES
:: ============================================================================

echo  ┌──────────────────────────────────────────────────────────┐
echo  │  STEP 1: Checking Prerequisites                          │
echo  └──────────────────────────────────────────────────────────┘
echo.

:: Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo  [ERROR] Node.js is NOT installed!
    echo.
    echo  Please install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo  [OK] Node.js: !NODE_VERSION!

:: Check npm
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo  [ERROR] npm is NOT installed!
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo  [OK] npm: v!NPM_VERSION!

:: Check Python
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo  [ERROR] Python is NOT installed!
    echo.
    echo  Please install Python 3.8+ from: https://www.python.org/
    echo  IMPORTANT: Check "Add Python to PATH" during installation!
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
echo  [OK] Python: !PYTHON_VERSION!

echo.

:: ============================================================================
:: STEP 2: INSTALL DEPENDENCIES
:: ============================================================================

echo  ┌──────────────────────────────────────────────────────────┐
echo  │  STEP 2: Installing Dependencies                         │
echo  └──────────────────────────────────────────────────────────┘
echo.

:: Install Node.js dependencies
if not exist "node_modules" (
    echo  Installing Node.js dependencies...
    call npm install
    if !ERRORLEVEL! NEQ 0 (
        echo.
        echo  [ERROR] Failed to install Node.js dependencies!
        pause
        exit /b 1
    )
    echo  [OK] Node.js dependencies installed
) else (
    echo  [OK] Node.js dependencies already installed
)

echo.

:: Install Python dependencies
echo  Installing Python dependencies...
cd /d "%~dp0telegram-video-bot"
pip install -r requirements.txt -q
if !ERRORLEVEL! NEQ 0 (
    echo.
    echo  [ERROR] Failed to install Python dependencies!
    echo  Try running: pip install --upgrade pip
    pause
    exit /b 1
)
cd /d "%~dp0"
echo  [OK] Python dependencies installed

echo.

:: ============================================================================
:: STEP 3: CLEAN UP PORTS
:: ============================================================================

echo  ┌──────────────────────────────────────────────────────────┐
echo  │  STEP 3: Cleaning Up Ports                               │
echo  └──────────────────────────────────────────────────────────┘
echo.

:: Kill Python processes first (more reliable)
echo  Stopping Python processes...
taskkill /F /IM python.exe >nul 2>nul
timeout /t 1 /nobreak >nul
echo  [OK] Python processes stopped

:: Kill Node.js processes
echo  Stopping Node.js processes...
taskkill /F /IM node.exe >nul 2>nul
timeout /t 1 /nobreak >nul
echo  [OK] Node.js processes stopped

:: Verify ports are clear
set PORTS_OK=1
for %%P in (3001 5173 8000) do (
    netstat -ano | findstr ":%%P" >nul 2>nul
    if !ERRORLEVEL! EQU 0 (
        echo  [WARN] Port %%P still in use - force killing...
        for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%%P"') do (
            taskkill /F /PID %%a >nul 2>nul
        )
        timeout /t 1 /nobreak >nul
    )
    echo  [OK] Port %%P ready
)

:: ============================================================================
:: STEP 4: CREATE DIRECTORIES
:: ============================================================================

echo  ┌──────────────────────────────────────────────────────────┐
echo  │  STEP 4: Setting Up Directories                          │
echo  └──────────────────────────────────────────────────────────┘
echo.

if not exist "downloads\instagram" mkdir downloads\instagram
if not exist "public\data" mkdir public\data
if not exist "public\videos" mkdir public\videos
if not exist "public\image" mkdir public\image
if not exist "public\music" mkdir public\music
if not exist "public\logo" mkdir public\logo
if not exist "telegram-video-bot\downloads" mkdir telegram-video-bot\downloads
if not exist "telegram-video-bot\logs" mkdir telegram-video-bot\logs

echo  [OK] All directories ready

echo.

:: ============================================================================
:: STEP 5: START SERVICES
:: ============================================================================

echo  ┌──────────────────────────────────────────────────────────┐
echo  │  STEP 5: Starting Services                               │
echo  └──────────────────────────────────────────────────────────┘
echo.

:: Start Upload Server (Node.js - port 3001)
echo  [1/4] Starting Upload Server...
start "📤 Upload Server (3001)" cmd /k "cd /d %~dp0 && node upload-server.js"
timeout /t 2 /nobreak >nul
echo  [OK] Upload Server starting on port 3001

echo.

:: Start Video API Server (Python - port 8000)
echo  [2/4] Starting Video API Server...
start "🎬 Video API (8000)" cmd /k "cd /d %~dp0telegram-video-bot && python api.py"
timeout /t 3 /nobreak >nul
echo  [OK] Video API starting on port 8000

echo.

:: Start Telegram Bot (Python)
echo  [3/4] Starting Telegram Bot...
start "🤖 Telegram Bot" cmd /k "cd /d %~dp0telegram-video-bot && python bot.py"
timeout /t 2 /nobreak >nul
echo  [OK] Telegram Bot starting

echo.

:: Start Web Application (Node.js - port 5173)
echo  [4/4] Starting Web Application...
start "🌐 Web App (5173)" cmd /k "cd /d %~dp0 && npm run dev"
timeout /t 2 /nobreak >nul
echo  [OK] Web App starting on port 5173

echo.

:: ============================================================================
:: SUCCESS MESSAGE
:: ============================================================================

echo  ╔══════════════════════════════════════════════════════════╗
echo  ║                                                          ║
echo  ║              ALL SERVICES STARTED!                       ║
echo  ║                                                          ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.
echo  ┌──────────────────────────────────────────────────────────┐
echo  │  Service URLs:                                           │
echo  ├──────────────────────────────────────────────────────────┤
echo  │  🌐 Web App:        http://localhost:5173                │
echo  │  🔐 Admin Panel:    http://localhost:5173/admin          │
echo  │  📝 Templates:      http://localhost:5173/templates      │
echo  │  🎵 Music:          http://localhost:5173/music          │
echo  │  📥 Downloader:     http://localhost:5173/video-downloader│
echo  │                                                          │
echo  │  📤 Upload Server:  http://localhost:3001                │
echo  │  🎬 Video API:      http://localhost:8000                │
echo  │  📖 API Docs:       http://localhost:8000/api/docs       │
echo  │  🤖 Telegram Bot:   Running in background                │
echo  └──────────────────────────────────────────────────────────┘
echo.
echo  ┌──────────────────────────────────────────────────────────┐
echo  │  Features Available:                                     │
echo  ├──────────────────────────────────────────────────────────┤
echo  │  ✅ Video Downloader (YouTube, Instagram, TikTok, etc.)  │
echo  │  ✅ Instagram Auto-Upload to Website                     │
echo  │  ✅ Telegram Bot for Video Downloads                     │
echo  │  ✅ Admin Panel with Upload Management                   │
echo  │  ✅ Auto-Sync to Production via FTP                      │
echo  └──────────────────────────────────────────────────────────┘
echo.
echo  ┌──────────────────────────────────────────────────────────┐
echo  │  To stop all services: CRstopper.bat                     │
echo  └──────────────────────────────────────────────────────────┘
echo.
echo  Press any key to close this window...
pause >nul
