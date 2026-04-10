@echo off
title Advanced Diagnostics - Creative Design Platform
color 0B

set LOGFILE=fixes\diagnostic-report-%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%.log
set LOGFILE=%LOGFILE: =0%

echo.
echo ========================================================================
echo              ADVANCED DIAGNOSTICS - DETAILED REPORT
echo ========================================================================
echo.
echo This will create a detailed report in: %LOGFILE%
echo.
echo Please wait...
echo.

(
echo ========================================================================
echo CREATIVE DESIGN PLATFORM - DIAGNOSTIC REPORT
echo Generated: %date% %time%
echo ========================================================================
echo.

echo [1/12] SYSTEM INFORMATION
echo ------------------------------------------------------------------------
echo Operating System:
ver
echo.
echo Current Directory:
cd
echo.

echo [2/12] NODE.JS AND NPM
echo ------------------------------------------------------------------------
echo Node.js Version:
node --version 2>&1
echo.
echo npm Version:
npm --version 2>&1
echo.

echo [3/12] PYTHON (for Telegram Bot)
echo ------------------------------------------------------------------------
echo Python Version:
python --version 2>&1
echo.

echo [4/12] PROJECT STRUCTURE
echo ------------------------------------------------------------------------
echo Checking main directories:
if exist "api-server" (echo [OK] api-server/) else (echo [MISSING] api-server/)
if exist "client" (echo [OK] client/) else (echo [MISSING] client/)
if exist "telegram-video-bot" (echo [OK] telegram-video-bot/) else (echo [MISSING] telegram-video-bot/)
if exist "fixes" (echo [OK] fixes/) else (echo [MISSING] fixes/)
echo.

echo [5/12] DEPENDENCIES
echo ------------------------------------------------------------------------
echo API Server dependencies:
if exist "api-server\node_modules" (
    echo [OK] node_modules exists
    echo Packages installed:
    dir api-server\node_modules /b 2>nul | find /c /v ""
) else (
    echo [MISSING] node_modules not found
)
echo.

echo Client dependencies:
if exist "client\node_modules" (
    echo [OK] node_modules exists
    echo Packages installed:
    dir client\node_modules /b 2>nul | find /c /v ""
) else (
    echo [MISSING] node_modules not found
)
echo.

echo [6/12] CONFIGURATION FILES
echo ------------------------------------------------------------------------
echo API Server main file:
if exist "api-server\upload-server.js" (
    echo [OK] upload-server.js exists
) else (
    echo [MISSING] upload-server.js not found
)
echo.

echo Admin Panel file:
if exist "client\src\pages\admin.page.tsx" (
    echo [OK] admin.page.tsx exists
) else (
    echo [MISSING] admin.page.tsx not found
)
echo.

echo [7/12] PASSWORD CONFIGURATION
echo ------------------------------------------------------------------------
echo Checking server password:
findstr /C:"creative2026" "api-server\upload-server.js" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Password configured in server
) else (
    echo [ERROR] Password NOT found in server config
)
echo.

echo Checking client password:
findstr /C:"creative2026" "client\src\pages\admin.page.tsx" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Password configured in client
) else (
    echo [ERROR] Password NOT found in client config
)
echo.

echo [8/12] UPLOAD DIRECTORIES
echo ------------------------------------------------------------------------
echo Upload directory status:

if exist "api-server\public\videos" (
    echo [OK] videos/ directory exists
    echo   Files: 
    dir api-server\public\videos /b 2>nul | find /c /v ""
) else (
    echo [MISSING] videos/ directory not found
)

if exist "api-server\public\image" (
    echo [OK] image/ directory exists
    echo   Files:
    dir api-server\public\image /b 2>nul | find /c /v ""
) else (
    echo [MISSING] image/ directory not found
)

if exist "api-server\public\music" (
    echo [OK] music/ directory exists
    echo   Files:
    dir api-server\public\music /b 2>nul | find /c /v ""
) else (
    echo [MISSING] music/ directory not found
)

if exist "api-server\public\data" (
    echo [OK] data/ directory exists
) else (
    echo [MISSING] data/ directory not found
)
echo.

echo [9/12] DATA FILES
echo ------------------------------------------------------------------------
echo videos.json:
if exist "api-server\public\data\videos.json" (
    echo [OK] File exists
    echo Content:
    type "api-server\public\data\videos.json"
) else (
    echo [MISSING] videos.json not found
)
echo.

echo music.json:
if exist "api-server\public\data\music.json" (
    echo [OK] File exists
    echo Content:
    type "api-server\public\data\music.json"
) else (
    echo [MISSING] music.json not found
)
echo.

echo [10/12] PORT STATUS
echo ------------------------------------------------------------------------
echo Checking port 3001 (API Server):
netstat -ano | findstr ":3001" >nul 2>&1
if %errorlevel% equ 0 (
    echo [IN USE] API server is running
    netstat -ano | findstr ":3001"
) else (
    echo [FREE] Port 3001 is not in use
)
echo.

echo Checking port 5173 (Client):
netstat -ano | findstr ":5173" >nul 2>&1
if %errorlevel% equ 0 (
    echo [IN USE] Client is running
    netstat -ano | findstr ":5173"
) else (
    echo [FREE] Port 5173 is not in use
)
echo.

echo [11/12] RUNNING PROCESSES
echo ------------------------------------------------------------------------
echo Looking for Node.js processes:
tasklist | findstr "node.exe" >nul 2>&1
if %errorlevel% equ 0 (
    echo Found node.exe processes:
    tasklist | findstr "node.exe"
) else (
    echo [NONE] No Node.js processes running
)
echo.

echo Looking for Python processes:
tasklist | findstr "python.exe" >nul 2>&1
if %errorlevel% equ 0 (
    echo Found python.exe processes:
    tasklist | findstr "python.exe"
) else (
    echo [NONE] No Python processes running
)
echo.

echo [12/12] API CONNECTIVITY TEST
echo ------------------------------------------------------------------------
echo Testing API server (if running):
netstat -ano | findstr ":3001" >nul 2>&1
if %errorlevel% equ 0 (
    echo Server is running, testing health endpoint...
    curl -s http://localhost:3001/api/health 2>&1
    echo.
    echo.
    echo Testing videos endpoint...
    curl -s http://localhost:3001/api/videos 2>&1
    echo.
) else (
    echo [SKIP] API server is not running
)
echo.

echo ========================================================================
echo DIAGNOSTICS COMPLETE
echo ========================================================================
echo.
echo Summary of findings:
echo.

) > "%LOGFILE%" 2>&1

type "%LOGFILE%"

echo.
echo ========================================================================
echo Report saved to: %LOGFILE%
echo ========================================================================
echo.
echo You can share this log file for troubleshooting support.
echo.
pause
