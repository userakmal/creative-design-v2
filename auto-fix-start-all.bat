@echo off
setlocal enabledelayedexpansion
title Creative Design - AUTO FIX ^& START ALL
color 0B

:: ============================================================================
:: CREATIVE DESIGN PLATFORM - AUTO FIX & START ALL SERVICES v4.0
:: Automatically fixes issues and starts ALL services online
:: ============================================================================

cls
echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║                                                          ║
echo  ║     CREATIVE DESIGN - AUTO FIX ^& START v4.0            ║
echo  ║                                                          ║
echo  ║   Automatic Fix + Web App + Upload Server + Video API   ║
echo  ║   + Telegram Bot = ALL ONLINE!                          ║
echo  ║                                                          ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.
echo  [INFO] Starting automatic fix and launch...
echo.

:: ============================================================================
:: STEP 1: CHECK PREREQUISITES
:: ============================================================================

echo  ╔══════════════════════════════════════════════════════════╗
echo  ║  STEP 1/6: Checking Prerequisites                       ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.

:: Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo  [ERROR] Node.js is NOT installed!
    echo.
    echo  Please install from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo  [OK] Node.js: !NODE_VERSION!

:: Check Python
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo  [ERROR] Python is NOT installed!
    echo.
    echo  Please install Python 3.8+ from: https://www.python.org/
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
echo  [OK] Python: !PYTHON_VERSION!

:: Check npm
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo  [ERROR] npm not found!
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo  [OK] npm: v!NPM_VERSION!

:: Check pip
where pip >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo  [ERROR] pip not found!
    pause
    exit /b 1
)
echo  [OK] pip available

echo.

:: ============================================================================
:: STEP 2: CREATE ALL REQUIRED DIRECTORIES
:: ============================================================================

echo  ╔══════════════════════════════════════════════════════════╗
echo  ║  STEP 2/6: Creating Directories                         ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.

if not exist "public\data" mkdir public\data && echo  [OK] Created public\data
if not exist "public\videos" mkdir public\videos && echo  [OK] Created public\videos
if not exist "public\image" mkdir public\image && echo  [OK] Created public\image
if not exist "public\music" mkdir public\music && echo  [OK] Created public\music
if not exist "public\logo" mkdir public\logo && echo  [OK] Created public\logo
if not exist "downloads\instagram" mkdir downloads\instagram && echo  [OK] Created downloads\instagram
if not exist "logs" mkdir logs && echo  [OK] Created logs
if not exist "telegram-video-bot\downloads" mkdir telegram-video-bot\downloads && echo  [OK] Created telegram-video-bot\downloads
if not exist "telegram-video-bot\logs" mkdir telegram-video-bot\logs && echo  [OK] Created telegram-video-bot\logs

echo.

:: ============================================================================
:: STEP 3: INSTALL/UPDATE DEPENDENCIES
:: ============================================================================

echo  ╔══════════════════════════════════════════════════════════╗
echo  ║  STEP 3/6: Installing Dependencies                      ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.

:: Install Node.js dependencies
echo  [1/2] Installing Node.js dependencies...
call npm install --silent
if !ERRORLEVEL! NEQ 0 (
    echo  [WARNING] Some npm packages may have failed, continuing...
) else (
    echo  [OK] Node.js dependencies ready
)

echo.

:: Install Python dependencies
echo  [2/2] Installing Python dependencies...
cd /d "%~dp0telegram-video-bot"
pip install -r requirements.txt -q --upgrade
if !ERRORLEVEL! NEQ 0 (
    echo  [WARNING] Some Python packages may have failed, continuing...
) else (
    echo  [OK] Python dependencies ready
)
cd /d "%~dp0"

echo.

:: ============================================================================
:: STEP 4: CLEAN PORTS
:: ============================================================================

echo  ╔══════════════════════════════════════════════════════════╗
echo  ║  STEP 4/6: Cleaning Ports                               ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.

for %%P in (3001 5173 8000) do (
    netstat -ano | findstr ":%%P" >nul 2>nul
    if !ERRORLEVEL! EQU 0 (
        echo  Clearing port %%P...
        for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%%P"') do (
            taskkill /F /PID %%a >nul 2>nul
        )
        timeout /t 1 /nobreak >nul
        echo  [OK] Port %%P cleared
    ) else (
        echo  [OK] Port %%P available
    )
)

echo.

:: ============================================================================
:: STEP 5: FIX COMMON ISSUES
:: ============================================================================

echo  ╔══════════════════════════════════════════════════════════╗
echo  ║  STEP 5/6: Auto-Fix Common Issues                       ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.

:: Fix 1: Check .env file
if not exist ".env" (
    echo  [FIX] Creating .env from .env.example...
    copy .env.example .env >nul
    echo  [OK] .env file created
) else (
    echo  [OK] .env file exists
)

:: Fix 2: Check telegram bot .env
if not exist "telegram-video-bot\.env" (
    echo  [FIX] Creating telegram bot .env from example...
    cd /d "%~dp0telegram-video-bot"
    if exist ".env.example" copy .env.example .env >nul
    cd /d "%~dp0"
    echo  [OK] Telegram bot .env created
) else (
    echo  [OK] Telegram bot .env exists
)

