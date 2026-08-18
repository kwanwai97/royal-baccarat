# 🎰 皇家百家樂 · 真人豪華版

一個純網頁、無後端嘅百家樂遊戲（GitHub Pages 託管）。

## ✅ 正確網址（請用呢個）

```
https://kwanwai97.github.io/royal-baccarat/
```

⚠️ **注意 k-w-a-i 有 3 個 k 字**：`kwanwai97`，唔係 `nwai97`（少個 k）。
開錯 `nwai97` 會去咗別人/舊嘅頁，見到「載入中…」或者無內容就係開錯。

## 點用

1. 手機/電腦開上面個網址 → **Ctrl+Shift+R 硬刷**（GitHub 有緩存，等幾秒）
2. 左上角有 🏆 **AI排行榜** 掣 → 撳佢開新視窗睇排行榜
3. 仲有：大路/珠盤路/下三路、跟預測/反預測/跟旺AI/反旺AI、注碼選擇、AI 陪玩等

## 🏆 AI 排行榜（電腦後台）

- 屋企電腦每小時自動跑 60 局（全枱共用牌路），累積唔清除
- 排行榜頁已內嵌「離線快照」，**出街斷網都睇得**（標示「離線快照·非即時」）
- 要出街睇到最新數據：屋企 WiFi 下開 → 即時；出街無屋企連線 → 用快照

## 檔案

- `index.html` —— 主遊戲頁（live）
- `leaderboard.html` —— 排行榜頁（含離線快照）
- `baccarat_luxury.html` —— 舊版豪華頁（分叉，未含新功能）

## 電腦後台（Windows）

資料夾 `C:\Users\wai\Desktop\BaccaratAI\`：
- `lb_sim.py` / `lb_hourly.py` —— 每小時模擬，寫 `leaderboard.json`
- `serve.py` —— 本地伺服器（端口 8888），比網頁讀 JSON
- `啟動Ollama溝通.bat` —— 本地 AI 溝通（🧠掣用）
- `setup_autostart.bat` —— 以系統管理員跑一次，設登入自啟伺服器

Windows 排程：`BaccaratLeaderboard`（每小時模擬）、`BaccaratServe`（登入自啟伺服器）
