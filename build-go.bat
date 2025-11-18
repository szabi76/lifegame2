@echo off
REM ============================================
REM Go Build Script for Windows
REM ============================================

echo.
echo ========================================
echo  Building Advanced Game of Life (Go)
echo ========================================
echo.

REM Check if Go is installed
where go >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Go is not installed!
    echo.
    echo Download Go from: https://go.dev/dl/
    echo Install and run this script again.
    echo.
    pause
    exit /b 1
)

echo [OK] Go found:
go version
echo.

REM Download dependencies
echo Downloading dependencies...
echo This only needs to happen once (~10 MB)
echo.

go mod download

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Failed to download dependencies!
    pause
    exit /b 1
)

echo.
echo [OK] Dependencies downloaded
echo.

REM Build the executable
echo Building executable...
echo.

go build -ldflags="-s -w -H windowsgui" -o "Advanced-Game-of-Life.exe" main.go

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Build failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo  BUILD SUCCESSFUL!
echo ========================================
echo.
echo Your executable: Advanced-Game-of-Life.exe
echo.

REM Show file size
for %%I in ("Advanced-Game-of-Life.exe") do echo File size: %%~zI bytes (~%%~zI KB)
echo.

echo This is a single .exe file with NO dependencies!
echo Just share this file with anyone - it will run instantly!
echo.
echo Press any key to run the game...
pause >nul

start "" "Advanced-Game-of-Life.exe"
