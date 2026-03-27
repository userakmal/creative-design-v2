@echo off
echo ========================================
echo   Telegram Bot API Server Manager
echo ========================================
echo.

:menu
echo.
echo Select an option:
echo 1. Start Bot API Server
echo 2. Stop Bot API Server
echo 3. Restart Bot API Server
echo 4. Check Status
echo 5. Exit
echo.
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" goto start
if "%choice%"=="2" goto stop
if "%choice%"=="3" goto restart
if "%choice%"=="4" goto status
if "%choice%"=="5" goto end
echo Invalid choice. Try again.
goto menu

:start
echo.
echo Starting Bot API Server...
echo.
docker-compose up -d
echo.
echo Server started! Wait 10 seconds before using.
echo.
pause
goto menu

:stop
echo.
echo Stopping Bot API Server...
echo.
docker-compose down
echo.
echo Server stopped.
echo.
pause
goto menu

:restart
echo.
echo Restarting Bot API Server...
echo.
docker-compose restart
echo.
echo Server restarted.
echo.
pause
goto menu

:status
echo.
echo Bot API Server Status:
echo.
docker-compose ps
echo.
pause
goto menu

:end
