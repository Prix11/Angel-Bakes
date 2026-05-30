@echo off
cd /d "%~dp0"
title Angel Bakes - Setup

echo ========================================
echo   Angel Bakes - Starting shop server
echo ========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo ERROR: Node.js is not installed.
  echo Install from https://nodejs.org then run this file again.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing dependencies... first time only, please wait.
  call npm install
  if errorlevel 1 (
    echo ERROR: npm install failed.
    pause
    exit /b 1
  )
)

echo Stopping any old server on port 8080...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8080 ^| findstr LISTENING') do (
  taskkill /PID %%a /F >nul 2>&1
)

echo.
echo Opening server window - KEEP IT OPEN while you use the shop!
start "Angel Bakes Server" cmd /k "cd /d "%~dp0" && npm start"

echo Waiting for server to start...
timeout /t 4 /nobreak >nul

start http://localhost:8080/admin.html

echo.
echo ========================================
echo   Browser opened: admin login page
echo   Password: angelbakes
echo.
echo   IMPORTANT: Leave the "Angel Bakes Server"
echo   window open. Closing it stops orders.
echo ========================================
echo.
pause
