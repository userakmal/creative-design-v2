@echo off
:: Creative Design - Full Diagnostic Tool
:: Barcha xizmatlarni tekshiradi

title 🔍 CREATIVE DESIGN - DIAGNOSTIC TOOL
color 07

cd /d "%~dp0"

echo ============================================
echo   🔍 CREATIVE DESIGN - FULL DIAGNOSTIC
echo   All Services Check
echo ============================================
echo.

REM 1. Node.js
echo [1/8] Node.js tekshirish...
where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo       ✅ Node.js o'rnatilgan
    node --version
) else (
    echo       ❌ Node.js yo'q!
)
echo.

REM 2. Python
echo [2/8] Python tekshirish...
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo       ✅ Python o'rnatilgan
    python --version
) else (
    echo       ❌ Python yo'q!
)
echo.

REM 3. FFmpeg
echo [3/8] FFmpeg tekshirish...
ffmpeg -version >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo       ✅ FFmpeg o'rnatilgan
) else (
    echo       ❌ FFmpeg yo'q!
    echo          winget install Gyan.FFmpeg
)
echo.

REM 4. Upload Server (Port 3001)
echo [4/8] Upload Server (Port 3001)...
curl -s http://localhost:3001/api/health >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo       ✅ Upload Server ishlayapti
) else (
    echo       ❌ Upload Server ishlamayapti
    echo          START_EVERYTHING.bat ni ishga tushiring
)
echo.

REM 5. Vite Server (Port 5173)
echo [5/8] Vite Server (Port 5173)...
curl -s http://localhost:5173 >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo       ✅ Website ishlayapti
) else (
    echo       ❌ Website ishlamayapti
)
echo.

REM 6. Bot API Server (Port 8000)
echo [6/8] Bot API Server (Port 8000)...
curl -s http://localhost:8000/api/docs >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo       ✅ Bot API Server ishlayapti
) else (
    echo       ❌ Bot API Server ishlamayapti
)
echo.

REM 7. Telegram Bot (.env)
echo [7/8] Telegram Bot Configuration...
if exist "telegram-video-bot\.env" (
    echo       ✅ .env fayl mavjud
) else (
    echo       ❌ .env fayl yo'q!
    echo          telegram-video-bot\.env.example dan nusxa oling
)
echo.

REM 8. Docker (optional)
echo [8/8] Docker (optional)...
where docker >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo       ✅ Docker mavjud
    docker --version
) else (
    echo       ⚠  Docker yo'q (bot fallback mode da ishlaydi)
)
echo.

echo ============================================
echo   📊 NATIJA
echo ============================================
echo.

:: Count issues
set /a issues=0

curl -s http://localhost:3001/api/health >nul 2>nul
if %ERRORLEVEL% NEQ 0 set /a issues+=1

curl -s http://localhost:5173 >nul 2>nul
if %ERRORLEVEL% NEQ 0 set /a issues+=1

if not exist "telegram-video-bot\.env" set /a issues+=1

echo       Jami muammolar: %issues%
echo.

if %issues% EQU 0 (
    echo       ✅ HAMMA NARSA ISHLAYAPTI!
) else (
    echo       ⚠️  %issues% ta muammo topildi
    echo.
    echo       YECHIM:
    echo       1. START_EVERYTHING.bat ni ishga tushiring
    echo       2. Telegram bot uchun .env faylni to'ldiring
    echo       3. START_BOT_QUICK.bat ni ishga tushiring
)

echo.
echo ============================================
echo.

pause
