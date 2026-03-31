@echo off
REM Quick Bot Test - Check if bot starts without errors
cd /d "%~dp0"

echo ============================================
echo  TESTING BOT STARTUP
echo ============================================
echo.

echo [1/3] Testing Python imports...
python -c "from bot import VideoDownloaderBot; print('OK')" 2>&1
if errorlevel 1 (
    echo FAILED: Import error
    exit /b 1
)

echo [2/3] Testing URL extraction...
python -c "from utils import extract_url_from_text; url = extract_url_from_text('https://instagram.com/p/abc'); print('URL:', url)" 2>&1
if errorlevel 1 (
    echo FAILED: URL extraction error
    exit /b 1
)

echo [3/3] Starting bot (5 second test)...
timeout /t 2 /nobreak >nul
start "Bot Test" cmd /k "python bot.py"
timeout /t 5 /nobreak >nul

echo.
echo ============================================
echo  TEST COMPLETE
echo ============================================
echo.
echo Bot started in new window.
echo Check for error messages in the bot window.
echo.
pause
