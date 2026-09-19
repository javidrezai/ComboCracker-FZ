@echo off
setlocal enableextensions
cd /d "%~dp0"
title Setayesh AI (Portable)

echo.
echo   ============================================
echo      Setayesh AI  -  Portable  (USB)
echo   ============================================
echo.
echo   Opening in your browser:  http://localhost:3000
echo   Keep THIS window open while you use Setayesh.
echo.

rem This portable copy carries its own Node (node\node.exe) and its own data,
rem so it needs NO install and NO internet on this PC.
set "SETAYESH_RELAUNCH=1"

start "" cmd /c "timeout /t 3 >nul & start "" http://localhost:3000"

:loop
"%~dp0node\node.exe" index.js
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
