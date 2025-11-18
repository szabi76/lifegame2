@echo off
REM ============================================
REM Debug Build - Shows Console Output
REM ============================================

echo.
echo ========================================
echo  Building DEBUG version
echo  (Shows console errors)
echo ========================================
echo.

REM Check if Go is installed
where go >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Go is not installed!
    pause
    exit /b 1
)

echo [OK] Go found
echo.

REM Build WITHOUT windowsgui flag (shows console)
echo Building with console output...
echo.

go build -o "game-debug.exe" main.go

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Build failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo  DEBUG BUILD SUCCESSFUL!
echo ========================================
echo.
echo Created: game-debug.exe
echo.
echo This version will show a console window with any errors.
echo.
echo Running now...
echo.

REM Run the debug version
game-debug.exe

echo.
echo Game closed. Check above for any error messages.
echo.
pause
