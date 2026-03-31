@echo off
color 0A
cd /d "%~dp0"

title 🚀 CREATIVE DESIGN - ONE CLICK START

echo.
echo ============================================
echo   🚀 CREATIVE DESIGN - ONE CLICK START
echo   BARCHA XIZMATLAR BIRTA CLICK BILAN!
echo ============================================
echo.

REM ============================================================================
REM 1. TEKSHIRISH
REM ============================================================================

echo [1/8] Tizimni tekshirish...

:: Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js yo'q!
    echo    https://nodejs.org/ dan o'rnating
    pause
    exit /b 1
)
echo    ✓ Node.js: 
node --version

:: Python
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo    ⚠  Python yo'q (Telegram bot ishlamasligi mumkin)
) else (
    echo    ✓ Python: 
    python --version
)

:: Git (rsync uchun)
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo    ⚠  Git yo'q (Auto-sync ishlamasligi mumkin)
) else (
    echo    ✓ Git: 
    git --version
)

echo.

REM ============================================================================
REM 2. ESKI JARAYONLARNI TO'XTATISH
REM ============================================================================

echo [2/8] Eski jarayonlarni to'xtatish...

taskkill /F /FI "WINDOWTITLE eq *Upload Server*" 2>nul
taskkill /F /FI "WINDOWTITLE eq *Vite*" 2>nul
taskkill /F /FI "WINDOWTITLE eq *Bot API*" 2>nul
taskkill /F /FI "WINDOWTITLE eq *Telegram Bot*" 2>nul
taskkill /F /FI "WINDOWTITLE eq *Auto Sync*" 2>nul

timeout /t 2 /nobreak >nul

echo    ✓ To'xtatildi
echo.

REM ============================================================================
REM 3. PAPKALAR YARATISH
REM ============================================================================

echo [3/8] Papkalarni tayyorlash...

if not exist "public\videos" mkdir "public\videos"
if not exist "public\image" mkdir "public\image"
if not exist "public\data" mkdir "public\data"
if not exist "public\data\videos.json" echo [] > "public\data\videos.json"
if not exist "logs" mkdir "logs"

echo    ✓ Tayyor
echo.

REM ============================================================================
REM 4. DEPENDENCIES TEKSHIRISH
REM ============================================================================

echo [4/8] Dependencies tekshirish...

if not exist "node_modules" (
    echo    📦 Frontend dependencies...
    call npm install --silent
    if %ERRORLEVEL% NEQ 0 (
        echo    ❌ npm install xato!
        pause
        exit /b 1
    )
) else (
    echo    ✓ Frontend dependencies mavjud
)

if exist "telegram-video-bot" (
    if not exist "telegram-video-bot\venv" (
        echo    📦 Bot virtual environment...
        cd telegram-video-bot
        python -m venv venv
        call venv\Scripts\activate.bat
        pip install -r requirements.txt -q
        cd ..
    ) else (
        echo    ✓ Bot dependencies mavjud
    )
)

echo.

REM ============================================================================
REM 5. UPLOAD SERVER
REM ============================================================================

echo [5/8] 📤 Upload Server ishga tushirish (Port 3001)...

start "📤 Upload Server - Port 3001" cmd /k "title Upload Server && echo. && echo ============================================ && echo   UPLOAD SERVER RUNNING && echo ============================================ && echo. && echo Server: http://localhost:3001 && echo API: http://localhost:3001/api/upload && echo Auto-Download: http://localhost:3001/api/auto-download && echo Health: http://localhost:3001/api/health && echo. && echo Press Ctrl+C to stop && echo ============================================ && echo. && node upload-server.js"

timeout /t 3 /nobreak >nul

echo    ✓ Upload Server ishga tushdi
echo.

REM ============================================================================
REM 6. VITE DEV SERVER
REM ============================================================================

echo [6/8] 🎨 Website ishga tushirish (Port 5173)...

start "🎨 Vite Dev Server - Port 5173" cmd /k "title Vite Dev Server && echo. && echo ============================================ && echo   WEBSITE RUNNING && echo ============================================ && echo. && echo Website: http://localhost:5173 && echo Admin: http://localhost:5173/admin && echo Templates: http://localhost:5173/templates && echo Downloader: http://localhost:5173/video-downloader && echo. && echo Press Ctrl+C to stop && echo ============================================ && echo. && npm run dev"

timeout /t 3 /nobreak >nul

echo    ✓ Website ishga tushdi
echo.

REM ============================================================================
REM 7. TELEGRAM BOT
REM ============================================================================

echo [7/8] 🤖 Telegram Bot ishga tushirish...

if exist "telegram-video-bot" (
    if exist "telegram-video-bot\bot.py" (
        cd telegram-video-bot
        if exist "venv" (
            start "🤖 Telegram Bot" cmd /k "title Telegram Bot && call venv\Scripts\activate.bat && echo. && echo ============================================ && echo   TELEGRAM BOT RUNNING && echo ============================================ && echo. && echo Bot: @CD_Video_Downloaderbot && echo Status: Running && echo. && echo Press Ctrl+C to stop && echo ============================================ && echo. && python bot.py"
        ) else (
            start "🤖 Telegram Bot" cmd /k "title Telegram Bot && echo. && echo ============================================ && echo   TELEGRAM BOT RUNNING && echo ============================================ && echo. && echo Bot: @CD_Video_Downloaderbot && echo Status: Running && echo. && echo Press Ctrl+C to stop && echo ============================================ && echo. && python bot.py"
        )
        cd ..
        timeout /t 3 /nobreak >nul
        echo    ✓ Telegram Bot ishga tushdi
    ) else (
        echo    ⚠  bot.py topilmadi
    )
) else (
    echo    ⚠  telegram-video-bot papkasi yo'q
)

