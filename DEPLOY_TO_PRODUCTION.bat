@echo off
:: Localhostdan Productionga Video Sync
:: Yuklangan videolarni serverga ko'chirish

title 📤 DEPLOY TO PRODUCTION
color 0B

cd /d "%~dp0"

echo ============================================
echo   📤 DEPLOY VIDEOS TO PRODUCTION
echo   creative-design.uz
echo ============================================
echo.

REM 1. Check if rsync is available
where rsync >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ rsync topilmadi!
    echo.
    echo    WSL yoki Git Bash o'rnating:
    echo    https://git-scm.com/download/win
    echo.
    echo    Yoki FTP orqali yuklang (VARIANT 2)
    pause
    exit /b 1
)

REM 2. Get server credentials
echo Server ma'lumotlari:
set /p SERVER_USER="Username (root): "
if "%SERVER_USER%"=="" set SERVER_USER=root

set /p SERVER_HOST="Server IP yoki domain: "
if "%SERVER_HOST%"=="" set SERVER_HOST=creative-design.uz

set /p SERVER_PATH="Server path (/var/www/creative-design): "
if "%SERVER_PATH%"=="" set SERVER_PATH=/var/www/creative-design

echo.
echo ============================================
echo   Sync boshlanmoqda...
echo ============================================
echo.

REM 3. Sync videos
echo [1/3] Videolar yuklanmoqda...
rsync -avz --progress public/videos/ %SERVER_USER%@%SERVER_HOST%:%SERVER_PATH%/public/videos/
if %ERRORLEVEL% EQU 0 (
    echo       ✅ Videolar yuklandi
) else (
    echo       ❌ Videolar yuklashda xatolik
)
echo.

REM 4. Sync images
echo [2/3] Rasmlar yuklanmoqda...
rsync -avz --progress public/image/ %SERVER_USER%@%SERVER_HOST%:%SERVER_PATH%/public/image/
if %ERRORLEVEL% EQU 0 (
    echo       ✅ Rasmlar yuklandi
) else (
    echo       ❌ Rasmlar yuklashda xatolik
)
echo.

REM 5. Sync videos.json
echo [3/3] videos.json yuklanmoqda...
rsync -avz --progress public/data/videos.json %SERVER_USER%@%SERVER_HOST%:%SERVER_PATH%/public/data/
if %ERRORLEVEL% EQU 0 (
    echo       ✅ videos.json yuklandi
) else (
    echo       ❌ videos.json yuklashda xatolik
)
echo.

echo ============================================
echo   ✅ DEPLOY COMPLETE!
echo ============================================
echo.
echo   Endi creative-design.uz da videolar ko'rinadi:
echo   https://creative-design.uz/templates
echo.

pause
