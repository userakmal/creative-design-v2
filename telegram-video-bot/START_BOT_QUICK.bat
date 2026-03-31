@echo off
:: Telegram Bot - Quick Start
:: Bu fayl botni tez ishga tushirish uchun

title 🤖 TELEGRAM BOT - QUICK START
color 0B

cd /d "%~dp0"

echo ============================================
echo   🤖 TELEGRAM BOT - QUICK START
echo ============================================
echo.

REM Check .env
if not exist ".env" (
    echo ❌ .env fayl topilmadi!
    echo.
    if exist ".env.example" (
        echo 📄 .env.example dan nusxa olinmoqda...
        copy ".env.example" ".env"
        echo ✅ .env fayl yaratildi!
        echo.
        echo ⚠️  DIQQAT! .env faylni tahrirlang:
        echo    1. .env faylni oching
        echo    2. TELEGRAM_BOT_TOKEN ga sizning bot tokeningizni qo'ying
        echo    3. Faylni saqlang
        echo.
        pause
        exit /b 1
    )
)

REM Check dependencies
if not exist "venv" (
    echo 📦 Virtual environment yo'q. O'rnatilmoqda...
    python -m venv venv
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Python o'rnatilmagan!
        pause
        exit /b 1
    )
)

echo ✅ Virtual environment mavjud
echo.

REM Activate venv and install
call venv\Scripts\activate.bat

echo 📦 Dependencies tekshirilmoqda...
pip install -r requirements.txt -q

echo.
echo ============================================
echo   🚀 BOT ISHGA TUSHIRILMOQDA...
echo ============================================
echo.

python bot.py

pause
