@echo off
chcp 65001 >nul
title Creative Design - Stop All Servers

echo.
echo ╔═════════════════════════════════════════════╗
echo ║  🛑 Stopping All Servers                    ║
echo ╚═════════════════════════════════════════════╝
echo.

echo Stopping Video Downloader API (FastAPI)...
taskkill /FI "WINDOWTITLE eq 🎬 Video Downloader API*" /T /F >nul 2>nul

echo Stopping Upload Server (Express)...
taskkill /FI "WINDOWTITLE eq 📤 Upload Server*" /T /F >nul 2>nul

echo Stopping Client (React + Vite)...
taskkill /FI "WINDOWTITLE eq 🌐 Client (React + Vite)*" /T /F >nul 2>nul

echo.
echo ✅ All servers stopped!
echo.
pause
