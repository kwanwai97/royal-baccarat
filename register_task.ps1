$py = "C:/Users/wai/AppData/Local/Programs/Python/Python311/python.exe"
$script = "C:/Users/wai/royal-baccarat/lb_hourly.py"
$task = "RoyalBaccarat_Hourly_LB"
$action = New-ScheduledTaskAction -Execute $py -Argument $script
# 開機觸發(電腦重啟自啟) + 每小時重複(保持每小時push排行榜)
$trigger1 = New-ScheduledTaskTrigger -AtStartup
$trigger2 = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Hours 1)
$principal = New-ScheduledTaskPrincipal -UserId "wai" -LogonType Password -RunLevel Highest
Register-ScheduledTask -TaskName $task -Action $action -Trigger $trigger1,$trigger2 -Principal $principal -Force
Write-Host "DONE"
