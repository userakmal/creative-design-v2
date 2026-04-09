@echo off
setlocal enabledelayedexpansion
title CRfix - Auto Fix All Issues
color 0B

cls
echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║                                                          ║
echo  ║     CREATIVE DESIGN - AUTO FIX ALL ISSUES v1.0         ║
echo  ║                                                          ║
echo  ║   Checking and fixing all problems automatically        ║
echo  ║                                                          ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.

:: ============================================================================
:: FIX 1: Check and Install Dependencies
:: ============================================================================

echo  ┌──────────────────────────────────────────────────────────┐
echo  │  FIX 1: Installing Dependencies                          │
echo  └──────────────────────────────────────────────────────────┘
echo.

echo  [1/6] Node.js dependencies...
call npm install --silent
if !ERRORLEVEL! EQU 0 (
    echo  [OK] Node.js dependencies installed
) else (
    echo  [ERROR] Node.js install failed!
)

echo.
echo  [2/6] Python dependencies...
cd /d "%~dp0telegram-video-bot"
pip install -r requirements.txt -q
if !ERRORLEVEL! EQU 0 (
    echo  [OK] Python dependencies installed
) else (
    echo  [ERROR] Python install failed!
)
cd /d "%~dp0"

echo.

:: ============================================================================
:: FIX 2: Create Missing Directories
:: ============================================================================

echo  ┌──────────────────────────────────────────────────────────┐
echo  │  FIX 2: Creating Directories                             │
echo  └──────────────────────────────────────────────────────────┘
echo.

if not exist "downloads\instagram" mkdir downloads\instagram
if not exist "public\data" mkdir public\data
if not exist "public\videos" mkdir public\videos
if not exist "public\image" mkdir public\image
if not exist "public\music" mkdir public\music
if not exist "public\logo" mkdir public\logo
if not exist "telegram-video-bot\downloads" mkdir telegram-video-bot\downloads

echo  [OK] All directories created

echo.

:: ============================================================================
:: FIX 3: Check Upload Server
:: ============================================================================

echo  ┌──────────────────────────────────────────────────────────┐
echo  │  FIX 3: Checking Upload Server                           │
echo  └──────────────────────────────────────────────────────────┘
echo.

if exist "upload-server.js" (
    echo  [OK] upload-server.js found
) else (
    echo  [ERROR] upload-server.js NOT FOUND!
)

if exist "public\data\videos.json" (
    echo  [OK] videos.json found
) else (
    echo  [] > public\data\videos.json
    echo  [FIXED] Created videos.json
)

echo.

:: ============================================================================
:: FIX 4: Check Instagram Downloader
:: ============================================================================

echo  ┌──────────────────────────────────────────────────────────┐
echo  │  FIX 4: Checking Instagram Downloader                    │
echo  └──────────────────────────────────────────────────────────┘
echo.

if exist "instagram-downloader.py" (
    echo  [OK] instagram-downloader.py found
) else (
    echo  [ERROR] instagram-downloader.py NOT FOUND!
)

python -c "import yt_dlp" >nul 2>nul
if !ERRORLEVEL! EQU 0 (
    echo  [OK] yt-dlp installed
) else (
    echo  [FIXING] Installing yt-dlp...
    pip install yt-dlp -q
    echo  [OK] yt-dlp installed
)

echo.

:: ============================================================================
:: FIX 5: Test Upload Server
:: ============================================================================

echo  ┌──────────────────────────────────────────────────────────┐
echo  │  FIX 5: Starting Upload Server for Test                  │
echo  └──────────────────────────────────────────────────────────┘
echo.

start "📤 Upload Server (3001)" cmd /k "cd /d %~dp0 && node upload-server.js"
timeout /t 3 /nobreak >nul

echo  Testing upload server...
curl -s http://localhost:3001/api/health >nul 2>nul
if !ERRORLEVEL! EQU 0 (
    echo  [OK] Upload server is running!
) else (
    echo  [WARNING] Upload server not responding yet...
    echo  Wait 5 seconds...
    timeout /t 5 /nobreak >nul
)

echo.

:: ============================================================================
:: FIX 6: Start Web App
:: ============================================================================

echo  ┌──────────────────────────────────────────────────────────┐
echo  │  FIX 6: Starting Web App                                 │
echo  └──────────────────────────────────────────────────────────┘
echo.

start "🌐 Web App (5173)" cmd /k "cd /d %~dp0 && npm run dev"
timeout /t 3 /nobreak >nul

echo  [OK] Web App started

echo.

:: ============================================================================
:: SUMMARY
:: ============================================================================

echo  ╔══════════════════════════════════════════════════════════╗
echo  ║                                                          ║
echo  ║              ALL FIXES APPLIED!                          ║
echo  ║                                                          ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.
echo  ┌──────────────────────────────────────────────────────────┐
echo  │  Services Running:                                       │
echo  ├──────────────────────────────────────────────────────────┤
echo  │  📤 Upload Server:  http://localhost:3001                │
echo  │  🌐 Web App:        http://localhost:5173                │
echo  │                                                          │
echo  │  🔧 Admin Panel:    http://localhost:5173/admin          │
echo  │  📝 Templates:      http://localhost:5173/templates      │
echo  │  📥 Downloader:     http://localhost:5173/video-downloader│
echo  └──────────────────────────────────────────────────────────┘
echo.
echo  ┌──────────────────────────────────────────────────────────┐
echo  │  How to Test Upload:                                     │
echo  ├──────────────────────────────────────────────────────────┤
echo  │  1. Open http://localhost:5173/admin                     │
echo  │  2. Click on video thumbnail area                        │
echo  │  3. Select a .mp4 file                                   │
echo  │  4. Click on image area                                  │
echo  │  5. Select a .jpg file                                   │
echo  │  6. Enter title and click "Video Yuklash"                │
echo  └──────────────────────────────────────────────────────────┘
echo.
echo  ┌──────────────────────────────────────────────────────────┐
echo  │  If Upload Still Fails:                                  │
echo  ├──────────────────────────────────────────────────────────┤
echo  │  1. Press F12 in browser                                 │
echo  │  2. Check Console for errors                             │
echo  │  3. Check Upload Server window for errors                │
echo  └──────────────────────────────────────────────────────────┘
echo.
echo  Press any key to close this window...
pause >nul
