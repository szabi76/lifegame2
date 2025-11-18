@echo off
REM Quick Development Test Script

echo.
echo Starting Advanced Game of Life in Development Mode...
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js not found!
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies...
    echo This will take 3-5 minutes on first run...
    echo.
    npm install
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo Failed to install dependencies!
        pause
        exit /b 1
    )
)

REM Start development server
echo.
echo Starting Electron...
echo Press Ctrl+C to stop
echo.

npm start
