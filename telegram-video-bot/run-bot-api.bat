@echo off
echo ========================================
echo   Telegram Bot API Server - Quick Start
echo ========================================
echo.
echo This script will download and run the Bot API Server directly.
echo.
echo Your configuration:
echo   API ID:    25312826
echo   API Hash:  b4432c8746904c09d8668fa1cdc4149f
echo   Bot Token: 8628132129:AAG...Fso
echo.
pause

echo.
echo Downloading Bot API Server...
echo.

:: Create directory
mkdir "bot-api-server" 2>nul
cd bot-api-server

:: Download latest release (using a pre-built version)
echo Downloading from GitHub releases...
powershell -Command "& {Invoke-WebRequest -Uri 'https://github.com/tdorgachev/telegram-bot-api/releases/download/6.9.0/telegram-bot-api-6.9.0-windows-x86_64.exe' -OutFile 'telegram-bot-api.exe'}"

if not exist "telegram-bot-api.exe" (
    echo.
    echo Download failed. Please check your internet connection.
    pause
    exit /b 1
)

echo.
echo Starting Bot API Server...
echo Server will run on http://localhost:8081
echo.
echo Press Ctrl+C to stop the server.
echo.

:: Start the server
telegram-bot-api.exe --api-id=25312826 --api-hash=b4432c8746904c09d8668fa1cdc4149f --bot-token=8628132129:AAGuU0M2KaZJATpyINnh4xpGoQyXU6uuFso --server=0.0.0.0 --port=8081

pause
