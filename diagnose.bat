@echo off
REM ============================================
REM Diagnostic Script - Check Build Environment
REM ============================================

echo.
echo ========================================
echo  DIAGNOSTIC CHECK
echo ========================================
echo.

REM Check 1: Node.js
echo [1] Checking Node.js installation...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [X] FAIL: Node.js is NOT installed
    echo.
    echo SOLUTION:
    echo 1. Download Node.js from: https://nodejs.org/
    echo 2. Install it (use default settings)
    echo 3. Restart your computer
    echo 4. Run this script again
    echo.
    goto :end
) else (
    echo [OK] Node.js is installed
    node --version
)

echo.

REM Check 2: npm
echo [2] Checking npm...
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [X] FAIL: npm is NOT available
    echo.
    echo SOLUTION: Reinstall Node.js from https://nodejs.org/
    goto :end
) else (
    echo [OK] npm is available
    npm --version
)

echo.

REM Check 3: package.json
echo [3] Checking package.json...
if not exist "package.json" (
    echo [X] FAIL: package.json NOT found
    echo.
    echo SOLUTION:
    echo You might be in the wrong folder!
    echo Make sure you're in the lifegame2 folder with all the files.
    echo.
    echo Current directory:
    cd
    echo.
    goto :end
) else (
    echo [OK] package.json found
)

echo.

REM Check 4: node_modules
echo [4] Checking dependencies...
if not exist "node_modules\" (
    echo [!] WARNING: node_modules folder does not exist
    echo This means dependencies haven't been installed yet.
    echo.
    echo This will be created when you run the build.
    echo.
) else (
    echo [OK] node_modules exists

    REM Check if electron is installed
    if exist "node_modules\electron\" (
        echo [OK] Electron is installed
    ) else (
        echo [!] WARNING: Electron not found in node_modules
    )

    if exist "node_modules\electron-builder\" (
        echo [OK] electron-builder is installed
    ) else (
        echo [!] WARNING: electron-builder not found in node_modules
    )
)

echo.

REM Check 5: dist folder
echo [5] Checking dist folder...
if not exist "dist\" (
    echo [!] INFO: dist folder does not exist yet
    echo This is normal - it will be created when you build.
) else (
    echo [OK] dist folder exists
    echo.
    echo Contents:
    dir /b dist\*.exe 2>nul
    if %ERRORLEVEL% NEQ 0 (
        echo (No .exe files found)
    )
)

echo.

REM Check 6: Internet connection (basic check)
echo [6] Checking internet connection...
ping -n 1 registry.npmjs.org >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [X] WARNING: Cannot reach npm registry
    echo This might be a firewall or internet issue.
    echo.
    echo SOLUTIONS:
    echo - Check your internet connection
    echo - Disable VPN temporarily
    echo - Check Windows Firewall settings
    echo - Try disabling antivirus temporarily
) else (
    echo [OK] Can reach npm registry
)

echo.
echo ========================================
echo  DIAGNOSTIC SUMMARY
echo ========================================
echo.

REM Final recommendation
if not exist "node_modules\" (
    echo NEXT STEP: Run the build script
    echo It will install dependencies first, then build.
    echo.
    echo Double-click: build-windows.bat
    echo.
) else if not exist "dist\" (
    echo NEXT STEP: Dependencies are installed
    echo Now run: build-windows.bat to create the .exe
    echo.
) else (
    echo Status: Everything looks good!
    echo Check the dist folder for your .exe files.
    echo.
)

:end
echo.
echo Press any key to exit...
pause >nul
