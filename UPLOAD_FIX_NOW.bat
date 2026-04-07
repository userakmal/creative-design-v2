@echo off
color 0b
title Fix Missing Videos on Server
cd /d "%~dp0"
echo ==================================================
echo   Barcha qolib ketgan videolarni serverga yuklash
echo ==================================================
echo.
echo Yuklash boshlanmoqda... (Biroz vaqt olishi mumkin, kutib turing)
echo.
node upload-to-hosting.js
echo.
echo ==================================================
echo   YUKLASH TUGADI! Endi saytni tekshirib ko'ring.
echo ==================================================
pause
