@echo off
chcp 65001 >nul
echo ========================================
echo   皇家百家樂 Server 重啟工具
echo ========================================
echo.
echo 正在停止舊 server...

REM 強制終止所有喺 port 8899 運行嘅 Python 進程
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8899 ^| findstr LISTENING') do (
    echo 終止 PID %%a...
    taskkill /F /PID %%a >nul 2>&1
)

timeout /t 2 /nobreak >nul

echo.
echo 啟動新 server...
cd /d C:\Users\wai\royal-baccarat
start "皇家百家樂 Server" /B python server.py

timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo   Server 應該已經啟動
echo   遊戲網址: http://localhost:8899
echo   管理後台: http://localhost:8899/admin
echo ========================================
echo.
echo 請勿關閉此視窗，否則 server 會停止
echo.
pause
