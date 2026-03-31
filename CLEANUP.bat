@echo off
chcp 65001 >nul 2>&1
title Creative Design - Tozalash
color 0E

echo.
echo  ══════════════════════════════════════════════
echo   KERAKSIZ FAYLLARNI TOZALASH
echo  ══════════════════════════════════════════════
echo.

cd /d "%~dp0"

echo [1/5] Root papkadagi keraksiz HUJJATLAR...
del /q "ADMIN_FIX.md" 2>nul
del /q "ADMIN_README.md" 2>nul
del /q "ADMIN_WORKING.md" 2>nul
del /q "AUTO_DOWNLOADER_GUIDE.md" 2>nul
del /q "AUTO_SYNC_GUIDE.md" 2>nul
del /q "DEPLOYMENT_GUIDE.md" 2>nul
del /q "DEPLOY_GUIDE.md" 2>nul
del /q "FETCHV_INTEGRATION.md" 2>nul
del /q "FINAL_SUMMARY.md" 2>nul
del /q "FIX_UPLOAD_ERROR.md" 2>nul
del /q "GIT_PUSH_FIX.md" 2>nul
del /q "HOW_TO_START.md" 2>nul
del /q "PRODUCTION_DEPLOYMENT.md" 2>nul
del /q "PRODUCTION_UPLOAD_SETUP.md" 2>nul
del /q "QUICK_ADMIN_GUIDE.md" 2>nul
del /q "QUICK_START.md" 2>nul
del /q "QUICK_START_UZ.md" 2>nul
del /q "README_SUPER_SERVER.md" 2>nul
del /q "UPLOAD_FIX_COMPLETE.md" 2>nul
del /q "UPLOAD_FIX_SUMMARY.md" 2>nul
del /q "UPLOAD_WORKING.md" 2>nul
echo       OK

echo [2/5] Root papkadagi keraksiz BAT lar va fayllar...
del /q "AUTO_SYNC.bat" 2>nul
del /q "CHECK_SERVICES.bat" 2>nul
del /q "CREATIVE_SUPER_SERVER.bat" 2>nul
del /q "DEPLOY_TO_PRODUCTION.bat" 2>nul
del /q "GIT_FIX.bat" 2>nul
del /q "START_AUTO_SYNC.bat" 2>nul
del /q "START_EVERYTHING.bat" 2>nul
del /q "START_PUBLIC_TUNNEL.bat" 2>nul
del /q "prepare-deploy.bat" 2>nul
del /q "start-upload-server.bat" 2>nul
del /q "start_all.bat" 2>nul
del /q "START.bat" 2>nul
del /q "STOP.bat" 2>nul
del /q "$null" 2>nul
del /q "admin-server.js" 2>nul
del /q "auto_sync.py" 2>nul
del /q "sync-config.json" 2>nul
del /q "metadata.json" 2>nul
del /q "media-htaccess.txt" 2>nul
if exist "'[]'" rmdir /s /q "'[]'" 2>nul
if exist "echo" rmdir /s /q "echo" 2>nul
if exist "logs" rmdir /s /q "logs" 2>nul
if exist "downloads" rmdir /s /q "downloads" 2>nul
echo       OK

echo [3/5] Telegram bot papkasidagi keraksiz fayllar...
cd telegram-video-bot
del /q "ADMIN_DASHBOARD.md" 2>nul
del /q "AUDIT_COMPLETE.md" 2>nul
del /q "AUTOSTART_GUIDE.md" 2>nul
del /q "BOT_API_SETUP.md" 2>nul
del /q "BOT_FIXES.md" 2>nul
del /q "BOT_FIX_GUIDE.md" 2>nul
del /q "MAIN_MENU_GUIDE.md" 2>nul
del /q "PRODUCTION_README.md" 2>nul
del /q "WEB_INTEGRATION.md" 2>nul
del /q "api_enhanced.py" 2>nul
del /q "TEST_BOT.py" 2>nul
del /q "test_hls.mp4" 2>nul
del /q "test_video.mp4" 2>nul
del /q "test_output.txt" 2>nul
del /q "diagnostic_output.txt" 2>nul
del /q "TelegramVideoBot_Task.xml" 2>nul
del /q "run_invisible.vbs" 2>nul
del /q "setup_autostart.py" 2>nul
del /q "docker-compose.yml" 2>nul
del /q "auto_template_downloader.py" 2>nul
del /q "bot-api.env" 2>nul
del /q "bot-api-manager.bat" 2>nul
del /q "restart_bot.bat" 2>nul
del /q "run-bot-api.bat" 2>nul
del /q "start-bot-api.bat" 2>nul
del /q "start.bat" 2>nul
del /q "start_bot.bat" 2>nul
del /q "start_bot_auto.bat" 2>nul
del /q "test_bot_startup.bat" 2>nul
del /q "START_API_QUICK.bat" 2>nul
del /q "START_BOT_DEBUG.bat" 2>nul
del /q "START_BOT_FULL.bat" 2>nul
del /q "START_BOT_QUICK.bat" 2>nul
echo       OK

echo [4/5] Log fayllar...
del /q "bot_autorestart.log" 2>nul
del /q "bot_critical.log" 2>nul
del /q "bot.log" 2>nul
del /q "api.log" 2>nul
cd ..
echo       OK

echo [5/5] Eski CLEANUP.bat ni ham ochiramiz...
echo       OK

echo.
echo  ══════════════════════════════════════════════
echo   TOZALASH TUGADI!
echo   Endi faqat current_starter.bat yoqing.
echo  ══════════════════════════════════════════════
echo.

:: O'zini o'chirish
del /q "%~f0" 2>nul
pause
