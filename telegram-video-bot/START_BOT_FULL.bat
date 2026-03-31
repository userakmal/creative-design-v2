@echo off
color 0A
cd /d "%~dp0"

title 🤖 TELEGRAM BOT - FULL START

echo ============================================
echo   🤖 TELEGRAM BOT - FULL START
echo   Barcha xizmatlar bilan
echo ============================================
echo.

REM 1. Check .env
if not exist ".env" (
    echo ❌ .env fayl topilmadi!
    pause
    exit /b 1
)
echo ✓ .env fayl mavjud
echo.

REM 2. Check venv
if not exist "venv" (
    echo 📦 Virtual environment yaratilmoqda...
    python -m venv venv
    call venv\Scripts\activate
    echo 📦 Dependencies o'rnatilmoqda...
    pip install -r requirements.txt -q
) else (
    call venv\Scripts\activate
)
echo ✓ Virtual environment tayyor
echo.

REM 3. Check Docker
echo 🐳 Bot API Server tekshirilmoqda...
docker compose ps | findstr "telegram-bot-api" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✓ Bot API Server ishlayapti
) else (
    echo 🐳 Bot API Server ishga tushirilmoqda...
    docker compose up -d
    timeout /t 5 /nobreak >nul
)
echo.

REM 4. Start Bot API (Python fallback)
if exist "api_enhanced.py" (
    echo 🌐 FastAPI Backend ishga tushirilmoqda...
    start "🌐 Bot API - Port 8000" cmd /k "title Bot API && call venv\Scripts\activate && python api_enhanced.py"
    timeout /t 3 /nobreak >nul
)

REM 5. Start Bot
echo 🤖 Telegram Bot ishga tushirilmoqda...
start "🤖 Telegram Bot" cmd /k "title Telegram Bot && call venv\Scripts\activate && echo. && echo ============================================ && echo   TELEGRAM BOT RUNNING && echo ============================================ && echo. && echo Bot: @CD_Video_Downloaderbot && echo Status: Running && echo. && echo Press Ctrl+C to stop && echo ============================================ && echo. && python bot.py"

timeout /t 5 /nobreak >nul

echo.
echo ============================================
echo   ✅ BOT ISHGA TUSHDI!
echo ============================================
echo.
echo   XIZMATLAR:
echo   ┌──────────────────────────────────────┐
echo   │ 🌐 Bot API    : http://localhost:8000 │
echo   │ 🤖 Telegram Bot: @CD_Video_Downloaderbot │
echo   └──────────────────────────────────────┘
echo.
echo   TEKSHIRISH:
echo   1. Telegram dan botni qidiring: @CD_Video_Downloaderbot
echo   2. /start tugmasini bosing
echo   3. Bot javob berishi kerak
echo.
echo   MUAMMO BO'LSA:
echo   • Bot javob bermasa: START_BOT_DEBUG.bat
echo   • Loglarni ko'ring: bot.log
echo.
echo ============================================
echo.

pause
