@echo off
setlocal enabledelayedexpansion
title CRstopper - Creative Design Platform
color 0C

:: ============================================================================
:: CREATIVE DESIGN PLATFORM - PROFESSIONAL STOPPER v3.0
:: Stops ALL services gracefully
:: ============================================================================

cls
echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║                                                          ║
echo  ║     CREATIVE DESIGN PLATFORM - CRstopper v3.0           ║
echo  ║                                                          ║
echo  ║   Graceful Service Stopper for All Services              ║
echo  ║                                                          ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.

:: ============================================================================
:: STEP 1: STOP ALL SERVICES BY PORT
:: ============================================================================

echo  ┌──────────────────────────────────────────────────────────┐
echo  │  STEP 1: Stopping Services by Port                       │
echo  └──────────────────────────────────────────────────────────┘
echo.

:: Stop all target ports
for %%P in (3001 5173 8000) do (
    echo  Stopping port %%P...
    set FOUND=0
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%%P" 2^>nul') do (
        set FOUND=1
        taskkill /F /PID %%a >nul 2>nul
        if !ERRORLEVEL! EQU 0 (
            echo    [OK] Process PID %%a stopped
        ) else (
            echo    [SKIP] PID %%a already stopped
        )
    )
    
    if !FOUND! EQU 0 (
        echo    [SKIP] No process on port %%P
    )
    
    timeout /t 1 /nobreak >nul
)

echo.

:: ============================================================================
:: STEP 2: CLOSE TERMINAL WINDOWS
:: ============================================================================

echo  ┌──────────────────────────────────────────────────────────┐
echo  │  STEP 2: Closing Terminal Windows                        │
echo  └──────────────────────────────────────────────────────────┘
echo.

:: Close service windows
for %%W in ("📤 Upload Server" "🌐 Web App" "🎬 Video API" "🤖 Telegram Bot") do (
    taskkill /FI "WindowTitle eq %%W*" /F >nul 2>nul
    if !ERRORLEVEL! EQU 0 (
        echo  [OK] %%W window closed
    ) else (
        echo  [SKIP] %%W window not found
    )
)

echo.

:: ============================================================================
:: STEP 3: KILL PYTHON PROCESSES (if still running)
:: ============================================================================

echo  ┌──────────────────────────────────────────────────────────┐
echo  │  STEP 3: Cleaning Python Processes                       │
echo  └──────────────────────────────────────────────────────────┘
echo.

taskkill /FI "IMAGENAME eq python.exe" /F >nul 2>nul
if !ERRORLEVEL! EQU 0 (
    echo  [OK] Python processes stopped
) else (
    echo  [SKIP] No Python processes found
)

echo.

:: ============================================================================
:: STEP 4: VERIFY ALL PORTS ARE FREE
:: ============================================================================

echo  ┌──────────────────────────────────────────────────────────┐
echo  │  STEP 4: Verifying Ports are Free                        │
echo  └──────────────────────────────────────────────────────────┘
echo.

set ALL_CLEAR=1
for %%P in (3001 5173 8000) do (
    netstat -ano | findstr ":%%P" >nul 2>nul
    if !ERRORLEVEL! NEQ 0 (
        echo  [OK] Port %%P is FREE
    ) else (
        echo  [WARNING] Port %%P still in use - force cleanup...
        for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%%P"') do (
            taskkill /F /PID %%a >nul 2>nul
        )
        timeout /t 1 /nobreak >nul
        echo  [OK] Port %%P cleanup completed
    )
)

echo.

:: ============================================================================
:: SUCCESS MESSAGE
:: ============================================================================

echo  ╔══════════════════════════════════════════════════════════╗
echo  ║                                                          ║
echo  ║              ALL SERVICES STOPPED!                       ║
echo  ║                                                          ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.
echo  ┌──────────────────────────────────────────────────────────┐
echo  │  Services Status:                                        │
echo  ├──────────────────────────────────────────────────────────┤
echo  │  🌐 Web App:        STOPPED                              │
echo  │  📤 Upload Server:  STOPPED                              │
echo  │  🎬 Video API:      STOPPED                              │
echo  │  🤖 Telegram Bot:   STOPPED                              │
echo  └──────────────────────────────────────────────────────────┘
echo.
echo  ┌──────────────────────────────────────────────────────────┐
echo  │  To start all services: CRrunner.bat                     │
echo  └──────────────────────────────────────────────────────────┘
echo.
timeout /t 3 /nobreak >nul
