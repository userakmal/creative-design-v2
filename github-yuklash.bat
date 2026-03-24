@echo off
setlocal enabledelayedexpansion

echo ==============================================
echo  GitHubga kodni avtomatik yuklash skripti
echo ==============================================

:: Maslahat: Agar birinchi marta ishlatayotgan bo'lsangiz:
:: 1. GitHubda yangi repozitoriy yarating.
:: 2. Terminalda (yoki shu yerda): git remote add origin https://github.com/USERNAME/REPO_NAME.git

echo Tekshirilmoqda...
git remote -v > nul 2>&1
if errorlevel 1 (
    echo.
    echo [DIQQAT] GitHub repozitoriyasi hali bog'lanmagan!
    echo Iltimos, GitHub repozitoriyangiz manzilini kiriting:
    set /p remote_url="URL: "
    if not "!remote_url!"=="" (
        git remote add origin !remote_url!
        echo Remote muvaffaqiyatli qo'shildi!
    ) else (
        echo Remote manzili kiritilmadi. Chiqilmoqda...
        pause
        exit /b
    )
)

git add .

set /p msg="O'zgarishlar uchun izoh yozing (masalan, 'yangi o'zgarishlar'): "
if "%msg%"=="" set msg="Avtomatik yuklash"

git commit -m "%msg%"

echo GitHubga yuklanmoqda...
git push origin main

if errorlevel 1 (
    echo.
    echo Xatolik yuz berdi! 
    echo Maslahat: Balki 'main' branch o'rniga 'master' dir? Yoki internet yo'q?
    echo.
    echo Agar 'main' ishlamasa, 'master'ni sinab ko'ring: git push origin master
) else (
    echo.
    echo Muvaffaqiyatli yuklandi! 🚀
    echo.
    echo DIQQAT: GitHub Actions (Deploy) endi serveringizga yuklashni boshlaydi.
    echo Statusini GitHubdagi 'Actions' bo'limida ko'rishingiz mumkin.
)

pause
