@echo off
setlocal
cd /d "%~dp0"
where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js and npm are required. Install Node.js 22 or newer.
  pause
  exit /b 1
)
if not exist "node_modules\vite\bin\vite.js" (
  call npm ci
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
echo Starting Forma at http://127.0.0.1:5173/
call npm run dev -- --open
pause
