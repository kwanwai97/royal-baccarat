# 🛡️ 最安全版本（安全點記錄）

呢個檔係**手寫入倉庫**嘅安全記錄，唔靠任何人記憶、唔靠 Agent 記憶。
所有介面改動、功能改動喺 2026-08-29 已全部完成。以下係「最安全版本」嘅還原方法。

---

## ✅ 最安全版本（鎖定點）

- **Git 標籤**：`safe-clean-start`
- **Commit**：`ee95280`（2026-08-29 自動每小時排行榜更新，含 v118 邊框恢復 + 全部 UI 完成）
- 手機網址：`https://kwanwai97.github.io/royal-baccarat/index.html?v=118`

呢個點 = 全部功能確認完成、可玩、無已知問題嘅狀態。

---

## 🔄 點樣返轉頭（還原到安全點）

如果之後清 code / 改嘢整壞咗，跟以下做（搵識電腦嘅人幫手，或叫 Agent 做）：

```bash
cd C:/Users/wai/royal-baccarat
git fetch origin
git checkout safe-clean-start          # 返到安全點（檔案變返安全版）
git push origin main --force           # 推返去 GitHub（覆蓋壞咗嘅版本）
```

> ⚠️ `--force` 會覆蓋線上版本，只喺確定要還原嗰陣用。
> 如果唔想 force push，可以：`git checkout -b safe-restore safe-clean-start` 再同 Agent 講。

---

## 🚫 清理 code 嘅安全守則（零風險）

1. **只清「確定死咗」嘅 code**：註咗嘅舊段（`/* ... */` 或 `//` 包住、且確定無 call）、冇人 call 嘅函數、重複廢位。
2. **絕對唔好「重執 / 優化 / 重寫」仲用緊嘅 code** —— 呢類最容易整壞一啲平時唔撳、但某情況先出現嘅功能，而且壞咗唔會即時報錯。
3. **每清一批 → 真機驗證 → 先 commit + push**：唔可以一次過清一大堆。
4. **每個 commit 都可以獨立返轉頭**：如果清錯，一句 `git revert <commit>` 就返到上一個安全步。
5. **永遠唔好刪 `safe-clean-start` 呢個標籤**。

---

## 📋 安全掃描進度（只讀，未改任何嘢）

- [ ] 第一步：只讀掃描，列出確定死咗嘅廢 code（未完成）
- [ ] 第二步起：分批清 + 真機驗證 + 逐個 commit

> 掃描階段**唔會改任何檔案**，純列出建議。要清先要你批。

---

## 📁 呢個倉庫有咩（重要檔）

- `index.html` — 網頁主檔（手機玩嘅介面）
- `leaderboard.html` — 伺服榜（電腦後台 AI 排行）
- `lb_sim.py` — 伺服版模擬引擎（12人物×12投注×5性格，68 個隨機組合，破產次數累加）
- `leaderboard.json` — AI 排行數據（每小時自動更新）
- `lb_hourly.py` / `lb_daemon.py` — 每小時自動跑嘅後台
- `serve.py` — 本地 8888 端口（手機連電腦用）

> `*.png` / `*.log` / `__pycache__` / `_*.js` 等係測試垃圾，唔入倉（已 gitignore 或唔 add）。
