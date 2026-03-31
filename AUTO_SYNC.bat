@echo off
:: Auto Sync - Localhost to Production
:: Har 60 soniyada avtomatik sync qiladi

title 🔄 AUTO SYNC - Creative Design
color 0A

cd /d "%~dp0"

echo ============================================
echo   🔄 AUTO SYNC - LOCALHOST TO PRODUCTION
echo   creative-design.uz
echo ============================================
echo.

REM 1. Check config
if not exist "sync-config.json" (
    echo ❌ sync-config.json topilmadi!
    echo    Config faylni yarating...
    pause
    exit /b 1
)

echo ✓ Config fayl mavjud
echo.

REM 2. Check rsync
where rsync >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ rsync topilmadi!
    echo.
    echo    Git Bash o'rnating:
    echo    https://git-scm.com/download/win
    echo.
    echo    Yoki WinSCP script ishlating (VARIANT 2)
    pause
    exit /b 1
)

echo ✓ rsync mavjud
echo.

REM 3. Get server credentials from config
REM For simplicity, we'll use environment variables or defaults
set SERVER_USER=%SYNC_SERVER_USER%
set SERVER_HOST=%SYNC_SERVER_HOST%
set SERVER_PATH=%SYNC_SERVER_PATH%

if "%SERVER_USER%"=="" set SERVER_USER=root
if "%SERVER_HOST%"=="" set SERVER_HOST=creative-design.uz
if "%SERVER_PATH%"=="" set SERVER_PATH=/var/www/creative-design

echo Server ma'lumotlari:
echo   User: %SERVER_USER%
echo   Host: %SERVER_HOST%
echo   Path: %SERVER_PATH%
echo.

echo ============================================
echo   AUTO SYNC BOSHLANDI...
echo   Har 60 soniyada tekshiriladi
echo ============================================
echo.
echo To'xtatish uchun: Ctrl+C
echo.

:sync_loop

REM Sync videos
echo [%DATE% %TIME%] Syncing videos...
rsync -avz --delete public/videos/ %SERVER_USER%@%SERVER_HOST%:%SERVER_PATH%/public/videos/ 2>nul
if %ERRORLEVEL% EQU 0 (
    echo     ✅ Videos synced
) else (
    echo     ⚠️  Videos sync failed (server offline?)
)

REM Sync images
echo [%DATE% %TIME%] Syncing images...
rsync -avz --delete public/image/ %SERVER_USER%@%SERVER_HOST%:%SERVER_PATH%/public/image/ 2>nul
if %ERRORLEVEL% EQU 0 (
    echo     ✅ Images synced
) else (
    echo     ⚠️  Images sync failed
)

REM Sync videos.json
echo [%DATE% %TIME%] Syncing videos.json...
rsync -avz public/data/videos.json %SERVER_USER%@%SERVER_HOST%:%SERVER_PATH%/public/data/ 2>nul
if %ERRORLEVEL% EQU 0 (
    echo     ✅ videos.json synced
) else (
    echo     ⚠️  videos.json sync failed
)

echo.
echo [%DATE% %TIME%] Sync complete. Waiting 60 seconds...
echo.

REM Wait 60 seconds
timeout /t 60 /nobreak >nul

goto sync_loop
