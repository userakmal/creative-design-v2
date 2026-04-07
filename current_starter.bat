@echo off
chcp 65001 >nul 2>&1
title Creative Design - Barcha Xizmatlar
color 0A

echo.
echo =========================================================
echo       CREATIVE DESIGN - PROJECT STARTER
echo =========================================================
echo.

cd /d "%~dp0"

:: 1. Tekshirish
echo [1/3] Tizim tekshirilmoqda...
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [XATO] Node.js topilmadi!
    pause & exit /b 1
)

where python >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [XATO] Python topilmadi!
    pause & exit /b 1
)
echo       OK (Node.js va Python mavjud)
echo.

:: 2. Eski jarayonlarni yopish
echo [2/3] Xotirani tozalash...
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr ":5173 " ^| findstr "LISTENING"') do taskkill /PID %%p /F >nul 2>&1
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr ":3001 " ^| findstr "LISTENING"') do taskkill /PID %%p /F >nul 2>&1
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr ":8000 " ^| findstr "LISTENING"') do taskkill /PID %%p /F >nul 2>&1
echo       OK
echo.

:: 3. Xizmatlarni ishga tushirish
echo [3/3] Xizmatlar ishga tushirilyapti...

:: Dastlabki frontend va backend
start "Frontend & Upload Server" /min cmd /c "cd /d %~dp0 && npm run dev 2>&1"
timeout /t 3 /nobreak >nul

:: API va Bot
if not exist "telegram-video-bot\downloads" mkdir telegram-video-bot\downloads
start "Video API" /min cmd /c "cd /d %~dp0\telegram-video-bot && call venv\Scripts\activate.bat && python api.py 2>&1"
timeout /t 2 /nobreak >nul

start "Telegram Bot" /min cmd /c "cd /d %~dp0\telegram-video-bot && call venv\Scripts\activate.bat && python bot.py 2>&1"
timeout /t 2 /nobreak >nul

echo.
echo =========================================================
echo   BARCHA XIZMATLAR TAYYOR VA ISHLAMOQDA!
echo.
echo   Web sayt   :  http://localhost:5173
echo   Admin      :  http://localhost:5173/admin
echo   Downloader :  http://localhost:5173/video-downloader
echo   Video API  :  http://localhost:8000/api/docs
echo =========================================================
echo.
echo Yopish uchun ushbu oynani yopib yuboring.
pause
