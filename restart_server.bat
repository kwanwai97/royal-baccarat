@echo off
cd /d C:\Users\wai\royal-baccarat

echo Stopping old server...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8899 ^| findstr LISTENING') do (
    echo Killing PID %%a...
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo Starting server...
python server.py
pause
