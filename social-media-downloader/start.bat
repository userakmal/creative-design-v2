@echo off
REM Social Media Downloader - Quick Start Script
REM =============================================

echo ============================================
echo  Social Media Downloader API - Setup
echo ============================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

echo [OK] Python found
echo.

REM Create virtual environment if not exists
if not exist "venv\" (
    echo [INFO] Creating virtual environment...
    python -m venv venv
    echo [OK] Virtual environment created
    echo.
) else (
    echo [OK] Virtual environment already exists
    echo.
)

REM Activate virtual environment
echo [INFO] Activating virtual environment...
call venv\Scripts\activate.bat
echo [OK] Virtual environment activated
echo.

REM Install dependencies
echo [INFO] Installing dependencies...
pip install -r requirements.txt --quiet
echo [OK] Dependencies installed
echo.

REM Check for cookies file
if not exist "cookies.txt" (
    echo [WARNING] cookies.txt not found!
    echo.
    echo Instagram and some sites will require authentication.
    echo See COOKIES_SETUP.md for instructions.
    echo.
    echo Would you like to continue without cookies? (Y/N)
    set /p CONTINUE="> "
    if /i not "%CONTINUE%"=="Y" (
        echo.
        echo Please create cookies.txt and run again.
        pause
        exit /b 1
    )
    echo.
) else (
    echo [OK] cookies.txt found
    echo.
)

REM Create directories
if not exist "downloads\" mkdir downloads
if not exist "temp\" mkdir temp
echo [OK] Directories created
echo.

REM Start server
echo ============================================
echo  Starting Server...
echo ============================================
echo.
echo API will be available at: http://localhost:8000
echo API docs at: http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop the server
echo.

python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

pause
