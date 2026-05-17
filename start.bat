@echo off
title MiniVerto
cd /d "%~dp0"

if not exist "node_modules\" (
    echo [MiniVerto] node_modules not found, running npm install...
    npm install
    if errorlevel 1 (
        echo [MiniVerto] npm install failed!
        pause
        exit /b 1
    )
)

echo ================================================
echo   MiniVerto - http://localhost:5173
echo ================================================
echo.
echo  Starting dev server...
echo  To stop: press Ctrl+C or close this window
echo.

timeout /t 3 /nobreak >nul & start http://localhost:5173
npm run dev
pause
