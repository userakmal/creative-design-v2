@echo off
color 0A
cd /d "%~dp0"

title 🚀 Master Launcher - Creative Design Ecosystem

echo ============================================
echo   🚀 CREATIVE DESIGN ECOSYSTEM LAUNCHER
echo   Starting All Services...
echo ============================================
echo.

echo [1/3] Starting Docker Bot API Server...
cd telegram-video-bot
docker compose up -d
cd ..
echo       ✓ Docker container started!
echo.

echo [WAIT] Waiting 10 seconds for Bot API Server to fully initialize...
timeout /t 10 /nobreak
echo       ✓ Bot API Server ready!
echo.

echo [2/3] Launching FastAPI Web Server...
start "🌐 FastAPI Web Server" cmd /k "cd /d "%~dp0telegram-video-bot" && python api.py"
echo       ✓ FastAPI server launching in new window!
echo.

echo [3/3] Launching Telegram Video Bot...
if exist "telegram-video-bot\start_bot_auto.bat" (
    start "🤖 Telegram Video Bot" cmd /k "cd /d "%~dp0telegram-video-bot" && start_bot_auto.bat"
) else (
    start "🤖 Telegram Video Bot" cmd /k "cd /d "%~dp0telegram-video-bot" && python bot.py"
)
echo       ✓ Telegram bot launching in new window!
echo.

echo ============================================
echo   ✅ ALL SERVICES STARTED SUCCESSFULLY!
echo ============================================
echo.
echo   Services running:
echo   • Docker Bot API Server (Port 8081)
echo   • FastAPI Web Server
echo   • Telegram Video Bot
echo.
echo   This window will close in 3 seconds...
timeout /t 3 >nul
exit
