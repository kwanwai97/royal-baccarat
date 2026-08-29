$py = "C:/Users/wai/AppData/Local/Programs/Python/Python311/python.exe"
$script = "-m http.server 8888"
$task = "RoyalBaccarat_LocalServer_8888"
# 背景長期 run 嘅 server, 用 cmd /c 包住令佢唔彈窗, 開機自啟
$action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$py`" $script --directory C:/Users/wai/royal-baccarat > C:/Users/wai/royal-baccarat/server_8888.log 2>&1"
$trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit 0
Register-ScheduledTask -TaskName $task -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force
Write-Host "DONE"
