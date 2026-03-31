@echo off
chcp 65001 >nul 2>&1
title Creative Design - Xizmatlarni To'xtatish
color 0C

echo.
echo  Barcha xizmatlar to'xtatilmoqda...
echo.

:: Kill all service windows by title
taskkill /FI "WINDOWTITLE eq VITE-FRONTEND*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq UPLOAD-SERVER*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq VIDEO-API*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq TELEGRAM-BOT*" /F >nul 2>&1

:: Also kill by process on specific ports
for /f "tokens=5" %%p in ('netstat -aon ^| findstr ":5173 " ^| findstr "LISTENING"') do taskkill /PID %%p /F >nul 2>&1
for /f "tokens=5" %%p in ('netstat -aon ^| findstr ":3001 " ^| findstr "LISTENING"') do taskkill /PID %%p /F >nul 2>&1
for /f "tokens=5" %%p in ('netstat -aon ^| findstr ":8000 " ^| findstr "LISTENING"') do taskkill /PID %%p /F >nul 2>&1

echo  [OK] Barcha xizmatlar to'xtatildi!
echo.
timeout /t 3 /nobreak >nul
