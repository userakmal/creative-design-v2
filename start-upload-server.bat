@echo off
echo Starting Creative Design Upload Server...
echo.

REM Check if node is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

REM Create necessary directories
echo Creating directories...
if not exist "public\videos" mkdir "public\videos"
if not exist "public\image" mkdir "public\image"
if not exist "data" mkdir "data"
if not exist "data\videos.json" echo [] > "data\videos.json"

echo Starting upload server on port 3001...
echo.
node upload-server.js

pause
