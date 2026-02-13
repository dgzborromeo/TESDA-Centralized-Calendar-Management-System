@echo off
cd /d "%~dp0"

title TESDA Calendar - Database Setup
echo ============================================
echo   TESDA Calendar - Database Setup
echo ============================================
echo.

where node >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found. Install from https://nodejs.org
    pause
    exit /b 1
)

echo Make sure MySQL is running in XAMPP Control Panel.
echo.
echo Creating database, tables, and admin user...
echo --------------------------------------------
cd /d "%~dp0backend"

node scripts/setup-database.js
if errorlevel 1 (
    echo.
    echo If you see "Access denied": edit backend\.env and set DB_PASSWORD= your MySQL password
    echo If you see "connect ECONNREFUSED": start MySQL in XAMPP first
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================
echo   Setup complete.
echo   Login: admin@tesda.gov / admin123
echo   Run START-SERVERS.bat then open http://localhost:5173
echo ============================================
pause
