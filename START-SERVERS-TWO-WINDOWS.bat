@echo off
cd /d "%~dp0"

echo ============================================
echo   TESDA Calendar - Starting servers
echo ============================================
echo.

where node >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found. Please install Node.js and add it to PATH.
    pause
    exit /b 1
)

echo Opening Backend window (port 3001)...
start "TESDA Backend - leave open" cmd /k "cd /d ""%~dp0backend"" && echo Backend running at http://localhost:3001 && echo. && node server.js"

timeout /t 3 /nobreak >nul

echo Opening Frontend window (port 5174)...
start "TESDA Frontend - leave open" cmd /k "cd /d ""%~dp0frontend"" && echo Frontend: open http://localhost:5174 in your browser && echo. && npm run dev"

echo.
echo Two windows opened. In your browser go to:  http://localhost:5174
echo Close both command windows to stop the servers.
echo ============================================
pause
