# 放行 8888 入站（區網手機/電腦連本地 server 用）
# 必須以系統管理員身分執行
New-NetFirewallRule -DisplayName "RoyalBaccarat LocalServer 8888" `
  -Direction Inbound `
  -Protocol TCP `
  -LocalPort 8888 `
  -Action Allow `
  -Profile Any `
  -Enabled True
Write-Host "已新增防火牆入站規則：RoyalBaccarat LocalServer 8888 (TCP 8888 Allow)"
