@echo off
REM ============================================================================
REM  Setayesh — build a single launcher .exe  (Setayesh.exe)
REM ----------------------------------------------------------------------------
REM  جاوید: «یک فایل exe شود.»  This builds ONE double-clickable Setayesh.exe that
REM  carries Node inside it and starts the app from THIS folder — no "node" needed
REM  on the PC, no scary .bat.  Run this ONCE on Windows; it uses the Node that is
REM  already installed here (Node 20+), and Node's built-in Single-Executable
REM  feature (no extra download, no npm package).
REM
REM  IMPORTANT (honest): the .exe is only the LAUNCHER. The app's own files
REM  (index.js, public\, node_modules\, pybrain\ …) stay in this folder next to
REM  it, so the file-based auto-update keeps working. Keep Setayesh.exe in the
REM  same folder as these files. To move it to another PC, copy the whole folder.
REM ============================================================================
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo    Building Setayesh.exe  (this takes a few seconds) ...
echo.

REM 1) Need Node 20+ for the built-in SEA feature.
where node >nul 2>nul || (echo    Node is not installed. Install Node 20+ from https://nodejs.org & pause & exit /b 1)

REM 2) A tiny bootstrap that just runs index.js from the exe's own folder.
>  "%TEMP%\setayesh-boot.js" echo const path=require('path');
>> "%TEMP%\setayesh-boot.js" echo const dir=path.dirname(process.execPath);
>> "%TEMP%\setayesh-boot.js" echo process.chdir(dir);
>> "%TEMP%\setayesh-boot.js" echo process.env.SETAYESH_RELAUNCH=process.env.SETAYESH_RELAUNCH^|^|'1';
>> "%TEMP%\setayesh-boot.js" echo require(path.join(dir,'index.js'));

REM 3) SEA config.
> "%TEMP%\setayesh-sea.json" echo { "main": "%TEMP:\=\\%\\setayesh-boot.js", "output": "%TEMP:\=\\%\\setayesh-sea.blob", "disableExperimentalSEAWarning": true }

REM 4) Build the blob, copy the node binary, inject the blob into it.
node --experimental-sea-config "%TEMP%\setayesh-sea.json" || (echo    SEA build failed — is your Node version 20 or newer?  ^(node -v^) & pause & exit /b 1)
node -e "require('fs').copyFileSync(process.execPath,'Setayesh.exe')"
npx --yes postject Setayesh.exe NODE_SEA_BLOB "%TEMP%\setayesh-sea.blob" --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2 2>nul ^
  || node -e "const{inject}=require('node:sea');" 2>nul ^
  || echo    (postject step: if it failed, run:  npx postject Setayesh.exe NODE_SEA_BLOB %TEMP%\setayesh-sea.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2 )

echo.
echo    Done. Double-click  Setayesh.exe  in this folder to start.
echo    (Keep it in this folder — it launches the app files next to it.)
echo.
pause