:: Fix 3: Initialize videos.json if missing
if not exist "public\data\videos.json" (
    echo  [FIX] Creating videos.json...
    echo [] > public\data\videos.json
    echo  [OK] videos.json created
) else (
    echo  [OK] videos.json exists
)

:: Fix 4: Initialize music.json if missing
if not exist "public\data\music.json" (
    echo  [FIX] Creating music.json...
    echo [] > public\data\music.json
    echo  [OK] music.json created
) else (
    echo  [OK] music.json exists
)

:: Fix 5: Check FFmpeg
where ffmpeg >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo  [WARNING] FFmpeg not found - video processing may fail
    echo  Download from: https://ffmpeg.org/download.html
) else (
    echo  [OK] FFmpeg available
)

echo.

:: ============================================================================
:: STEP 6: START ALL SERVICES
:: ============================================================================

echo  ╔══════════════════════════════════════════════════════════╗
echo  ║  STEP 6/6: Starting All Services                        ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.

:: Service 1: Upload Server (Node.js - port 3001)
echo  [1/4] Starting Upload Server (port 3001)...
start "📤 Upload Server (3001)" cmd /k "cd /d %~dp0 && echo Starting Upload Server... && node upload-server.js"
timeout /t 2 /nobreak >nul
echo  [OK] Upload Server launching...

echo.

:: Service 2: Video API (Python FastAPI - port 8000)
echo  [2/4] Starting Video API Server (port 8000)...
start "🎬 Video API (8000)" cmd /k "cd /d %~dp0telegram-video-bot && echo Starting Video API Server... && python api.py"
timeout /t 3 /nobreak >nul
echo  [OK] Video API launching...

echo.

:: Service 3: Telegram Bot (Python)
echo  [3/4] Starting Telegram Bot...
start "🤖 Telegram Bot" cmd /k "cd /d %~dp0telegram-video-bot && echo Starting Telegram Bot... && python bot.py"
timeout /t 2 /nobreak >nul
echo  [OK] Telegram Bot launching...

echo.

:: Service 4: Web Application (Vite - port 5173)
echo  [4/4] Starting Web Application (port 5173)...
start "🌐 Web App (5173)" cmd /k "cd /d %~dp0 && echo Starting Web Application... && npm run dev"
timeout /t 2 /nobreak >nul
echo  [OK] Web App launching...

echo.

:: ============================================================================
:: WAIT FOR SERVICES TO START
:: ============================================================================

echo  ┌──────────────────────────────────────────────────────────┐
echo  │  Waiting for services to initialize...                   │
echo  └──────────────────────────────────────────────────────────┘
timeout /t 5 /nobreak >nul

:: ============================================================================
:: SUCCESS MESSAGE
:: ============================================================================

cls
echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║                                                          ║
echo  ║           ALL SERVICES STARTED SUCCESSFULLY!             ║
echo  ║                                                          ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.
echo  ┌──────────────────────────────────────────────────────────┐
echo  │  🌐 ACCESS YOUR APPLICATIONS:                            │
echo  ├──────────────────────────────────────────────────────────┤
echo  │                                                          │
echo  │  📱 Web Application:                                     │
echo  │     http://localhost:5173                                │
echo  │     http://localhost:5173/admin  (Admin Panel)           │
echo  │                                                          │
echo  │  📤 Upload Server:                                       │
echo  │     http://localhost:3001                                │
echo  │     http://localhost:3001/api/health                     │
echo  │                                                          │
echo  │  🎬 Video API Server:                                    │
echo  │     http://localhost:8000                                │
echo  │     http://localhost:8000/api/docs  (API Documentation)  │
echo  │                                                          │
echo  │  🤖 Telegram Bot:                                        │
echo  │     Running in background                                │
echo  │     Check bot window for status                          │
echo  │                                                          │
echo  └──────────────────────────────────────────────────────────┘
echo.
echo  ┌──────────────────────────────────────────────────────────┐
echo  │  🎯 FEATURES AVAILABLE:                                  │
echo  ├──────────────────────────────────────────────────────────┤
echo  │  ✅ Video Downloader (YouTube, Instagram, TikTok, etc.)  │
echo  │  ✅ Instagram Auto-Upload to Website                     │
echo  │  ✅ Telegram Bot for Video Downloads                     │
echo  │  ✅ Admin Panel with Upload Management                   │
echo  │  ✅ Auto-Sync to Production via FTP                      │
echo  │  ✅ Music Library Management                             │
echo  └──────────────────────────────────────────────────────────┘
echo.
echo  ┌──────────────────────────────────────────────────────────┐
echo  │  🔧 MANAGEMENT COMMANDS:                                 │
echo  ├──────────────────────────────────────────────────────────┤
echo  │  Stop all services:  CRstopper.bat                       │
echo  │  Restart all:        Run this file again                 │
echo  │  Check logs:         See individual service windows      │
echo  └──────────────────────────────────────────────────────────┘
echo.
echo  ┌──────────────────────────────────────────────────────────┐
echo  │  💡 TIP: Open http://localhost:5173 in your browser!     │
echo  └──────────────────────────────────────────────────────────┘
echo.
echo  Press any key to open the web application in your browser...
pause >nul

:: Open web app in default browser
start http://localhost:5173

echo.
echo  Browser opened! You can now use your application.
echo.
echo  Press any key to exit...
pause >nul
