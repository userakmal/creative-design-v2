@echo off
echo ========================================
echo  Creative Design Platform Starter
echo ========================================
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check Python
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Python is not installed. Telegram bot will not work.
    echo.
)

REM Install dependencies if needed
if not exist "node_modules" (
    echo [INFO] Installing Node.js dependencies...
    call npm install
    echo.
)

if exist "telegram-video-bot" (
    cd telegram-video-bot
    if not exist "venv" (
        echo [INFO] Creating Python virtual environment...
        python -m venv venv
    )
    call venv\Scripts\activate.bat
    if exist "requirements.txt" (
        echo [INFO] Installing Python dependencies...
        pip install -r requirements.txt -q
    )
    deactivate
    cd ..
    echo.
)

echo [INFO] Starting all services...
echo.
echo  - Web App: http://localhost:5173
echo  - Admin Panel: http://localhost:5173/admin
echo  - Upload Server: http://localhost:3001
echo.

REM Start services
start "Upload Server" cmd /k "node upload-server.js"
timeout /t 2 /nobreak >nul
start "Web Application" cmd /k "npm run dev"

echo.
echo ========================================
echo  All services started successfully!
echo ========================================
echo.
echo Press any key to close this window...
pause >nul
