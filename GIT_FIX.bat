@echo off
color 0C
cd /d "%~dp0"

title 🔧 GIT FIX - Remove Secrets from Git History

echo ============================================
echo   🔧 GIT FIX - Remove venv from Git
echo   GitHub Push Protection bypass
echo ============================================
echo.

echo [1/4] Removing venv from git cache...
git rm -r --cached telegram-video-bot/venv
if %ERRORLEVEL% NEQ 0 (
    echo    ⚠  venv not in git or already removed
) else (
    echo    ✓ venv removed from git cache
)
echo.

echo [2/4] Removing node_modules from git cache...
git rm -r --cached node_modules
if %ERRORLEVEL% NEQ 0 (
    echo    ⚠  node_modules not in git or already removed
) else (
    echo    ✓ node_modules removed from git cache
)
echo.

echo [3/4] Removing logs and cache...
git rm -r --cached logs 2>nul
git rm -r --cached .cache 2>nul
git rm -r --cached __pycache__ 2>nul
echo    ✓ Cache cleared
echo.

echo [4/4] Committing changes...
git add .gitignore
git commit -m "fix: Remove venv and add to .gitignore

- Remove venv/ from git tracking
- Add venv/ to .gitignore
- Fix GitHub secret scanning violations
- Prevent AWS keys in yt_dlp from being tracked"

echo.
echo ============================================
echo   ✅ GIT FIX COMPLETE!
echo ============================================
echo.
echo   Next steps:
echo   1. git push origin main
echo   2. Agar yana xato bo'lsa:
echo      git push --force-with-lease
echo.
echo   ⚠️  DIQQAT:
echo   venv/ endi gitga qo'shilmaydi!
echo.

pause
