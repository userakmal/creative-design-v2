@echo off
:: START AUTO SYNC - Windows Task Scheduler uchun
:: Kompyuter yoqilganda avtomatik ishga tushadi

cd /d "%~dp0"

REM Log fayl
set LOG_FILE=logs\auto-sync-start.log

REM Log boshlash
echo [%DATE% %TIME%] Auto-sync boshlandi... >> %LOG_FILE%

REM Python versiyasini tekshirish
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [%DATE% %TIME%] Python topilmadi! >> %LOG_FILE%
    exit /b 1
)

REM Auto-sync ni ishga tushirish
start "🔄 Auto Sync - Creative Design" cmd /k "python auto_sync.py"

echo [%DATE% %TIME%] Auto-sync ishga tushdi >> %LOG_FILE%
