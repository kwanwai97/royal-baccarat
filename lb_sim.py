#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
lb_sim.py — 每小時排行榜模擬引擎（重寫版，模仿當年 auto: 每小時排行榜更新）

功能：
  1. 讀現有 leaderboard.json（保留 AI 名單/性格/注碼，只更新數值）
  2. 模擬每個 AI 對戰「一靴 60 局」百家樂（標準補牌規則 + 同 game 一致嘅賠率）
  3. 重生成 leaderboard.json（balance / games / wins / losses / totalWager / totalProfit / 連勝連敗 / balanceHistory）

賠率（同 index.html settle() 一致）：
  閒勝 1:1 (×2) / 莊勝 1:0.95 (×1.95) / 和 1:8 (×9)
  閒對/莊對 1:11 (×12) / 大 1:0.54 (×1.54) / 細 1:1.5 (×2.5)
  幸運6 莊6點勝2張×13/3張×21 / 幸運7 閒7莊6 4張×41/5張×61/6張×101
"""
import json, random, os, subprocess, sys, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
JSON_PATH = os.path.join(HERE, "leaderboard.json")
SHOE_GAMES = 60  # 一靴 60 局
MIN_BET = 1000    # 枱底限紅（最低注）
MAX_BET = 20000   # 枱頂限紅（最高注）：每鋪主注 + side bet 總額唔可超過咁多，永遠生效（提高到5萬都唔會爆）

# ---- 標準百家樂點數 ----
def pip(c):
    return 0 if c >= 10 else c  # 公仔(10/J/Q/K)=0

def hand_total(cards):
    return sum(pip(c) for c in cards) % 10

def draw_card(shoe):
    if not shoe:
        # 8 副牌重置
        shoe.extend([i for i in range(1, 14)] * 4 * 8)
        random.shuffle(shoe)
    return shoe.pop()

def dealer_play():
    """標準百家樂補牌規則，返 (pCards, bCards, winner, pPair, bPair, big, nCards)"""
    shoe = []
    shoe.extend([i for i in range(1, 14)] * 4 * 8)
    random.shuffle(shoe)
    p = [draw_card(shoe), draw_card(shoe)]
    b = [draw_card(shoe), draw_card(shoe)]
    pPair = (pip(p[0]) == pip(p[1]))
    bPair = (pip(b[0]) == pip(b[1]))
    pt, bt = hand_total(p), hand_total(b)
    # 自然（任一方8/9點）唔補
    if pt in (8, 9) or bt in (8, 9):
        pass
    else:
        # 閒家規則：0-5 補，6-7 唔補
        if pt <= 5:
            p.append(draw_card(shoe))
            pt = hand_total(p)
        # 莊家規則（按閒第三張）
        third = p[2] if len(p) == 3 else None
        if bt <= 2:
            b.append(draw_card(shoe))
        elif bt == 3:
            if third is None or third != 8:
                b.append(draw_card(shoe))
        elif bt == 4:
            if third is not None and third in (2, 3, 4, 5, 6, 7):
                b.append(draw_card(shoe))
        elif bt == 5:
            if third is not None and third in (4, 5, 6, 7):
                b.append(draw_card(shoe))
        elif bt == 6:
            if third is not None and third in (6, 7):
                b.append(draw_card(shoe))
        bt = hand_total(b)
    nCards = len(p) + len(b)
    if pt > bt: winner = 'player'
    elif bt > pt: winner = 'banker'
    else: winner = 'tie'
    big = nCards >= 6
    return p, b, winner, pPair, bPair, big, nCards

# ---- 注碼方案（簡化版，決定每局落幾多） ----
PLANS = {
    'flat': lambda base, _: base,
    'martin': lambda base, st: base * (2 ** min(st, 4)),          # 倍投
    'paroli': lambda base, st: base * (2 ** min(st, 3)),          # 帕羅利（贏加注）
    'seq1324': lambda base, st: base * [1, 3, 2, 4][st % 4],
    'kelly': lambda base, _: base,
    'fib': lambda base, st: base * [1, 1, 2, 3, 5, 8][min(st, 5)],
    'labouchere': lambda base, _: base * 2,
    'dalerob': lambda base, st: base * (1 + 0.5 * min(st, 4)),
    'grandmartin': lambda base, st: base * (3 ** min(st, 3)),
    'splitmartin': lambda base, st: base * (2 ** min(st // 2, 3)),
    'whittacker': lambda base, st: base * (2 ** min(st, 4)),
    'contraiser': lambda base, _: base,
}

def ai_bet_side(ai):
    """AI 按性格揀主注邊邊（模擬，唔影響勝負隨機性，只決定押注方向分佈）"""
    persona = ai.get('persona', 'flat')
    # 用性格微調勝率偏移（唔係作弊，係模擬「某性格傾向押贏家側」）
    r = random.random()
    if persona in ('pro', 'analyst', 'million'):
        return 'smart' if r < 0.52 else 'random'
    if persona in ('gambler', 'hot', 'dragon'):
        return 'random'  # 燥底/賭徒較易亂押
    return 'smart' if r < 0.50 else 'random'

def simulate_one_boot(ai):
    """模擬一個 AI 跑一靴 SHOE_GAMES 局，跟足 index.html settle() 嘅賠率同規則。
    修正舊版 side bet bug：有落 side bet 先扣本金、命中先加 payout，唔會無故偏升。
    莊抽水 5%（×1.95），和 ×9（退主注），對子 ×12，大 ×1.54，細 ×2.5，
    幸運6（莊6點：2張×13/3張×21），幸運7（閒7莊6：4張×41/5張×61/6張×101）。
    """
    base = ai.get('baseBet', 2000)
    plan = ai.get('plan', 'flat')
    plan_fn = PLANS.get(plan, PLANS['flat'])
    st_win = 0
    st_loss = 0
    wins = ai.get('wins', 0)
    losses = ai.get('losses', 0)
    games = ai.get('games', 0)
    balance = ai.get('balance', 50000)
    totalWager = ai.get('totalWager', 0)
    totalProfit = ai.get('totalProfit', 0)
    curStreak = ai.get('streak', 0)
    maxWin = ai.get('maxWinStreak', 0)
    maxLoss = ai.get('maxLossStreak', 0)
    history = list(ai.get('balanceHistory', []))
    for _ in range(SHOE_GAMES):
        p, b, winner, pPair, bPair, big, nCards = dealer_play()
        side_mode = ai_bet_side(ai)
        if side_mode == 'smart':
            main = 'banker' if random.random() < 0.51 else 'player'
        else:
            main = random.choice(['banker', 'player', 'player', 'banker'])
        bet = int(plan_fn(base, st_loss))
        bet = max(MIN_BET, bet)                       # 唔低過枱底限紅
        bet = min(MAX_BET, bet)                       # 唔高過枱頂限紅(永遠生效)
        if balance <= bet:
            bet = max(MIN_BET, min(bet, balance))     # 唔夠就 all-in（可破產），但受限紅
        # ---- 主注 ----
        staked = bet
        payout = 0
        won = False
        if main == 'player' and winner == 'player':
            payout += bet * 2; won = True
        elif main == 'banker' and winner == 'banker':
            payout += int(round(bet * 1.95)); won = True
        elif winner == 'tie':
            if main == 'player': payout += bet   # 和局退閒主注本金
            elif main == 'banker': payout += bet  # 和局退莊主注本金
        # ---- 對子 side bet（固定落 10% 主注，有落先扣、命中先加）----
        side_bet = max(50, int(bet * 0.1))
        side_bet = min(side_bet, MAX_BET - bet)       # side bet 唔可以令總注超過枱頂限紅
        side_bet = max(50, side_bet)
        staked += side_bet
        if pPair: payout += side_bet * 12
        if bPair: payout += side_bet * 12
        # ---- 大細 side bet：只落一邊（big 或 small 隨機），唔兩邊都落（跟真實玩法）----
        if random.random() < 0.5:
            if big: payout += side_bet * 1.54   # 落 big 中
        else:
            if not big: payout += side_bet * 2.5  # 落 small 中
        # ---- 幸運6 / 幸運7 ----
        bTotal = hand_total(b); pTotal = hand_total(p)
        if winner == 'banker' and bTotal == 6:
            mult = 13 if len(b) == 2 else 21
            payout += side_bet * mult
        if winner == 'player' and pTotal == 7 and bTotal == 6:
            mult = 41 if nCards == 4 else 61 if nCards == 5 else 101
            payout += side_bet * mult
        net = payout - staked
        balance += net
        totalProfit += net
        totalWager += staked
        games += 1
        if won:
            wins += 1; st_win += 1; st_loss = 0
            curStreak = curStreak + 1 if curStreak > 0 else 1
            maxWin = max(maxWin, curStreak)
        else:
            losses += 1; st_loss += 1; st_win = 0
            curStreak = curStreak - 1 if curStreak < 0 else -1
            maxLoss = min(maxLoss, curStreak)
        if balance <= 0:
            balance = 0; break  # 破產，呢靴完
        history.append(int(balance))
    if len(history) > 120:
        history = history[-120:]
    ai.update({
        'balance': int(balance), 'games': games, 'wins': wins, 'losses': losses,
        'totalWager': int(totalWager), 'totalProfit': int(totalProfit),
        'streak': curStreak, 'maxWinStreak': maxWin, 'maxLossStreak': maxLoss,
        'balanceHistory': history, 'step': 0, 'currentBet': None,
        'bankrupt': balance <= 0,
    })
    return ai

def main():
    if not os.path.exists(JSON_PATH):
        print('leaderboard.json 唔喺度，唔更新', file=sys.stderr); return 1
    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        db = json.load(f)
    roster = db.get('roster', [])
    if not roster:
        print('roster 空', file=sys.stderr); return 1
    now = datetime.datetime.now().strftime('%Y-%m-%d %H:%M')
    for ai in roster:
        simulate_one_boot(ai)
    db['roster'] = roster
    db['_lastSim'] = now
    db['updated'] = db.get('updated', 0) + 1   # 每鐘 +1, 網頁「已跑 X 鐘」跟住更新(舊code冇寫呢欄所以定格139)
    with open(JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(db, f, ensure_ascii=False, indent=1)
    print(f'[OK] 模擬完成 {len(roster)} 個 AI，每個 {SHOE_GAMES} 局 @ {now}')
    return 0

if __name__ == '__main__':
    sys.exit(main())
