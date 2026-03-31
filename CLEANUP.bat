@echo off
chcp 65001 >nul 2>&1
title Creative Design - Keraksiz Fayllarni Tozalash
color 0E

echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║     KERAKSIZ FAYLLARNI TOZALASH / CLEANUP SCRIPT    ║
echo  ╚══════════════════════════════════════════════════════╝
echo.
echo  Bu skript quyidagilarni o'chiradi:
echo  - Eskirgan hujjatlar (21 ta .md fayl)
echo  - Eski .bat skriptlar (12 ta)
echo  - Log fayllar
echo  - Test fayllar
echo.

set /p confirm="Davom etsinmi? (Y/N): "
if /i not "%confirm%"=="Y" (
    echo Bekor qilindi.
    pause
    exit /b 0
)

echo.
echo [1/4] Root papkadagi keraksiz hujjatlar...

:: Duplicate/obsolete documentation
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

echo       [OK] Hujjatlar tozalandi

echo [2/4] Eski .bat skriptlar...

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

echo       [OK] Eski skriptlar tozalandi

echo [3/4] Boshqa keraksiz fayllar (root)...

del /q "$null" 2>nul
if exist "'[]'" rmdir /s /q "'[]'" 2>nul
del /q "auto_sync.py" 2>nul
del /q "sync-config.json" 2>nul
del /q "metadata.json" 2>nul
del /q "admin-server.js" 2>nul

echo       [OK] Boshqa fayllar tozalandi

echo [4/4] Telegram bot papkasidagi keraksiz fayllar...

cd telegram-video-bot

:: Old docs
del /q "ADMIN_DASHBOARD.md" 2>nul
del /q "AUDIT_COMPLETE.md" 2>nul
del /q "AUTOSTART_GUIDE.md" 2>nul
del /q "BOT_API_SETUP.md" 2>nul
del /q "BOT_FIXES.md" 2>nul
del /q "BOT_FIX_GUIDE.md" 2>nul
del /q "MAIN_MENU_GUIDE.md" 2>nul
del /q "PRODUCTION_README.md" 2>nul
del /q "WEB_INTEGRATION.md" 2>nul

:: Redundant bat scripts (keep only start.bat)
del /q "START_API_QUICK.bat" 2>nul
del /q "START_BOT_DEBUG.bat" 2>nul
del /q "START_BOT_FULL.bat" 2>nul
del /q "START_BOT_QUICK.bat" 2>nul
del /q "bot-api-manager.bat" 2>nul
del /q "restart_bot.bat" 2>nul
del /q "run-bot-api.bat" 2>nul
del /q "start-bot-api.bat" 2>nul
del /q "start_bot.bat" 2>nul
del /q "start_bot_auto.bat" 2>nul
del /q "test_bot_startup.bat" 2>nul

:: Duplicate/test files
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

:: Log files
del /q "bot_autorestart.log" 2>nul
del /q "bot_critical.log" 2>nul
del /q "bot.log" 2>nul
del /q "api.log" 2>nul

cd ..

echo       [OK] Bot papkasi tozalandi

echo.
echo  ═══════════════════════════════════════════════════════
echo   Tozalash tugadi! Loyiha toza va professional.
echo  ═══════════════════════════════════════════════════════
echo.
pause
