@echo off
setlocal enableextensions
cd /d "%~dp0"
title Build Setayesh Portable (USB)

echo.
echo   ==================================================
echo      Building a portable, USB-ready copy of Setayesh
echo   ==================================================
echo.

rem --- 1) Find node.exe on THIS computer (its own standalone binary) ---
set "NODEEXE="
for /f "delims=" %%i in ('where node 2^>nul') do if not defined NODEEXE set "NODEEXE=%%i"
if not defined NODEEXE (
  echo   [!] Node.js is not installed on this PC.
  echo       Install the LTS version once from https://nodejs.org  then run this again.
  echo.
  pause
  exit /b 1
)
echo   Using Node:  %NODEEXE%

rem --- 2) Make sure dependencies are installed here first (one time) ---
if not exist "node_modules" (
  echo   Installing dependencies once...
  call npm install --no-audit --no-fund
  if errorlevel 1 ( echo   [!] npm install failed. Check your internet. & pause & exit /b 1 )
)

rem --- 3) Prepare the output folder ---
set "OUT=%~dp0Setayesh-Portable"
echo   Output:  %OUT%
if exist "%OUT%" rmdir /s /q "%OUT%"
mkdir "%OUT%\node"

rem --- 4) Copy the standalone node.exe (this is what lets it run without installing Node) ---
copy /y "%NODEEXE%" "%OUT%\node\node.exe" >nul
if not exist "%OUT%\node\node.exe" ( echo   [!] Could not copy node.exe & pause & exit /b 1 )

rem --- 5) Copy the app + node_modules, skipping runtime/private files ---
echo   Copying app files (this can take a minute)...
robocopy "%~dp0." "%OUT%" /E /NFL /NDL /NJH /NJS /NP ^
  /XD "Setayesh-Portable" ".git" "backups" "rollback" "inbox" "updates" "code-library" "board-files" "test" "scripts" ^
  /XF "*.log" ".setayesh-*" "tls-*.pem" "Build-Portable.bat" >nul

rem --- 6) Put the portable launcher + readme at the top ---
copy /y "%~dp0portable\Setayesh.bat" "%OUT%\Setayesh.bat" >nul
copy /y "%~dp0portable\README-PORTABLE.txt" "%OUT%\README-PORTABLE.txt" >nul

echo.
echo   ==================================================
echo      DONE.
echo   ==================================================
echo.
echo   1) Copy the whole  "Setayesh-Portable"  folder to your USB stick.
echo   2) On ANY Windows PC: open it and double-click  Setayesh.bat
echo      (no Node install, no internet needed).
echo.
echo   Note: your API keys are NOT copied. To carry them, also copy your
echo   ".setayesh-config" file into the Setayesh-Portable folder.
echo.
pause
