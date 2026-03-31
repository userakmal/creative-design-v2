@echo off
REM Telegram Video Downloader Bot - Starter Script
REM This script starts the bot with proper environment

TITLE Telegram Video Downloader Bot

cd /d "C:\Users\Acer\OneDrive\Desktop\creative-design-main\telegram-video-bot"

echo ============================================
echo  Telegram Video Downloader Bot
echo  Starting...
echo ============================================
echo.

REM Check if cookies.txt exists
if not exist "cookies.txt" (
    echo WARNING: cookies.txt not found!
    echo YouTube downloads may fail.
    echo Please export cookies from browser and place cookies.txt in:
    echo C:\Users\Acer\OneDrive\Desktop\creative-design-main\telegram-video-bot
    echo.
    pause
)

REM Start the bot
python bot.py

pause
