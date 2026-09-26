@echo off
setlocal enableextensions enabledelayedexpansion
cd /d "%~dp0"
title Setayesh - Move out of OneDrive
chcp 65001 >nul

rem --------------------------------------------------------------------------
rem  Setayesh keeps reverting after an update because it lives inside OneDrive.
rem  OneDrive re-syncs the folder and restores the OLD files, so a new version
rem  never sticks (you saw the version go BACKWARD, and "no such file" errors).
rem  This copies Setayesh to a normal folder OUTSIDE OneDrive and starts it there.
rem  Nothing is deleted from OneDrive; you get a clean copy that updates cleanly.
rem --------------------------------------------------------------------------

set "SRC=%~dp0"
if "%SRC:~-1%"=="\" set "SRC=%SRC:~0,-1%"
set "DEST=%USERPROFILE%\Setayesh"

echo.
echo   ==================================================
echo      Setayesh - moving OUT of OneDrive (one time)
echo   ==================================================
echo.
echo   From : "%SRC%"
echo   To   : "%DEST%"
echo.
echo   Why: OneDrive keeps reverting the app files, so updates never stay.
echo   This makes a clean copy in a normal folder where updates work.
echo.

echo "%SRC%" | findstr /I "OneDrive" >nul
if errorlevel 1 (
  echo   NOTE: this folder does not look like it is inside OneDrive.
  echo         You can still continue if you want to copy it to "%DEST%".
  echo.
)

echo   Press any key to start, or close this window to cancel.
pause >nul

if not exist "%DEST%" mkdir "%DEST%"

echo.
echo   Copying files... this downloads any OneDrive "online-only" files and
echo   may take a few minutes. Please wait.
echo.
rem  /E all subfolders, /MT multithread, /R:1 /W:1 don't hang on a locked file,
rem  skip the noisy per-file log. Exclude runtime state and old logs.
robocopy "%SRC%" "%DEST%" /E /MT:16 /R:1 /W:1 /NFL /NDL /NP /XF "*.log" /XD "updates\installed" "updates\rejected" >nul

if not exist "%DEST%\index.js" (
  echo.
  echo   [!] Copy did not complete - "%DEST%\index.js" is missing.
  echo       Make sure OneDrive finished downloading the files, then run this again.
  echo.
  pause
  exit /b 1
)

echo.
echo   Done. Setayesh is now at:
echo     "%DEST%"
echo.
echo   IMPORTANT - from now on, ALWAYS start Setayesh from the new folder:
echo     "%DEST%\Start-Setayesh.bat"
echo   (You can delete the old OneDrive copy whenever you like.)
echo.
echo   Starting the new copy now...
echo.
cd /d "%DEST%"
call "%DEST%\Start-Setayesh.bat"
