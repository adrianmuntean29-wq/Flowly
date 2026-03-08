@echo off
echo Cleaning up Next.js processes...

REM Kill any Node processes on port 3000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo Killing process %%a
    taskkill /F /PID %%a 2>nul
)

REM Remove lock file
if exist .next\dev\lock (
    del .next\dev\lock
    echo Removed lock file
)

echo.
echo Starting Next.js dev server...
npm run dev
