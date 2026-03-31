@echo off
setlocal enabledelayedexpansion

:: ============================================================================
:: CREATIVE DESIGN - SUPER SERVER
:: Bitta faylda barcha loyihalar: Website + Telegram Bot + Upload Server
:: ============================================================================

title 🚀 CREATIVE DESIGN - SUPER SERVER
color 0A

:: Loyiha papkasi
set "PROJECT_DIR=%~dp0"
set "BOT_DIR=%PROJECT_DIR%telegram-video-bot"

:: Portlar
set "WEB_PORT=5173"
set "UPLOAD_PORT=3001"
set "BOT_API_PORT=8000"

:: Log papkalari
set "LOG_DIR=%PROJECT_DIR%logs"
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

echo.
echo ============================================================================
echo                     CREATIVE DESIGN - SUPER SERVER
echo                     All-in-One Launch System
echo ============================================================================
echo.

:: ============================================================================
:: 1. TEKSHIRISH
:: ============================================================================

echo [1/6] Tizimni tekshirish...

:: Node.js tekshirish
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ XATO: Node.js o'rnatilmagan!
    echo    Yuklab oling: https://nodejs.org/
    pause
    exit /b 1
)

echo    ✓ Node.js: 
node --version

:: Python tekshirish (bot uchun)
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo    ⚠ Python topilmadi (Telegram bot ishlamasligi mumkin)
) else (
    echo    ✓ Python: 
    python --version
)

:: Docker tekshirish (bot API uchun)
where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo    ⚠ Docker topilmadi (Bot API Docker rejimi ishlamasligi mumkin)
) else (
    echo    ✓ Docker: 
    docker --version
)

echo.

:: ============================================================================
:: 2. KERAKLI PAPKALAR
:: ============================================================================

echo [2/6] Papkalarni tayyorlash...

:: Public papkalar
if not exist "%PROJECT_DIR%public\videos" mkdir "%PROJECT_DIR%public\videos"
if not exist "%PROJECT_DIR%public\image" mkdir "%PROJECT_DIR%public\image"
if not exist "%PROJECT_DIR%public\data" mkdir "%PROJECT_DIR%public\data"

:: videos.json yaratish (agar yo'q bo'lsa)
if not exist "%PROJECT_DIR%public\data\videos.json" (
    echo [] > "%PROJECT_DIR%public\data\videos.json"
    echo    ✓ videos.json yaratildi
)

:: Logs
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

echo    ✓ Barcha papkalar tayyor
echo.

:: ============================================================================
:: 3. dependencies TEKSHIRISH
:: ============================================================================

echo [3/6] Dependencies tekshirish...

if not exist "%PROJECT_DIR%node_modules" (
    echo    📦 Frontend dependencies o'rnatilmoqda...
    cd /d "%PROJECT_DIR%"
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ XATO: npm install muvaffaqiyatsiz!
        pause
        exit /b 1
    )
) else (
    echo    ✓ Frontend dependencies mavjud
)

if exist "%BOT_DIR%" (
    if not exist "%BOT_DIR%venv" (
        echo    📦 Bot dependencies o'rnatilmoqda...
        cd /d "%BOT_DIR%"
        python -m venv venv
        if %ERRORLEVEL% EQU 0 (
            call venv\Scripts\activate.bat
            pip install -r requirements.txt
            deactivate
        )
    ) else (
        echo    ✓ Bot dependencies mavjud
    )
)

cd /d "%PROJECT_DIR%"
echo.

:: ============================================================================
:: 4. TUNNEL SOZLAMALARI (Localtunnel)
:: ============================================================================

