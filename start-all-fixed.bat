@echo off
echo ========================================
echo Creative Design Platform - Start All
echo ========================================
echo.

REM Start API Server
echo [1/3] Starting API Server on port 3001...
start "API Server" cmd /k "cd api-server && npm start"
timeout /t 3 /nobreak > nul

REM Start Client
echo [2/3] Starting Client on port 5173...
start "Client" cmd /k "cd client && npm run dev"
timeout /t 3 /nobreak > nul

REM Start Telegram Bot
echo [3/3] Starting Telegram Video Bot...
start "Telegram Bot" cmd /k "cd telegram-video-bot && python bot.py"

echo.
echo ========================================
echo All services started!
echo ========================================
echo.
echo Services:
echo   - API Server: http://localhost:3001
echo   - Client: http://localhost:5173
echo   - Admin Panel: http://localhost:5173/admin
echo   - Telegram Bot: Running in background
echo.
echo Press any key to stop all services...
pause > nul

echo.
echo Stopping all services...
taskkill /FI "WindowTitle eq API Server*" /T /F > nul 2>&1
taskkill /FI "WindowTitle eq Client*" /T /F > nul 2>&1
taskkill /FI "WindowTitle eq Telegram Bot*" /T /F > nul 2>&1
echo All services stopped!
