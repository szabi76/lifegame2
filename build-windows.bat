@echo off
REM ============================================
REM Advanced Game of Life - Windows Build Script
REM ============================================

echo.
echo ========================================
echo  Advanced Game of Life Builder
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please download and install Node.js from:
    echo https://nodejs.org/
    echo.
    echo Recommended: Node.js 16 or higher
    pause
    exit /b 1
)

REM Display Node.js version
echo [INFO] Node.js version:
node --version
echo.

REM Check if npm is available
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not available!
    pause
    exit /b 1
)

REM Display npm version
echo [INFO] npm version:
npm --version
echo.

REM Step 1: Install dependencies
echo ========================================
echo  Step 1: Installing Dependencies
echo ========================================
echo.
echo This will download Electron (~200MB) and electron-builder (~50MB)
echo This may take 2-5 minutes depending on your internet speed...
echo.

npm install

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Failed to install dependencies!
    echo.
    echo Common solutions:
    echo 1. Check your internet connection
    echo 2. Try running as Administrator
    echo 3. Delete node_modules folder and try again
    echo 4. Check if antivirus is blocking npm
    pause
    exit /b 1
)

echo.
echo [SUCCESS] Dependencies installed!
echo.

REM Step 2: Build executable
echo ========================================
echo  Step 2: Building Windows Executable
echo ========================================
echo.
echo Building both installer and portable versions...
echo This may take 1-3 minutes...
echo.

npm run build

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Build failed!
    echo.
    echo Check the error messages above.
    pause
    exit /b 1
)

echo.
echo ========================================
echo  BUILD SUCCESSFUL!
echo ========================================
echo.
echo Your executables are ready in the 'dist' folder:
echo.
echo   Installer:  dist\Advanced Game of Life-2.0.0-x64.exe
echo   Portable:   dist\Advanced Game of Life-2.0.0-portable.exe
echo.
echo File sizes:
dir /s dist\*.exe 2>nul
echo.
echo ========================================
echo  Next Steps:
echo ========================================
echo.
echo 1. Find your executables in the 'dist' folder
echo 2. Test the portable version (no installation needed)
echo 3. Share the installer with others for easy installation
echo.
echo Press any key to open the dist folder...
pause >nul

REM Open dist folder in Windows Explorer
start explorer "dist"

echo.
echo Build process complete!
echo.
pause
