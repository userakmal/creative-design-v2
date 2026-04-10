@echo off
title Video Upload Fix - Creative Design Platform
color 0A

echo.
echo ========================================================================
echo              VIDEO UPLOAD FIX - AUTOMATED DIAGNOSTICS
echo ========================================================================
echo.
echo This script will:
echo   1. Check if required services are running
echo   2. Verify configuration files
echo   3. Check upload directories
echo   4. Test API connectivity
echo   5. Fix common issues
echo.
echo ========================================================================
echo.
pause

echo.
echo [Step 1/7] Checking Node.js and npm...
echo ------------------------------------------------------------------------
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Node.js is installed
    node --version
) else (
    echo [ERROR] Node.js is NOT installed!
    echo   Download from: https://nodejs.org/
    pause
    exit /b 1
)
echo.

echo [Step 2/7] Checking API Server dependencies...
echo ------------------------------------------------------------------------
if exist "api-server\node_modules" (
    echo [OK] API Server dependencies installed
) else (
    echo [FIX] Installing API Server dependencies...
    cd api-server
    call npm install
    cd ..
)
echo.

echo [Step 3/7] Checking upload directories...
echo ------------------------------------------------------------------------
if not exist "api-server\public\videos" (
    echo [FIX] Creating videos directory...
    mkdir "api-server\public\videos"
) else (
    echo [OK] Videos directory exists
)

if not exist "api-server\public\image" (
    echo [FIX] Creating image directory...
    mkdir "api-server\public\image"
) else (
    echo [OK] Image directory exists
)

if not exist "api-server\public\music" (
    echo [FIX] Creating music directory...
    mkdir "api-server\public\music"
) else (
    echo [OK] Music directory exists
)

if not exist "api-server\public\data" (
    echo [FIX] Creating data directory...
    mkdir "api-server\public\data"
) else (
    echo [OK] Data directory exists
)
echo.

echo [Step 4/7] Checking JSON data files...
echo ------------------------------------------------------------------------
if not exist "api-server\public\data\videos.json" (
    echo [FIX] Creating videos.json...
    echo [] > "api-server\public\data\videos.json"
) else (
    echo [OK] videos.json exists
)

if not exist "api-server\public\data\music.json" (
    echo [FIX] Creating music.json...
    echo [] > "api-server\public\data\music.json"
) else (
    echo [OK] music.json exists
)
echo.

echo [Step 5/7] Checking configuration...
echo ------------------------------------------------------------------------
echo Checking admin password in server...
findstr /C:"creative2026" "api-server\upload-server.js" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Server password configured
) else (
    echo [ERROR] Server password not found!
    echo   Check api-server/upload-server.js line 16
)

echo Checking admin password in client...
findstr /C:"creative2026" "client\src\pages\admin.page.tsx" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Client password configured
) else (
    echo [ERROR] Client password not found!
    echo   Check client/src/pages/admin.page.tsx line 18
)
echo.

echo [Step 6/7] Checking if API server is running...
echo ------------------------------------------------------------------------
netstat -ano | findstr ":3001" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] API server is running on port 3001
    echo Testing API health...
    curl -s http://localhost:3001/api/health >nul 2>&1
    if %errorlevel% equ 0 (
        echo [OK] API server responding
    ) else (
        echo [WARNING] API server running but not responding properly
    )
) else (
    echo [WARNING] API server is NOT running!
    echo.
    set /p start_server="Do you want to start the API server now? (Y/N): "
    if /i "%start_server%"=="Y" (
        echo Starting API server...
        start "API Server - Fixed" cmd /k "cd api-server && npm start"
        echo Waiting 5 seconds for server to start...
        timeout /t 5 /nobreak >nul
    )
)
echo.

echo [Step 7/7] Checking if client is running...
echo ------------------------------------------------------------------------
netstat -ano | findstr ":5173" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Client is running on port 5173
) else (
    echo [WARNING] Client is NOT running!
    echo.
    set /p start_client="Do you want to start the client now? (Y/N): "
    if /i "%start_client%"=="Y" (
        echo Starting client...
        start "Client - Fixed" cmd /k "cd client && npm run dev"
        echo Waiting 5 seconds for client to start...
        timeout /t 5 /nobreak >nul
    )
)
echo.

echo ========================================================================
echo                        DIAGNOSTICS COMPLETE
echo ========================================================================
echo.
echo Summary:
echo   - All checks have been performed
echo   - Any missing files/directories have been created
echo   - Configuration has been verified
echo.
echo Next Steps:
echo   1. Open browser: http://localhost:5173/admin
echo   2. Verify "Online" status indicator is green
echo   3. Try uploading a SMALL video file (under 50MB for testing)
echo   4. Check browser console (F12) if upload fails
echo.
echo Access Points:
echo   - Admin Panel:  http://localhost:5173/admin
echo   - API Health:   http://localhost:3001/api/health
echo   - API Stats:    http://localhost:3001/api/stats
echo.
echo Admin Password: creative2026
echo.
echo ========================================================================
echo.
echo Press any key to exit...
pause >nul
