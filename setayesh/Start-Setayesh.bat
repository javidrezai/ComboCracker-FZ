@echo off
setlocal enableextensions
cd /d "%~dp0"
title Setayesh AI

echo.
echo   ============================================
echo      Starting Setayesh AI
echo   ============================================
echo.

rem --- Node.js must be installed ---
where node >nul 2>nul
if errorlevel 1 (
  echo   [!] Node.js is not installed.
  echo       Install the LTS version from https://nodejs.org  then run this file again.
  echo.
  pause
  exit /b 1
)

rem --- First run installs dependencies (one time) ---
if not exist "node_modules" (
  echo   First run: installing dependencies. This happens only once...
  echo.
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    echo.
    echo   [!] npm install failed. Check your internet connection and run this file again.
    echo.
    pause
    exit /b 1
  )
  echo.
)

rem --- Use the OS trust store when Node supports it (20.6+), so antivirus HTTPS
rem     interception does not break calls to the AI providers. Falls back cleanly. ---
set "CA="
node --use-system-ca -e "0" >nul 2>nul && set "CA=--use-system-ca"

rem --- Enable the in-app Restart button: this launcher relaunches on exit code 88 ---
set "SETAYESH_RELAUNCH=1"

echo   The app will open in your browser at:  http://localhost:3000
echo   Keep THIS window open while you use Setayesh.
echo.

rem --- Open the browser once, a few seconds after the server starts ---
start "" cmd /c "timeout /t 3 >nul & start "" http://localhost:3000"

:loop
node %CA% index.js
if "%errorlevel%"=="88" (
  echo.
  echo   Restarting Setayesh...
  echo.
  goto loop
)

echo.
echo   Setayesh has stopped. You can close this window.
echo.
pause
