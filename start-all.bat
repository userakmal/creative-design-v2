@echo off
chcp 65001 >nul
title Creative Design Platform

echo.
echo  ============================================
echo    Creative Design Platform - Starting
echo  ============================================
echo.

cd /d "%~dp0"

REM === Kill old processes ============================
echo [1/4] Stopping old servers...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001.*LISTENING"') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173.*LISTENING"') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000.*LISTENING"') do taskkill /F /PID %%a >nul 2>&1
timeout /t 1 /nobreak >nul
echo      Done.

REM === Check Node.js =================================
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found. Install from https://nodejs.org
    pause
    exit /b 1
)

REM === Check Python ==================================
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo WARNING: Python not found. Video downloader won't work.
    echo Install from https://python.org
    echo.
)

REM === Install npm deps if needed ====================
if not exist "node_modules\" (
    echo [2/4] Installing Node.js dependencies...
    call npm install
    cd api-server && call npm install && cd ..
    cd client && call npm install && cd ..
    echo      Done.
) else (
    echo [2/4] Dependencies ready.
)

REM === Install Python deps if needed =================
if exist "api-server\video-downloader\" (
    if not exist "api-server\video-downloader\venv\" (
        echo      Creating Python virtual environment...
        cd api-server\video-downloader
        python -m venv venv
        call venv\Scripts\activate.bat
        pip install -r requirements.txt >nul 2>&1
        cd ..\..
    )
)
echo [3/4] Python environment ready.

REM === Create directories =============================
if not exist "api-server\public\videos" mkdir "api-server\public\videos"
if not exist "api-server\public\image" mkdir "api-server\public\image"
if not exist "api-server\public\music" mkdir "api-server\public\music"
if not exist "api-server\public\data" mkdir "api-server\public\data"
if not exist "api-server\video-downloader\downloads" mkdir "api-server\video-downloader\downloads"

REM === Start Video Downloader API =====================
echo [4/4] Starting Video Downloader API (port 8000)...
start "Video API" cmd /k "cd /d %~dp0api-server\video-downloader && call venv\Scripts\activate.bat && python api_enhanced.py"
timeout /t 3 /nobreak >nul

REM === Start Upload Server ============================
echo      Starting Upload Server (port 3001)...
start "Upload Server" cmd /k "cd /d %~dp0api-server && npm start"
timeout /t 2 /nobreak >nul

REM === Start Client ===================================
echo      Starting Client (port 5173)...
start "Client" cmd /k "cd /d %~dp0client && npm run dev"

REM === Open browser ===================================
timeout /t 4 /nobreak >nul
start http://localhost:5173

echo.
echo  ============================================
echo    All servers started!
echo  ============================================
echo.
echo    Main App:        http://localhost:5173
echo    Video Downloader: http://localhost:5173/video-downloader
echo    Admin Panel:     http://localhost:5173/admin
echo    Video API Docs:  http://localhost:8000/api/docs
echo.
echo    Upload Server:   http://localhost:3001
echo    Client:          http://localhost:5173
echo    Video API:       http://localhost:8000
echo.
echo    Close all terminal windows to stop servers.
echo  ============================================
echo.
