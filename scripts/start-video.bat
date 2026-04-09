@echo off
chcp 65001 >nul
title Creative Design - Video Downloader API (Port 8000)

cd /d "%~dp0api-server\video-downloader"

echo.
echo ╔═════════════════════════════════════════════╗
echo ║  🎬 Video Downloader API (FastAPI)         ║
echo ║  Port: 8000                                 ║
echo ║  API Docs: http://localhost:8000/api/docs  ║
echo ╚═════════════════════════════════════════════╝
echo.

REM Check if virtual environment exists
if not exist "venv\" (
    echo 📦 Creating virtual environment...
    python -m venv venv
    echo.
)

REM Activate venv and install dependencies if needed
call venv\Scripts\activate.bat

if not exist "venv\Lib\site-packages\fastapi\" (
    echo 📦 Installing Python dependencies...
    pip install -r requirements.txt
    echo.
)

REM Create downloads directory
if not exist "downloads" mkdir downloads

echo 🚀 Starting FastAPI server...
echo.

python api_enhanced.py
