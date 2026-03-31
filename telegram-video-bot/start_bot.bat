@echo off
color 0B
cd /d "%~dp0"

title 🤖 TELEGRAM BOT - START

echo ============================================
echo   🤖 TELEGRAM BOT - START
echo ============================================
echo.

REM 1. Check .env
if not exist ".env" (
    echo ❌ .env fayl topilmadi!
    echo.
    if exist ".env.example" (
        copy ".env.example" ".env"
        echo ✅ .env yaratildi
    ) else (
        echo    .env faylni yarating va bot token kiriting
        pause
        exit /b 1
    )
)

echo ✓ .env fayl mavjud
echo.

REM 2. Activate venv
if exist "venv" (
    echo ✓ Virtual environment mavjud
    call venv\Scripts\activate.bat
) else (
    echo 📦 Virtual environment yaratilmoqda...
    python -m venv venv
    call venv\Scripts\activate.bat
    echo 📦 Dependencies o'rnatilmoqda...
    pip install -r requirements.txt -q
)

echo.

REM 3. Check Docker (optional)
echo 🐳 Bot API Server tekshirilmoqda...
docker compose ps | findstr "telegram-bot-api" >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✓ Docker container ishlayapti
) else (
    echo ⚠ Docker container ishlamayapti (fallback mode)
)

echo.

REM 4. Start Bot
echo 🤖 Telegram Bot ishga tushirilmoqda...
echo.

python bot.py

pause
