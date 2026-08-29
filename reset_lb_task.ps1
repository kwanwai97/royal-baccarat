# reset_lb_task.ps1 — 重置排行榜每小時任務 (必須 admin 跑)
# 用 bat 包裝: 先 cd 入 repo, 再用 repo 內 .ssh_rb_key push (SYSTEM 帳號都用到)
$py     = "C:\Users\wai\AppData\Local\Programs\Python\Python311\python.exe"
$repo   = "C:\Users\wai\royal-baccarat"
$bat    = "$repo\run_lb.bat"
$task   = "RoyalBaccarat_Hourly_LB"

# 1. 寫包裝 bat (cd repo 再跑 python)
@"
@echo off
cd /d $repo
"$py" "$repo\lb_hourly.py"
"@ | Set-Content -Path $bat -Encoding ASCII

# 2. 任務 action 改 call 呢個 bat (cwd 由 bat 自己 cd, SYSTEM 讀到 .ssh_rb_key)
$action  = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$bat`""
$trigger1 = New-ScheduledTaskTrigger -AtStartup
$trigger2 = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Hours 1)
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
Register-ScheduledTask -TaskName $task -Action $action -Trigger $trigger1,$trigger2 -Principal $principal -Force | Out-Null
Write-Host "DONE — 任務已用 bat 包裝(cd repo), SYSTEM 可讀 .ssh_rb_key"
