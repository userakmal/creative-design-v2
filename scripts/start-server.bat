@echo off
chcp 65001 >nul
title Creative Design - Upload Server (Port 3001)

cd /d "%~dp0api-server"

echo.
echo ╔═════════════════════════════════════════════╗
echo ║  📤 Upload Server (Express.js)             ║
echo ║  Port: 3001                                 ║
echo ╚═════════════════════════════════════════════╝
echo.

if not exist "node_modules\" (
    echo 📦 Installing dependencies...
    call npm install
    echo.
)

npm start
