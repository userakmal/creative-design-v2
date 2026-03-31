@echo off
chcp 65001 >nul 2>&1
title Creative Design - Barcha Xizmatlar
color 0A

echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║     CREATIVE DESIGN - CURRENT STARTER        ║
echo  ║                                              ║
echo  ║  Web sayt  : http://localhost:5173           ║
echo  ║  Admin     : http://localhost:5173/admin     ║
echo  ║  Video API : http://localhost:8000/api/docs  ║
echo  ╚══════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

:: ============================================================
:: 1. PREREQUISITES
:: ============================================================
echo [1/4] Tekshirish...

where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [XATO] Node.js topilmadi!
    pause & exit /b 1
)

where python >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [XATO] Python topilmadi!
    pause & exit /b 1
)

echo       Node.js va Python OK
echo.

:: ============================================================
:: 2. INSTALL DEPENDENCIES (if needed)
:: ============================================================
echo [2/4] Kutubxonalar...

if not exist "node_modules" (
    echo       npm install boshlandi...
    call npm install --silent
)

if not exist "telegram-video-bot\venv\Scripts\activate.bat" (
    echo       Python venv yaratilmoqda...
    cd telegram-video-bot
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -r requirements.txt --quiet
    cd ..
) 

echo       OK
echo.

:: ============================================================
:: 3. KILL OLD PROCESSES (clean start)
:: ============================================================
echo [3/4] Eski protsesslarni tozalash...
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr ":5173 " ^| findstr "LISTENING"') do taskkill /PID %%p /F >nul 2>&1
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr ":3001 " ^| findstr "LISTENING"') do taskkill /PID %%p /F >nul 2>&1
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr ":8000 " ^| findstr "LISTENING"') do taskkill /PID %%p /F >nul 2>&1
echo       OK
echo.

:: ============================================================
:: 4. START ALL SERVICES
:: ============================================================
echo [4/4] Xizmatlar ishga tushmoqda...

:: Downloads papkasini yaratish
if not exist "telegram-video-bot\downloads" mkdir telegram-video-bot\downloads

:: --- Vite Frontend (port 5173) + Upload Server (port 3001) ---
echo       [*] Vite + Upload Server ...
start "CD-FRONTEND" /min cmd /c "cd /d %~dp0 && npm run dev 2>&1"
timeout /t 3 /nobreak >nul

:: --- FastAPI Video Downloader API (port 8000) ---
echo       [*] Video API (port 8000) ...
start "CD-VIDEO-API" /min cmd /c "cd /d %~dp0\telegram-video-bot && call venv\Scripts\activate.bat && python api.py 2>&1"
timeout /t 2 /nobreak >nul

:: --- Telegram Bot ---
echo       [*] Telegram Bot ...
start "CD-TELEGRAM-BOT" /min cmd /c "cd /d %~dp0\telegram-video-bot && call venv\Scripts\activate.bat && python bot.py 2>&1"
timeout /t 2 /nobreak >nul

echo.
echo  ┌──────────────────────────────────────────────┐
echo  │  BARCHA XIZMATLAR ISHGA TUSHDI!              │
echo  │                                              │
echo  │  Web sayt:    http://localhost:5173           │
echo  │  Admin panel: http://localhost:5173/admin     │
echo  │  Downloader:  http://localhost:5173/video-downloader │
echo  │  API docs:    http://localhost:8000/api/docs  │
echo  │  Telegram:    Bot ishlayapti                 │
echo  │                                              │
echo  │  Yopish: bu oynani yoping                    │
echo  └──────────────────────────────────────────────┘
echo.

pause
