@echo off
:: ============================================================================
:: CREATIVE DESIGN - PUBLIC ACCESS
:: Internetga chiqish uchun tunnel (Localtunnel/Ngrok)
:: ============================================================================

title 🌍 CREATIVE DESIGN - PUBLIC TUNNEL
color 0B

set "PROJECT_DIR=%~dp0"
set "WEB_PORT=5173"
set "UPLOAD_PORT=3001"

echo.
echo ============================================================================
echo                  CREATIVE DESIGN - PUBLIC ACCESS
echo                  Internetga chiqish uchun tunnel
echo ============================================================================
echo.

:: 1. Localtunnel
echo [1/2] Localtunnel ochilmoqda...
echo.
echo    Bu oynani yopmang! Tunnel ishlab turishi kerak.
echo.
echo    URL bir necha soniyadan keyin ko'rinadi...
echo.

start "🌍 Localtunnel - Website" cmd /k "cd /d %PROJECT_DIR% && lt --port %WEB_PORT%"

timeout /t 3 /nobreak >nul

:: 2. Upload server uchun alohida tunnel
echo [2/2] Upload Server uchun tunnel...
echo.

start "🌍 Localtunnel - Upload API" cmd /k "cd /d %PROJECT_DIR% && lt --port %UPLOAD_PORT%"

timeout /t 5 /nobreak >nul

echo.
echo ============================================================================
echo                         TUNNEL ISHGA TUSHDI!
echo ============================================================================
echo.
echo    📡 URL manzillari:
echo.
echo    1. WEBSITE (Vite):
echo       • Lokal:  http://localhost:%WEB_PORT%
echo       • Online: [Localtunnel URL - bir necha soniyadan keyin]
echo.
echo    2. UPLOAD SERVER:
echo       • Lokal:  http://localhost:%UPLOAD_PORT%
echo       • Online: [Localtunnel URL - bir necha soniyadan keyin]
echo.
echo    3. ADMIN PANEL:
echo       • Lokal:  http://localhost:%WEB_PORT%/admin
echo       • Online: [Localtunnel URL]/admin
echo.
echo ============================================================================
echo.
echo    📱 TELEFONDAN KIRISH:
echo    1. Localtunnel oynasidagi URL ni ko'chirib oling
echo    2. Telefon brauzeriga tashlang
echo    3. /admin qo'shib admin panelga kiring
echo.
echo    🔐 Login:
echo    • Username: admin
echo    • Password: creative2026
echo.
echo ============================================================================
echo.
echo    ⚠️  MUHIM:
echo    • Bu oynani yopmang! Tunnel o'chib qoladi.
echo    • Har safar yangi URL beriladi.
echo    • Doimiy URL uchun Ngrok yoki Cloudflare Tunnel ishlating.
echo.
echo ============================================================================
echo.

:: Monitoring
:loop
timeout /t 30 >nul
goto loop
