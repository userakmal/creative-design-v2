@echo off
echo ============================================
echo   CREATIVE DESIGN - DEPLOYMENT PACKAGE
echo   Creating production ready files...
echo ============================================
echo.

REM Check if build exists
if not exist "dist" (
    echo Building project...
    call npm run build
    if errorlevel 1 (
        echo ERROR: Build failed!
        pause
        exit /b 1
    )
)

REM Create deployment folder
echo.
echo Creating deployment package...
if exist "deploy-package" rmdir /s /q "deploy-package"
mkdir "deploy-package"

REM Copy production files
echo Copying files...
xcopy /E /I /Y "dist" "deploy-package\dist"
xcopy /E /I /Y "public" "deploy-package\public"
copy /Y "upload-server.js" "deploy-package\"
copy /Y "package.json" "deploy-package\"
copy /Y ".env" "deploy-package\" 2>nul

REM Create README
echo.
echo Creating deployment instructions...
(
echo ============================================
echo CREATIVE DESIGN - PRODUCTION DEPLOYMENT
echo ============================================
echo.
echo 1. Upload ALL files to your server:
echo    - dist/
echo    - public/
echo    - upload-server.js
echo    - package.json
echo    - .env (if exists)
echo.
echo 2. On server, run:
echo    cd /path/to/creative-design
echo    npm install --production
echo    pm2 start upload-server.js --name creative-upload
echo    pm2 save
echo.
echo 3. Configure Nginx (see PRODUCTION_DEPLOYMENT.md)
echo.
echo 4. Test: https://creative-design.uz/admin
echo.
echo ============================================
) > "deploy-package\DEPLOY_INSTRUCTIONS.txt"

echo.
echo ============================================
echo   ✅ DEPLOYMENT PACKAGE READY!
echo ============================================
echo.
echo Package location: %CD%\deploy-package
echo.
echo Next steps:
echo 1. Upload 'deploy-package' folder to your server
echo 2. Follow DEPLOY_INSTRUCTIONS.txt
echo 3. See PRODUCTION_DEPLOYMENT.md for detailed guide
echo.
pause
