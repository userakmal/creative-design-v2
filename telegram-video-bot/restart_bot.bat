@echo off
REM Kill all Python processes and restart bot fresh
taskkill /F /IM python.exe 2>nul
timeout /t 2 /nobreak >nul

cd /d "%~dp0"

echo ============================================
echo  FRESH BOT RESTART
echo ============================================
echo.

echo [1/3] Clearing Python cache...
del /q /s __pycache__ 2>nul
del /q /s *.pyc 2>nul
echo     Done

echo [2/3] Verifying downloader.py...
python -c "
with open('downloader.py', 'r', encoding='utf-8') as f:
    content = f.read()
    if 'shell=True' in content:
        print('    ERROR: shell=True found in downloader.py!')
        exit(1)
    else:
        print('    OK: No shell=True in downloader.py')
"
echo [3/3] Starting bot...
start "Telegram Video Bot" python bot.py

echo.
echo ============================================
echo  BOT STARTED IN NEW WINDOW
echo ============================================
echo.
echo Check the bot window for status.
timeout /t 5 >nul
exit
