@echo off
cd /d "%~dp0"

echo ============================================
echo   TESDA Calendar - Starting servers
echo ============================================
echo.

where node >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found. Please install Node.js and add it to PATH.
    echo Download: https://nodejs.org
    pause
    exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm not found. Please install Node.js.
    pause
    exit /b 1
)

echo [1/2] Starting Backend API on http://localhost:3001 ...
start "Backend" /B cmd /c "cd /d ""%~dp0backend"" && node server.js"
if errorlevel 1 (
    echo ERROR: Backend failed to start.
    pause
    exit /b 1
)

timeout /t 2 /nobreak >nul

echo [2/2] Starting Frontend on http://localhost:5174 ...
echo.
echo *** OPEN YOUR BROWSER:  http://localhost:5174  ***
echo.
echo Keep this window open. Close it to stop both servers.
echo ============================================
echo.

cd /d "%~dp0frontend"
npm run dev

pause