echo.

REM ============================================================================
REM 8. BOT API SERVER
REM ============================================================================

if exist "telegram-video-bot\api_enhanced.py" (
    echo [8/9] 🌐 Bot API Server ishga tushirish (Port 8000)...
    
    cd telegram-video-bot
    if exist "venv" (
        start "🌐 Bot API Server - Port 8000" cmd /k "title Bot API Server && call venv\Scripts\activate.bat && echo. && echo ============================================ && echo   BOT API SERVER RUNNING && echo ============================================ && echo. && echo API: http://localhost:8000 && echo Docs: http://localhost:8000/api/docs && echo. && echo Press Ctrl+C to stop && echo ============================================ && echo. && python api_enhanced.py"
    ) else (
        start "🌐 Bot API Server - Port 8000" cmd /k "title Bot API Server && echo. && echo ============================================ && echo   BOT API SERVER RUNNING && echo ============================================ && echo. && echo API: http://localhost:8000 && echo Docs: http://localhost:8000/api/docs && echo. && echo Press Ctrl+C to stop && echo ============================================ && echo. && python api_enhanced.py"
    )
    cd ..
    timeout /t 3 /nobreak >nul
    
    echo    ✓ Bot API Server ishga tushdi
) else (
    echo [8/9] ⚠  Bot API Server topilmadi
)

echo.

REM ============================================================================
REM 9. AUTO SYNC (Optional)
REM ============================================================================

if exist "auto_sync.py" (
    echo [9/9] 🔄 Auto Sync ishga tushirish...
    
    if exist "sync-config.json" (
        start "🔄 Auto Sync - Creative Design" cmd /k "title Auto Sync && echo. && echo ============================================ && echo   AUTO SYNC RUNNING && echo ============================================ && echo. && echo Syncing: localhost → creative-design.uz && echo Interval: 60 seconds && echo. && echo Press Ctrl+C to stop && echo ============================================ && echo. && python auto_sync.py"
        timeout /t 3 /nobreak >nul
        echo    ✓ Auto Sync ishga tushdi
    ) else (
        echo    ⚠  sync-config.json yo'q (Auto Sync o'tkazib yuborildi)
        echo       AUTO_SYNC_GUIDE.md ni o'qing
    )
) else (
    echo [9/9] ⚠  auto_sync.py yo'q
)

echo.

REM ============================================================================
REM 10. NATIJA
REM ============================================================================

timeout /t 3 /nobreak >nul

echo ============================================
echo   🎉 HAMMA NARSA ISHLAYAPTI!
echo ============================================
echo.
echo   ISHLAYOTGAN XIZMATLAR:
echo   ┌──────────────────────────────────────────────┐
echo   │ 📤 Upload Server   : http://localhost:3001   │
echo   │ 🎨 Website         : http://localhost:5173   │
echo   │ 🌐 Bot API         : http://localhost:8000   │
echo   │ 🤖 Telegram Bot    : @CD_Video_Downloaderbot │
if exist "auto_sync.py" (
    if exist "sync-config.json" (
        echo   │ 🔄 Auto Sync       : Ishlayapti                │
    )
)
echo   └──────────────────────────────────────────────┘
echo.
echo   ACCESS POINTS:
echo   • Website: http://localhost:5173
echo   • Admin Panel: http://localhost:5173/admin
echo   • Templates: http://localhost:5173/templates
echo   • Video Downloader: http://localhost:5173/video-downloader
echo   • Bot API Docs: http://localhost:8000/api/docs
echo   • Telegram Bot: @CD_Video_Downloaderbot
echo.
echo   ADMIN LOGIN:
echo   • Username: admin
echo   • Password: creative2026
echo.
echo   AUTO DOWNLOAD:
echo   • Instagram: https://instagram.com/reel/...
echo   • YouTube: https://youtube.com/watch?v=...
echo   • Admin panelda "Avto Yuklash" tugmasi
echo.
echo   ⚠️  DIQQAT:
echo       Bu oynalarni yopmang! Hamma xizmatlar shu orqali ishlaydi.
echo.
echo   📁 FAYLLAR:
echo   • Videos: %CD%\public\videos\
echo   • Images: %CD%\public\image\
echo   • Data: %CD%\public\data\videos.json
echo   • Logs: %CD%\logs\
echo.
echo ============================================
echo.
echo   📖 HUJJATLAR:
echo   • README_SUPER_SERVER.md - To'liq qo'llanma
echo   • QUICK_START_UZ.md - Tezkor start
echo   • AUTO_SYNC_GUIDE.md - Auto-sync yo'riqnomasi
echo   • DEPLOY_GUIDE.md - Productionga yuklash
echo.
echo ============================================
echo.
echo   🎯 KEYINGI QADAM:
echo.
echo   1. Browserda oching: http://localhost:5173
echo.
echo   2. Admin panel: http://localhost:5173/admin
echo.
echo   3. Instagram/YouTube linkni tashlang
echo.
echo   4. "🚀 Avto Yuklash" ni bosing
echo.
echo   5. Tayyor! Video templatesga qo'shildi!
echo.
echo ============================================
echo.

pause