echo [4/6] Tunnel sozlamalari...
echo.
echo    DIQQAT: Internetga chiqish uchun tunnel kerak!
echo.
echo    Variantlar:
echo    1. Localtunnel (avtomatik)
echo    2. Ngrok (qo'lda)
echo    3. Faqat lokal (tunnelsiz)
echo.
set /p TUNNEL_CHOICE="Tanlang (1/2/3): "

if "%TUNNEL_CHOICE%"=="1" (
    echo    📡 Localtunnel o'rnatilmoqda...
    call npm install -g localtunnel 2>nul
    set "USE_TUNNEL=yes"
    echo    ✓ Tunnel tayyor
) else if "%TUNNEL_CHOICE%"=="2" (
    set "USE_TUNNEL=ngrok"
    echo    ⚠ Ngrok ni o'zingiz sozlashingiz kerak
) else (
    set "USE_TUNNEL=no"
    echo    ✓ Faqat lokal rejim
)

echo.

:: ============================================================================
:: 5. XIZMATLARNI ISHGA TUSHIRISH
:: ============================================================================

echo [5/6] Xizmatlarni ishga tushirish...
echo.

:: 5.1 UPLOAD SERVER
echo    🚀 [1/4] Upload Server (Port %UPLOAD_PORT%)...
start "📤 Upload Server" cmd /k "cd /d %PROJECT_DIR% && echo Upload Server ishga tushdi... && node upload-server.js"
timeout /t 2 /nobreak >nul
echo    ✓ Upload Server ishga tushdi

:: 5.2 VITE DEV SERVER
echo    🎨 [2/4] Vite Dev Server (Port %WEB_PORT%)...
start "🌐 Vite Dev Server" cmd /k "cd /d %PROJECT_DIR% && echo Website ishga tushdi... && npm run dev"
timeout /t 3 /nobreak >nul
echo    ✓ Vite Dev Server ishga tushdi

:: 5.3 TELEGRAM BOT (agar mavjud bo'lsa)
if exist "%BOT_DIR%" (
    echo    🤖 [3/4] Telegram Bot...
    
    :: Bot API Server (Docker)
    if exist "%BOT_DIR%docker-compose.yml" (
        cd /d "%BOT_DIR%"
        docker compose up -d 2>nul
        if %ERRORLEVEL% EQU 0 (
            echo    ✓ Bot API Docker container ishga tushdi
        ) else (
            echo    ⚠ Docker container ishga tushmadi
        )
        cd /d "%PROJECT_DIR%"
    )
    
    :: Python Bot
    if exist "%BOT_DIR%bot.py" (
        start "🤖 Telegram Bot" cmd /k "cd /d %BOT_DIR% && echo Bot ishga tushdi... && python bot.py"
        timeout /t 2 /nobreak >nul
        echo    ✓ Telegram Bot ishga tushdi
    )
) else (
    echo    ⚠ Telegram bot papkasi topilmadi
)

:: 5.4 TUNNEL (agar tanlangan bo'lsa)
if "%USE_TUNNEL%"=="yes" (
    echo    🌐 [4/4] Localtunnel ochilmoqda...
    start "🌍 Localtunnel" cmd /k "cd /d %PROJECT_DIR% && echo Tunnel ochilmoqda... && lt --port %WEB_PORT%"
    timeout /t 5 /nobreak >nul
    echo    ✓ Tunnel ochilmoqda (bir necha soniya kuting)
)

echo.

:: ============================================================================
:: 6. NATIJA
:: ============================================================================

echo [6/6] Tayyor!
echo.
echo ============================================================================
echo                         HAMMA NARSA ISHLAYAPTI!
echo ============================================================================
echo.
echo    📊 XIZMATLAR:
echo    ┌────────────────────────────────────────────────────────────┐
echo    │ 📤 Upload Server   : http://localhost:%UPLOAD_PORT%                  │
echo    │ 🌐 Website         : http://localhost:%WEB_PORT%                  │
echo    │ 🤖 Telegram Bot    : Ishlayapti (agar o'rnatilgan bo'lsa)   │
if "%USE_TUNNEL%"=="yes" (
    echo    │ 🌍 Public URL      : Bir necha soniyadan keyin ko'rinadi    │
)
echo    └────────────────────────────────────────────────────────────┘
echo.
echo    📱 ADMIN PANEL:
echo    • Lokal: http://localhost:%WEB_PORT%/admin
if "%USE_TUNNEL%"=="yes" (
    echo    • Online: tunnel URL + /admin (bir necha soniyadan keyin)
)
echo.
echo    🔐 LOGIN:
echo    • Username: admin
echo    • Password: creative2026
echo.
echo ============================================================================
echo.
echo    📁 FAYLLAR:
echo    • Videolar: %PROJECT_DIR%public\videos\
echo    • Rasmlar:  %PROJECT_DIR%public\image\
echo    • Loglar:   %PROJECT_DIR%logs\
echo.
echo ============================================================================
echo.
echo    ⚠️  DIQQAT:
echo    • Bu oynani yopmang! Barcha xizmatlar shu orqali ishlaydi.
echo    • To'xtatish uchun: Ctrl+C yoki oynani yoping
echo.
echo    🎯 QISQA BUYRUQLAR:
echo    • F5: Saytni yangilash
echo    • Upload Server: Port %UPLOAD_PORT% da
echo    • Admin: /admin sahifasi
echo.
echo ============================================================================
echo.

:: ============================================================================
:: MONITORING LOOP
:: ============================================================================

:monitor
timeout /t 60 >nul

:: Upload server tekshirish
curl -s http://localhost:%UPLOAD_PORT%/api/health >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  Upload Server o'chgan! Qayta ishga tushirilmoqda...
    start "📤 Upload Server" cmd /k "cd /d %PROJECT_DIR% && node upload-server.js"
)

goto monitor

:: ============================================================================
:: TO'XTATISH
:: ============================================================================

:cleanup
echo.
echo ============================================================================
echo                         TO'XTATILMOQDA...
echo ============================================================================
echo.

:: Barcha ochilgan oynalarni yopish
taskkill /F /FI "WINDOWTITLE eq Upload Server*" 2>nul
taskkill /F /FI "WINDOWTITLE eq Vite Dev Server*" 2>nul
taskkill /F /FI "WINDOWTITLE eq Telegram Bot*" 2>nul
taskkill /F /FI "WINDOWTITLE eq Localtunnel*" 2>nul

echo ✓ Barcha xizmatlar to'xtatildi
echo.
echo Rahmat! Yana kutib olamiz! 😊
echo.
timeout /t 2 >nul
exit /b 0

:: Ctrl+C bosilganda
ctrlc
goto cleanup

endlocal
