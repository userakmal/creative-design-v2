@echo off
title Creative Design - Loyihani Ishga Tushirish
color 0b
cd /d "%~dp0"

echo ===================================================
echo     CREATIVE DESIGN - BARCHA XIZMATLAR
echo ===================================================
echo.
echo [1/4] Upload Server (Port 3001) ishga tushirilmoqda...
start "Upload Server (3001)" cmd /k "node upload-server.js"

echo [2/4] Web Sayt (Port 5173) ishga tushirilmoqda...
start "Web Sayt (5173)" cmd /k "npm run dev"

echo [3/4] Video API (Port 8000) ishga tushirilmoqda...
cd telegram-video-bot
if exist "api_enhanced.py" (
    start "Video API (8000)" cmd /k "call venv\Scripts\activate.bat && python api_enhanced.py"
) else (
    start "Video API (8000)" cmd /k "call venv\Scripts\activate.bat && python api.py"
)

echo [4/4] Telegram Bot ishga tushirilmoqda...
start "Telegram Bot" cmd /k "call venv\Scripts\activate.bat && python bot.py"
cd ..

echo.
echo ===================================================
echo   BARCHA XIZMATLAR MUVAFFAQIYATLI ISHGA TUSHDI!
echo ===================================================
echo   Web sayt   : http://localhost:5173
echo   Admin Panel: http://localhost:5173/admin
echo   Upload API : http://localhost:3001
echo   Video API  : http://localhost:8000/api/docs
echo ===================================================
echo.
echo   DIQQAT: Ochilgan qora oynalarni yopmang!
echo   Ular yopilsa, loyiha ishlashdan to'xtaydi.
echo.
echo   Dasturni to'liq to'xtatish uchun hamma qora oynalarni yoping.
echo.
echo Ushbu oynani yopishingiz mumkin.
pause >nul
exit
