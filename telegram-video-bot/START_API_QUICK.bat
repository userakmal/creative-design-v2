@echo off
:: Bot API Server - Quick Start
:: FastAPI backend for video downloads

title 🌐 BOT API SERVER - QUICK START
color 0C

cd /d "%~dp0"

echo ============================================
echo   🌐 BOT API SERVER - QUICK START
echo   FastAPI Backend (Port 8000)
echo ============================================
echo.

REM Check dependencies
if not exist "venv" (
    echo 📦 Virtual environment yo'q. O'rnatilmoqda...
    python -m venv venv
)

call venv\Scripts\activate.bat

echo 📦 Dependencies tekshirilmoqda...
pip install -r requirements.txt -q

echo.
echo ============================================
echo   🚀 API SERVER ISHGA TUSHIRILMOQDA...
echo ============================================
echo.
echo API: http://localhost:8000
echo Docs: http://localhost:8000/api/docs
echo.

python api_enhanced.py

pause
