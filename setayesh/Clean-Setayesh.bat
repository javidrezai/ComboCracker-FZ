@echo off
setlocal enableextensions enabledelayedexpansion
cd /d "%~dp0"
title Setayesh - Free up space
chcp 65001 >nul

rem --------------------------------------------------------------------------
rem  Setayesh's folder grew huge (tens of GB) because old SAFETY COPIES piled
rem  up - mostly the "rollback" folder, which had a full app copy stuck inside
rem  it that the app could not auto-delete. This tool removes only the copies
rem  that are safe to throw away and that the app rebuilds by itself.
rem
rem  DELETED (safe - regenerated automatically):
rem    rollback\        old undo snapshots (+ any stuck full copy)  <-- the big one
rem    Setayesh-Portable\   USB build output (make again with Build-Portable.bat)
rem    workspace\       scratch space
rem    updates\installed\   already-installed update zips
rem    updates\rejected\    rejected update zips
rem    node_modules\.cache\ build cache
rem    *.log            log files
rem
rem  KEPT (your data + what the app needs to run):
rem    node_modules\    the app's libraries
rem    .setayesh-*      your settings, chats, memory, devices, users
rem    backups\         your safety backups
rem    public\ pybrain\ code-library\ projects\ and all program files
rem --------------------------------------------------------------------------

echo.
echo   ==================================================
echo      Setayesh - free up disk space (safe cleanup)
echo   ==================================================
echo.
echo   This removes old safety copies the app rebuilds by itself.
echo   Your settings, chats, memory and backups are NOT touched.
echo.

rem --- Show how big the space-wasters are right now (best effort) ---
powershell -NoProfile -Command ^
  "$t=0; foreach($p in @('rollback','Setayesh-Portable','workspace','updates\installed','updates\rejected','node_modules\.cache')){ if(Test-Path $p){ try{ $s=(Get-ChildItem -LiteralPath $p -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum; if($s){ $t+=$s; '{0,10:N1} MB  {1}' -f ($s/1MB), $p } }catch{} } }; ''; '{0,10:N1} MB  TOTAL to reclaim' -f ($t/1MB)" 2>nul

echo.
echo   Close the Setayesh app first (the black window), then press any key
echo   to clean up. Close this window to cancel.
pause >nul

echo.
echo   Cleaning...

for %%D in (rollback "Setayesh-Portable" workspace) do (
  if exist "%%~D\" ( echo     removing %%~D ... & rmdir /s /q "%%~D" 2>nul )
)
if exist "updates\installed\" ( echo     removing updates\installed ... & rmdir /s /q "updates\installed" 2>nul )
if exist "updates\rejected\" ( echo     removing updates\rejected ... & rmdir /s /q "updates\rejected" 2>nul )
if exist "node_modules\.cache\" ( echo     removing node_modules\.cache ... & rmdir /s /q "node_modules\.cache" 2>nul )
del /q /f *.log 2>nul

echo.
echo   Done. Space has been freed.
echo.
echo   Note: OneDrive can take a few minutes to show the freed space, and it
echo   may re-download some files. If Setayesh is still inside OneDrive, run
echo   Move-Out-Of-OneDrive.bat so this does not keep happening.
echo.
pause
