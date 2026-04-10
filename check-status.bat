@echo off
echo ========================================
echo Creative Design Platform - Diagnostics
echo ========================================
echo.

echo [1/6] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Node.js is installed
    node --version
) else (
    echo ✗ Node.js is NOT installed
    echo   Download from: https://nodejs.org/
)
echo.

echo [2/6] Checking npm...
npm --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ npm is installed
    npm --version
) else (
    echo ✗ npm is NOT installed
)
echo.

echo [3/6] Checking Python...
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Python is installed
    python --version
) else (
    echo ✗ Python is NOT installed
    echo   Download from: https://python.org/
)
echo.

echo [4/6] Checking FFmpeg...
ffmpeg -version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ FFmpeg is installed
    ffmpeg -version | findstr "ffmpeg version"
) else (
    echo ✗ FFmpeg is NOT installed
    echo   Download from: https://ffmpeg.org/download.html
    echo   Or use: winget install ffmpeg
)
echo.

echo [5/6] Checking Dependencies...
if exist "api-server\node_modules" (
    echo ✓ API Server dependencies installed
) else (
    echo ✗ API Server dependencies missing
    echo   Run: cd api-server ^&^& npm install
)

if exist "client\node_modules" (
    echo ✓ Client dependencies installed
) else (
    echo ✗ Client dependencies missing
    echo   Run: cd client ^&^& npm install
)

if exist "telegram-video-bot\venv" (
    echo ✓ Telegram Bot virtual environment exists
) else (
    echo ✗ Telegram Bot virtual environment missing
    echo   Run: cd telegram-video-bot ^&^& python -m venv venv
)
echo.

echo [6/6] Checking Configuration Files...
if exist "api-server\upload-server.js" (
    echo ✓ API Server main file exists
) else (
    echo ✗ API Server main file missing
)

if exist "client\src\pages\admin.page.tsx" (
    echo ✓ Admin Panel file exists
) else (
    echo ✗ Admin Panel file missing
)

if exist "telegram-video-bot\.env" (
    echo ✓ Telegram Bot .env file exists
) else (
    echo ✗ Telegram Bot .env file missing
)

if exist "telegram-video-bot\bot.py" (
    echo ✓ Telegram Bot main file exists
) else (
    echo ✗ Telegram Bot main file missing
)
echo.

echo ========================================
echo Checking Ports Availability...
echo ========================================
echo.

netstat -ano | findstr ":3001" >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠ Port 3001 is IN USE (API Server)
) else (
    echo ✓ Port 3001 is FREE
)

netstat -ano | findstr ":5173" >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠ Port 5173 is IN USE (Client)
) else (
    echo ✓ Port 5173 is FREE
)

netstat -ano | findstr ":8081" >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠ Port 8081 is IN USE (Bot API Server)
) else (
    echo ✓ Port 8081 is FREE
)

netstat -ano | findstr ":8000" >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠ Port 8000 is IN USE (Video Downloader)
) else (
    echo ✓ Port 8000 is FREE
)
echo.

echo ========================================
echo Summary
echo ========================================
echo.
echo To start all services:
echo   1. Run: start-all-fixed.bat
echo   2. Or start individually:
echo      - API Server:  cd api-server ^&^& npm start
echo      - Client:      cd client ^&^& npm run dev
echo      - Bot:         cd telegram-video-bot ^&^& venv\Scripts\activate ^&^& python bot.py
echo.
echo Access points:
echo   - Main Site:   http://localhost:5173
echo   - Admin Panel: http://localhost:5173/admin
echo   - API Server:  http://localhost:3001
echo   - API Health:  http://localhost:3001/api/health
echo.
pause
