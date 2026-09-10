@echo off
REM Download the important Python libraries into the local store (pybrain\libs)
REM so the brain can use them, even offline afterwards. Safe to re-run.
setlocal
set HERE=%~dp0
where python >nul 2>nul && (set PY=python) || (set PY=py)
echo Installing important Python libraries into %HERE%libs ...
"%PY%" -m pip install --upgrade --target "%HERE%libs" -r "%HERE%requirements-libs.txt"
echo Done. Setayesh's brain now has these libraries.
pause
