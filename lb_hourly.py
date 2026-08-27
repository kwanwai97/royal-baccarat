#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
lb_hourly.py — 每小時排行榜自動更新 + 推送（恢復當年 auto: 每小時排行榜更新(含離線快照)）

流程：
  1. 跑 lb_sim.py 模擬一靴 60 局，更新 leaderboard.json
  2. git add + commit + push origin main（push 上 GitHub Pages = 離線快照，
     手機開 github.io 唔使連 PC Wi-Fi 都見到最新榜）
  3. 記低最後更新時間到 last_sim.log

用法：
  python lb_hourly.py          # 立即跑一次（手動測試用）
  Windows 排程每小時 call 呢個就係自動流程
"""
import subprocess, os, sys, datetime

# 強制 stdout/stderr UTF-8 (SYSTEM 帳號 console 用 cp950, emoji/中文會崩潰)
try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

HERE = os.path.dirname(os.path.abspath(__file__))

# 無論邊個帳號(SYSTEM/用戶)跑都自帶 git 身份 + SSH 鑰匙, 唔使依賴系統全域設定
SSH_KEY = os.path.join(HERE, '.ssh_rb_key')
os.environ.setdefault('GIT_AUTHOR_NAME', 'kwanwai97')
os.environ.setdefault('GIT_AUTHOR_EMAIL', 'kwanwai97@users.noreply.github.com')
os.environ.setdefault('GIT_COMMITTER_NAME', 'kwanwai97')
os.environ.setdefault('GIT_COMMITTER_EMAIL', 'kwanwai97@users.noreply.github.com')
# SYSTEM 帳號唔係 repo 擁有人, git 安全機制會拒絕 -> 用環境變數加 safe.directory (唔使改全域config)
os.environ['GIT_CONFIG_COUNT'] = '1'
os.environ['GIT_CONFIG_KEY_0'] = 'safe.directory'
os.environ['GIT_CONFIG_VALUE_0'] = HERE
if os.path.exists(SSH_KEY):
    os.environ['GIT_SSH_COMMAND'] = (
        f'ssh -i "{SSH_KEY}" -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null'
    )

# 將所有輸出同時寫入 lb_daemon.log (方便查 SYSTEM 任務錯誤)
_logpath = os.path.join(HERE, 'lb_daemon.log')
_logf = open(_logpath, 'a', encoding='utf-8')
class _Tee:
    def __init__(self, *streams): self.streams = streams
    def write(self, s):
        for t in self.streams: 
            try: t.write(s)
            except: pass
    def flush(self): 
        for t in self.streams:
            try: t.flush()
            except: pass
sys.stdout = _Tee(sys.stdout, _logf)
sys.stderr = _Tee(sys.stderr, _logf)

def run(cmd):
    print('$', ' '.join(cmd))
    r = subprocess.run(cmd, cwd=HERE, capture_output=True, text=True)
    if r.stdout:
        print(r.stdout.strip())
    if r.stderr:
        print('[stderr]', r.stderr.strip())
    return r.returncode

def main():
    # 1. 模擬
    rc = run([sys.executable, os.path.join(HERE, 'lb_sim.py')])
    if rc != 0:
        print('[X] lb_sim 失敗，唔 push', file=sys.stderr); return 1
    # 2. git commit + push
    run(['git', 'add', 'leaderboard.json'])
    now = datetime.datetime.now().strftime('%Y-%m-%d %H:%M')
    run(['git', 'commit', '-m', f'auto: 每小時排行榜更新(含離線快照) @ {now}'])
    rc = run(['git', 'push', 'origin', 'main'])
    # 3. 記錄
    with open(os.path.join(HERE, 'last_sim.log'), 'w', encoding='utf-8') as f:
        f.write(now + '\n')
    if rc != 0:
        print('[!] push 失敗（可能 credentials / 網絡），但 leaderboard.json 已更新，下次 push 補回', file=sys.stderr)
        return rc
    print(f'[OK] 每小時更新完成並 push @ {now}')
    return 0

if __name__ == '__main__':
    sys.exit(main())
