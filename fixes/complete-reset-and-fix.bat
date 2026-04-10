@echo off
title Complete Reset - Creative Design Platform
color 0C

echo.
echo ========================================================================
echo                    COMPLETE SYSTEM RESET
echo ========================================================================
echo.
echo WARNING: This will DELETE ALL uploaded content!
echo.
echo This will:
echo   1. Stop all running services
echo   2. Delete all uploaded videos, images, and music
echo   3. Reset JSON data files
echo   4. Clean node_modules and reinstall
echo   5. Restart all services fresh
echo.
echo ========================================================================
echo.
set /p confirm="Are you sure you want to continue? (YES/NO): "
if not "%confirm%"=="YES" (
    echo.
    echo Reset cancelled.
    pause
    exit /b 0
)
echo.
echo Starting complete reset...
echo.

echo [Step 1/8] Stopping all services...
echo ------------------------------------------------------------------------
taskkill /FI "WindowTitle eq API Server*" /T /F >nul 2>&1
taskkill /FI "WindowTitle eq Client*" /T /F >nul 2>&1
taskkill /FI "WindowTitle eq Telegram Bot*" /T /F >nul 2>&1
taskkill /FI "WindowTitle eq *Fixed*" /T /F >nul 2>&1
echo [OK] All services stopped
echo.

echo [Step 2/8] Deleting uploaded videos...
echo ------------------------------------------------------------------------
if exist "api-server\public\videos\*" (
    del /q "api-server\public\videos\*.*"
    echo [OK] Videos deleted
) else (
    echo [SKIP] No videos to delete
)
echo.

echo [Step 3/8] Deleting uploaded images...
echo ------------------------------------------------------------------------
if exist "api-server\public\image\*" (
    del /q "api-server\public\image\*.*"
    echo [OK] Images deleted
) else (
    echo [SKIP] No images to delete
)
echo.

echo [Step 4/8] Deleting uploaded music...
echo ------------------------------------------------------------------------
if exist "api-server\public\music\*" (
    del /q "api-server\public\music\*.*"
    echo [OK] Music deleted
) else (
    echo [SKIP] No music to delete
)
echo.

echo [Step 5/8] Resetting JSON data files...
echo ------------------------------------------------------------------------
echo [] > "api-server\public\data\videos.json"
echo [OK] videos.json reset
echo [] > "api-server\public\data\music.json"
echo [OK] music.json reset
echo.

echo [Step 6/8] Cleaning API Server node_modules...
echo ------------------------------------------------------------------------
if exist "api-server\node_modules" (
    echo Removing old dependencies...
    rmdir /s /q "api-server\node_modules"
)
if exist "api-server\package-lock.json" (
    del "api-server\package-lock.json"
)
echo [OK] API Server cleaned
echo.

echo [Step 7/8] Cleaning Client node_modules...
echo ------------------------------------------------------------------------
if exist "client\node_modules" (
    echo Removing old dependencies...
    rmdir /s /q "client\node_modules"
)
if exist "client\package-lock.json" (
    del "client\package-lock.json"
)
echo [OK] Client cleaned
echo.

echo [Step 8/8] Reinstalling dependencies...
echo ------------------------------------------------------------------------
echo Installing API Server dependencies...
cd api-server
call npm install
cd ..

echo.
echo Installing Client dependencies...
cd client
call npm install
cd ..
echo.

echo ========================================================================
echo                        RESET COMPLETE
echo ========================================================================
echo.
echo All content has been reset. System is clean and ready.
echo.
echo Starting all services...
timeout /t 2 /nobreak >nul
echo.

start "API Server - Fixed" cmd /k "cd api-server && npm start"
echo Waiting 3 seconds for API Server...
timeout /t 3 /nobreak >nul

start "Client - Fixed" cmd /k "cd client && npm run dev"
echo Waiting 3 seconds for Client...
timeout /t 3 /nobreak >nul

echo.
echo ========================================================================
echo                        ALL SERVICES STARTED
echo ========================================================================
echo.
echo Services running:
echo   - API Server:  http://localhost:3001
echo   - Client:      http://localhost:5173
echo   - Admin Panel: http://localhost:5173/admin
echo.
echo Next steps:
echo   1. Open: http://localhost:5173/admin
echo   2. Verify "Online" status is green
echo   3. Upload a test video (small file under 50MB)
echo.
echo Admin Password: creative2026
echo.
echo ========================================================================
echo.
pause
