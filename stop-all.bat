@echo off
chcp 65001 >nul
title Stop All Servers

echo Stopping all servers...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001.*LISTENING"') do (
    echo Stopping Upload Server (PID: %%a)...
    taskkill /F /PID %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173.*LISTENING"') do (
    echo Stopping Client (PID: %%a)...
    taskkill /F /PID %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000.*LISTENING"') do (
    echo Stopping Video API (PID: %%a)...
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo All servers stopped.
timeout /t 2 /nobreak >nul
