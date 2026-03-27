@echo off
setlocal enabledelayedexpansion

:: Get the directory where this batch file is located
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

echo ========================================
echo   Telegram Video Downloader Bot
echo   Quick Start Menu
echo ========================================
echo.

:menu
echo.
echo Select an option:
echo.
echo === Bot Control ===
echo 1. Start Bot
echo 2. Stop Bot
echo 3. Restart Bot
echo.
echo === Bot API Server (2GB uploads) ===
echo 4. Start Bot API Server
echo 5. Stop Bot API Server
echo 6. Check API Server Status
echo.
echo === Other ===
echo 7. View Bot Logs
echo 8. Exit
echo.
set /p choice="Enter your choice (1-8): "

if "%choice%"=="1" goto startbot
if "%choice%"=="2" goto stopbot
if "%choice%"=="3" goto restartbot
if "%choice%"=="4" goto startapi
if "%choice%"=="5" goto stopapi
if "%choice%"=="6" goto statusapi
if "%choice%"=="7" goto logs
if "%choice%"=="8" goto end
echo Invalid choice. Try again.
goto menu

:startbot
echo.
echo Starting Telegram Bot...
echo.
start "Telegram Bot" "%SCRIPT_DIR%..\Python\Python312\python.exe" bot.py
timeout /t 3 /nobreak >nul 2>&1 || ping 127.0.0.1 -n 3 >nul
type bot.log 2>nul | findstr /C:"INFO" | more +5
echo.
echo Bot started! Press any key to continue...
pause >nul
goto menu

:stopbot
echo.
echo Stopping Telegram Bot...
taskkill /F /FI "WINDOWTITLE eq Telegram Bot*" 2>nul
taskkill /F /IM python.exe 2>nul | findstr /V "python.exe"
echo Bot stopped.
echo.
pause
goto menu

:restartbot
echo.
echo Restarting Telegram Bot...
taskkill /F /FI "WINDOWTITLE eq Telegram Bot*" 2>nul
taskkill /F /IM python.exe 2>nul
timeout /t 2 /nobreak >nul 2>&1 || ping 127.0.0.1 -n 3 >nul
start "Telegram Bot" "%SCRIPT_DIR%..\Python\Python312\python.exe" bot.py
echo Bot restarted.
echo.
pause
goto menu

:startapi
echo.
echo Starting Bot API Server...
echo.
docker compose up -d
echo.
echo Waiting for server to start...
timeout /t 5 /nobreak >nul 2>&1 || ping 127.0.0.1 -n 6 >nul
docker compose ps
echo.
echo IMPORTANT: You need to get API ID and Hash from my.telegram.org/apps
echo Edit bot-api.env file with your credentials.
echo.
pause
goto menu

:stopapi
echo.
echo Stopping Bot API Server...
docker compose down
echo API Server stopped.
echo.
pause
goto menu

:statusapi
echo.
echo Bot API Server Status:
echo.
docker compose ps
echo.
echo Logs:
docker compose logs --tail=20
echo.
pause
goto menu

:logs
echo.
echo === Last 30 Bot Log Lines ===
echo.
powershell -Command "Get-Content bot.log -Tail 30"
echo.
pause
goto menu

:end
echo.
echo Goodbye!
echo.
