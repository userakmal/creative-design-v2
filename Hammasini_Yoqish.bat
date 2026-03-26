@echo off
title BARCHASINI BIRGA YOQISH (Admin + Video Server + Bot)
color 0E

echo ===================================================
echo   LOYYHANI TO'LIQ ISHGA TUSHIRISH BOSHLANDI...
echo ===================================================

echo 1. Video Server va Tunnel ishga tushirilyapti...
start "Video Server" cmd /k "cd local-video-api && node server.js"

timeout /t 3

echo 2. Admin (Upload) Server ishga tushirilyapti...
start "Admin Server" cmd /k "node admin-server.js"

timeout /t 3

echo 3. Telegram Bot ishga tushirilyapti...
start "Telegram Bot" cmd /k "node bot.cjs"

echo.
echo ---------------------------------------------------
echo HI-TECH: Barcha serverlar alohida oynalarda ochildi.
echo Iltimos, u oynalarni yopmang!
echo ---------------------------------------------------
echo.
pause
