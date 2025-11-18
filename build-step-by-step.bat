@echo off
REM ============================================
REM Step-by-Step Build with Detailed Progress
REM ============================================

echo.
echo ========================================
echo  Advanced Game of Life
echo  STEP-BY-STEP BUILD
echo ========================================
echo.

REM Check Node.js first
echo Checking if Node.js is installed...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Node.js is NOT installed!
    echo.
    echo Please follow these steps:
    echo 1. Go to: https://nodejs.org/
    echo 2. Download the LTS version (recommended)
    echo 3. Run the installer
    echo 4. Use all default settings
    echo 5. Restart your computer
    echo 6. Run this script again
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js found:
node --version
echo.

REM Show current directory
echo Current directory:
cd
echo.

REM Check package.json
if not exist "package.json" (
    echo [ERROR] Cannot find package.json
    echo.
    echo You might be in the wrong folder!
    echo Please make sure you're in the lifegame2 folder.
    echo.
    pause
    exit /b 1
)

echo [OK] Found package.json
echo.

REM ===== STEP 1: Install Dependencies =====
echo ========================================
echo  STEP 1: Installing Dependencies
echo ========================================
echo.

if exist "node_modules\" (
    echo Dependencies already installed. Skipping...
    echo (Delete node_modules folder to reinstall)
) else (
    echo This will download Electron and electron-builder
    echo Download size: ~250 MB
    echo Time estimate: 3-5 minutes
    echo.
    echo Installing now...
    echo.

    npm install

    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [ERROR] Failed to install dependencies!
        echo.
        echo Common causes:
        echo 1. No internet connection
        echo 2. Firewall blocking npm
        echo 3. Antivirus blocking downloads
        echo 4. npm registry is down
        echo.
        echo SOLUTIONS:
        echo - Check your internet connection
        echo - Try running as Administrator (Right-click -^> Run as administrator)
        echo - Temporarily disable antivirus
        echo - Try again in a few minutes
        echo.
        echo If the problem persists, copy the error message above
        echo and search for it online.
        echo.
        pause
        exit /b 1
    )

    echo.
    echo [SUCCESS] Dependencies installed!
)

echo.
pause
echo.

REM ===== STEP 2: Verify Installation =====
echo ========================================
echo  STEP 2: Verifying Installation
echo ========================================
echo.

if not exist "node_modules\electron\" (
    echo [ERROR] Electron not found in node_modules
    echo.
    echo Try deleting node_modules and running this script again.
    echo.
    pause
    exit /b 1
)

echo [OK] Electron is installed
echo.

if not exist "node_modules\electron-builder\" (
    echo [ERROR] electron-builder not found in node_modules
    echo.
    echo Try deleting node_modules and running this script again.
    echo.
    pause
    exit /b 1
)

echo [OK] electron-builder is installed
echo.

REM ===== STEP 3: Build Executable =====
echo ========================================
echo  STEP 3: Building Windows Executable
echo ========================================
echo.
echo This will create:
echo - Installer version (170 MB)
echo - Portable version (150 MB)
echo.
echo Time estimate: 2-3 minutes
echo.
echo Building now...
echo.

npm run build

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Build failed!
    echo.
    echo Please check the error messages above.
    echo.
    echo Common issues:
    echo 1. Not enough disk space (need ~500 MB)
    echo 2. Antivirus blocking the build
    echo 3. Another Electron app is running
    echo.
    echo SOLUTIONS:
    echo - Free up disk space
    echo - Temporarily disable antivirus
    echo - Close all Electron apps
    echo - Try running as Administrator
    echo.
    pause
    exit /b 1
)

echo.
echo [SUCCESS] Build completed!
echo.

REM ===== STEP 4: Verify Output =====
echo ========================================
echo  STEP 4: Verifying Build Output
echo ========================================
echo.

if not exist "dist\" (
    echo [WARNING] dist folder not found!
    echo The build might have failed.
    echo.
    pause
    exit /b 1
)

echo [OK] dist folder created
echo.

echo Looking for .exe files...
echo.

set FOUND_EXE=0

if exist "dist\Advanced Game of Life-2.0.0-x64.exe" (
    echo [OK] Found: Advanced Game of Life-2.0.0-x64.exe
    for %%I in ("dist\Advanced Game of Life-2.0.0-x64.exe") do echo     Size: %%~zI bytes
    set FOUND_EXE=1
)

if exist "dist\Advanced Game of Life-2.0.0-portable.exe" (
    echo [OK] Found: Advanced Game of Life-2.0.0-portable.exe
    for %%I in ("dist\Advanced Game of Life-2.0.0-portable.exe") do echo     Size: %%~zI bytes
    set FOUND_EXE=1
)

echo.

if %FOUND_EXE%==0 (
    echo [WARNING] No .exe files found in dist folder
    echo.
    echo What's in dist:
    dir /b dist
    echo.
) else (
    echo ========================================
    echo  BUILD SUCCESSFUL!
    echo ========================================
    echo.
    echo Your executables are ready in the dist folder!
    echo.
    echo Press any key to open the dist folder...
    pause >nul

    start explorer "dist"

    echo.
    echo NEXT STEPS:
    echo 1. Test the portable version first
    echo 2. If it works, you can share the installer version
    echo 3. Enjoy your high-performance Game of Life!
    echo.
)

echo.
pause
