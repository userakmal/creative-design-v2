@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   Telegram Bot API Server
echo   2GB Upload Support
echo ========================================
echo.

:: Configuration
set API_ID=25312826
set API_HASH=b4432c8746904c09d8668fa1cdc4149f
set BOT_TOKEN=8628132129:AAGuU0M2KaZJATpyINnh4xpGoQyXU6uuFso
set PORT=8081

echo Configuration:
echo   API ID:    %API_ID%
echo   API Hash:  %API_HASH%
echo   Bot Token: %BOT_TOKEN:~0,15%...
echo   Port:      %PORT%
echo.

:: Create server directory
if not exist "bot-api-server" mkdir "bot-api-server"
cd bot-api-server

:: Check if binary exists
if exist "telegram-bot-api.exe" (
    echo Bot API Server binary found.
) else (
    echo Bot API Server binary not found.
    echo.
    echo Please download telegram-bot-api from:
    echo https://github.com/tdorgachev/telegram-bot-api/releases
    echo.
    echo Or use Docker:
    echo   docker-compose up -d
    echo.
    pause
    exit /b 1
)

echo.
echo Starting Bot API Server on http://localhost:%PORT%
echo Press Ctrl+C to stop
echo.

:: Start the server
telegram-bot-api.exe --api-id=%API_ID% --api-hash=%API_HASH% --bot-token=%BOT_TOKEN% --server=0.0.0.0 --port=%PORT%

pause
