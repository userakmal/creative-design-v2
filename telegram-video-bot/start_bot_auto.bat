@echo off
REM =====================================================
REM Telegram Video Downloader Bot - Auto-Restart Script
REM =====================================================
REM This script automatically restarts the bot if it crashes.
REM It will run in an infinite loop with 5-second delay between restarts.
REM =====================================================

TITLE Telegram Video Downloader Bot - Auto-Restart

echo ============================================
echo  Telegram Video Downloader Bot
echo  Auto-Restart Service
echo ============================================
echo.
echo  Starting bot...
echo  Press Ctrl+C to stop the bot service.
echo.

:restart_bot

REM Get the directory where this batch file is located
set "SCRIPT_DIR=%~dp0"

REM Navigate to bot directory
cd /d "%SCRIPT_DIR%"

REM Start Docker Bot API Server (for 2GB uploads)
echo [%DATE% %TIME%] Starting Telegram Bot API Server via Docker... >> bot_autorestart.log
echo Starting Telegram Bot API Server...
docker compose up -d >> bot_autorestart.log 2>&1
if %ERRORLEVEL% neq 0 (
    echo [%DATE% %TIME%] WARNING: Docker compose failed to start. Continuing with bot startup... >> bot_autorestart.log
    echo WARNING: Docker compose failed. Bot will run with standard 50MB limit.
) else (
    echo [%DATE% %TIME%] Docker Bot API Server started successfully. >> bot_autorestart.log
    echo Bot API Server started - 2GB uploads enabled!
    REM Wait for container to be ready
    timeout /t 5 /nobreak >nul
)

REM Log the start time
echo [%DATE% %TIME%] Starting bot... >> bot_autorestart.log

REM Run the bot
python bot.py >> bot_autorestart.log 2>&1

REM Capture exit code
set EXIT_CODE=%ERRORLEVEL%

REM Log the crash/restart
echo [%DATE% %TIME%] Bot exited with code %EXIT_CODE%. Restarting in 5 seconds... >> bot_autorestart.log
echo.
echo  [%TIME%] Bot stopped (exit code: %EXIT_CODE%)
echo  Waiting 5 seconds before restart...
echo.

REM Wait 5 seconds before restart
timeout /t 5 /nobreak >nul

REM Loop back and restart
goto restart_bot
