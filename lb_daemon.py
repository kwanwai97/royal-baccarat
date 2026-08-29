#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
lb_daemon.py — 常駐每小時跑 lb_hourly.py（唔使 admin，PC 重啟要重開）
替代 Windows 排程嘅臨時方案，證明「每小時更新」流程 work。
"""
import subprocess, os, sys, time, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
LOG = os.path.join(HERE, 'lb_daemon.log')
PY = sys.executable

def log(msg):
    line = f"[{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {msg}"
    print(line, flush=True)
    with open(LOG, 'a', encoding='utf-8') as f:
        f.write(line + '\n')

def main():
    log('=== lb_daemon 起動（每小時跑 lb_hourly.py）===')
    # 立即跑第一次
    while True:
        try:
            r = subprocess.run([PY, os.path.join(HERE, 'lb_hourly.py')],
                               cwd=HERE, capture_output=True, text=True, timeout=300)
            out = (r.stdout + r.stderr).strip().replace('\n', ' | ')
            log('run rc=%d %s' % (r.returncode, out[-300:]))
        except Exception as e:
            log('EXCEPTION %s' % e)
        log('瞓 3600s ...')
        time.sleep(3600)

if __name__ == '__main__':
    main()
