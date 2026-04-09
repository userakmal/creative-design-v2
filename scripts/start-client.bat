@echo off
chcp 65001 >nul
title Creative Design - Client (Port 5173)

cd /d "%~dp0client"

echo.
echo ╔═════════════════════════════════════════════╗
echo ║  🌐 Client (React + Vite)                  ║
echo ║  Port: 5173                                 ║
echo ╚═════════════════════════════════════════════╝
echo.

if not exist "node_modules\" (
    echo 📦 Installing dependencies...
    call npm install
    echo.
)

REM Open browser after 3 seconds
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:5173"

npm run dev
