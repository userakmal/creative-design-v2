@echo off
echo Stopping all Creative Design services...
echo.

taskkill /FI "WindowTitle eq API Server*" /T /F > nul 2>&1
taskkill /FI "WindowTitle eq Client*" /T /F > nul 2>&1
taskkill /FI "WindowTitle eq Telegram Bot*" /T /F > nul 2>&1
taskkill /FI "WindowTitle eq creative-design*" /T /F > nul 2>&1

echo All services stopped!
pause
