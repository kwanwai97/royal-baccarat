#!/usr/bin/env python3
# royal-baccarat commercial server (localhost:8899)
from flask import Flask, request, jsonify, send_from_directory, session, redirect, url_for
import json, os, secrets, sqlite3, datetime
from werkzeug.middleware.proxy_fix import ProxyFix
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app)
app.secret_key = os.environ.get('FLASK_SECRET', 'royal-baccarat-local-secret-2026')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
DB_PATH = os.path.join(DATA_DIR, 'royal_baccarat.db')
USERS_JSON = os.path.join(DATA_DIR, 'users.json')
os.makedirs(DATA_DIR, exist_ok=True)

# ===================== SQLite =====================
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        password_hash TEXT NOT NULL,
        name TEXT,
        balance INTEGER DEFAULT 100000,
        coins INTEGER DEFAULT 0,
        ai_revives INTEGER DEFAULT 0,
        avatar TEXT DEFAULT '👤',
        role TEXT DEFAULT 'user',
        banned INTEGER DEFAULT 0,
        created_at TEXT,
        last_login TEXT
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        type TEXT,
        amount INTEGER,
        ref TEXT,
        meta TEXT,
        created_at TEXT
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS game_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        started_at TEXT,
        ended_at TEXT,
        rounds INTEGER DEFAULT 0,
        net INTEGER DEFAULT 0
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS rooms (
        id TEXT PRIMARY KEY,
        name TEXT,
        host TEXT,
        players INTEGER DEFAULT 1,
        max_players INTEGER DEFAULT 8,
        status TEXT DEFAULT 'waiting',
        created_at TEXT
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS chat (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room TEXT,
        user_id TEXT,
        message TEXT,
        created_at TEXT
    )''')
    conn.commit()
    conn.close()

init_db()

# ===================== Helpers =====================
def now_iso():
    return datetime.datetime.now().isoformat()

def get_user_or_404(uid):
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT * FROM users WHERE id=?', (uid,))
    row = c.fetchone()
    conn.close()
    if not row:
        return None
    return dict(row)

def update_user_field(uid, **fields):
    conn = get_db()
    c = conn.cursor()
    sets = ', '.join(f'{k}=?' for k in fields)
    vals = list(fields.values()) + [uid]
    c.execute(f'UPDATE users SET {sets} WHERE id=?', vals)
    conn.commit()
    conn.close()

def add_transaction(uid, ttype, amount, ref='', meta=''):
    conn = get_db()
    c = conn.cursor()
    c.execute('INSERT INTO transactions (user_id, type, amount, ref, meta, created_at) VALUES (?,?,?,?,?,?)',
              (uid, ttype, amount, ref, meta, now_iso()))
    conn.commit()
    conn.close()

# ===================== Auth routes =====================
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/login')
def login_page():
    return send_from_directory('.', 'login.html')

@app.route('/topup')
def topup_page():
    return send_from_directory('.', 'topup.html')

@app.route('/admin')
def admin_page():
    return send_from_directory('.', 'admin.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login_page'))

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    username = (data.get('username') or '').strip()
    password = data.get('password') or ''
    if not username or not password:
        return jsonify({'success': False, 'error': '請輸入帳號密碼'}), 400
    if len(username) < 3:
        return jsonify({'success': False, 'error': '帳號至少3個字'}), 400
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT id FROM users WHERE id=?', (username,))
    if c.fetchone():
        conn.close()
        return jsonify({'success': False, 'error': '帳號已存在'}), 409
    c.execute('INSERT INTO users (id, password_hash, name, created_at, last_login) VALUES (?,?,?,?,?)',
              (username, generate_password_hash(password), username, now_iso(), now_iso()))
    conn.commit()
    conn.close()
    add_transaction(username, 'register', 0, meta='初始註冊')
    session['user_id'] = username
    return jsonify({'success': True, 'user': {'id': username, 'name': username, 'balance': 100000, 'coins': 0, 'ai_revives': 0, 'avatar': '👤'}})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = (data.get('username') or '').strip()
    password = data.get('password') or ''
    user = get_user_or_404(username)
    if not user or not check_password_hash(user['password_hash'], password):
        return jsonify({'success': False, 'error': '帳號或密碼錯誤'}), 401
    if user.get('banned'):
        return jsonify({'success': False, 'error': '此帳號已被封禁'}), 403
    update_user_field(username, last_login=now_iso())
    session['user_id'] = username
    return jsonify({'success': True, 'user': {
        'id': user['id'], 'name': user['name'], 'balance': user['balance'],
        'coins': user['coins'], 'ai_revives': user['ai_revives'], 'avatar': user['avatar']
    }})

@app.route('/api/user', methods=['GET'])
def get_user():
    uid = session.get('user_id') or request.args.get('id', 'guest')
    user = get_user_or_404(uid)
    if not user:
        return jsonify({'id': 'guest', 'name': '玩家', 'balance': 100000, 'coins': 0, 'ai_revives': 0, 'avatar': '👤'})
    return jsonify({
        'id': user['id'], 'name': user['name'], 'balance': user['balance'],
        'coins': user['coins'], 'ai_revives': user['ai_revives'], 'avatar': user['avatar'],
        'role': user['role'], 'banned': bool(user['banned'])
    })

@app.route('/api/user', methods=['POST'])
def update_user():
    data = request.get_json() or {}
    uid = data.get('id') or session.get('user_id') or 'guest'
    user = get_user_or_404(uid)
    if not user:
        return jsonify({'success': False, 'error': 'User not found'}), 404
    allowed = ['name', 'avatar', 'balance', 'coins', 'ai_revives']
    fields = {k: data[k] for k in allowed if k in data}
    if fields:
        update_user_field(uid, **fields)
    return jsonify(get_user_or_404(uid))

@app.route('/api/user/balance', methods=['POST'])
def update_balance():
    data = request.get_json() or {}
    uid = session.get('user_id') or data.get('id') or 'guest'
    amount = int(data.get('balance') or 0)
    user = get_user_or_404(uid)
    if not user:
        return jsonify({'success': False, 'error': 'User not found'}), 404
    if user.get('banned'):
        return jsonify({'success': False, 'error': '帳號已被封禁'}), 403
    update_user_field(uid, balance=amount)
    add_transaction(uid, 'game_sync', 0, meta=f'遊戲同步餘額 {amount}')
    return jsonify({'success': True, 'balance': amount})

@app.route('/api/recharge', methods=['POST'])
def recharge():
    data = request.get_json() or {}
    uid = session.get('user_id') or data.get('id') or 'guest'
    amount = int(data.get('amount') or 0)
    if amount <= 0:
        return jsonify({'success': False, 'error': '無效充值'}), 400
    user = get_user_or_404(uid)
    if not user:
        return jsonify({'success': False, 'error': 'User not found'}), 404
    if user.get('banned'):
        return jsonify({'success': False, 'error': '帳號已被封禁'}), 403
    new_coins = (user['coins'] or 0) + amount
    update_user_field(uid, coins=new_coins)
    add_transaction(uid, 'recharge', amount, ref=data.get('ref', ''), meta=f'充值 {amount}')
    return jsonify({'success': True, 'coins': new_coins, 'balance': get_user_or_404(uid)['balance']})

@app.route('/api/buy-revives', methods=['POST'])
def buy_revives():
    data = request.get_json() or {}
    uid = session.get('user_id') or data.get('id') or 'guest'
    count = int(data.get('count') or 1)
    price = int(data.get('price') or 0)
    user = get_user_or_404(uid)
    if not user:
        return jsonify({'success': False, 'error': 'User not found'}), 404
    if user.get('banned'):
        return jsonify({'success': False, 'error': '帳號已被封禁'}), 403
    if (user['coins'] or 0) < price:
        return jsonify({'success': False, 'error': '金幣不足'}), 400
    new_coins = user['coins'] - price
    new_revives = (user.get('ai_revives') or 0) + count
    update_user_field(uid, coins=new_coins, ai_revives=new_revives)
    add_transaction(uid, 'buy_revives', -price, meta=f'購買復活次數 x{count}')
    return jsonify({'success': True, 'coins': new_coins, 'revives': new_revives})

@app.route('/api/payment/create', methods=['POST'])
def create_payment():
    data = request.get_json() or {}
    uid = session.get('user_id') or data.get('id') or 'guest'
    amount = int(data.get('amount') or 0)
    method = data.get('method') or 'wechat'
    if amount <= 0:
        return jsonify({'success': False, 'error': '無效金額'}), 400
    user = get_user_or_404(uid)
    if not user:
        return jsonify({'success': False, 'error': 'User not found'}), 404
    if user.get('banned'):
        return jsonify({'success': False, 'error': '帳號已被封禁'}), 403
    # Generate order
    order_id = f"PAY_{uid}_{amount}_{int(datetime.datetime.now().timestamp())}"
    conn = get_db()
    c = conn.cursor()
    c.execute('INSERT INTO payment_orders (user_id, amount, status, created_at) VALUES (?,?,?,?)',
              (uid, amount, 'pending', now_iso()))
    order_db_id = c.lastrowid
    conn.commit()
    conn.close()
    # Generate QR code
    qr_path = generate_payment_qr(order_id, amount, method)
    return jsonify({
        'success': True,
        'order_id': order_id,
        'qr_url': qr_path,
        'amount': amount,
        'method': method,
        'status': 'pending'
    })

@app.route('/api/payment/confirm', methods=['POST'])
def confirm_payment():
    data = request.get_json() or {}
    order_id = data.get('order_id')
    if not order_id:
        return jsonify({'success': False, 'error': '缺少訂單號'}), 400
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT * FROM payment_orders WHERE id=?', (order_id,))
    order = c.fetchone()
    if not order:
        conn.close()
        return jsonify({'success': False, 'error': '訂單不存在'}), 404
    if order['status'] == 'confirmed':
        conn.close()
        return jsonify({'success': True, 'message': '訂單已確認'})
    # Update order status
    c.execute('UPDATE payment_orders SET status=?, confirmed_at=? WHERE id=?',
              ('confirmed', now_iso(), order_id))
    # Add coins to user
    user_id = order['user_id']
    amount = order['amount']
    c.execute('UPDATE users SET coins = coins + ? WHERE id=?', (amount, user_id))
    conn.commit()
    conn.close()
    add_transaction(user_id, 'payment_confirm', amount, ref=order_id, meta='支付確認')
    return jsonify({'success': True, 'message': '支付已確認', 'coins_added': amount})

@app.route('/api/payment/pending', methods=['GET'])
def list_pending():
    uid = session.get('user_id')
    if not uid:
        return jsonify({'success': False, 'error': '未登入'}), 401
    me = get_user_or_404(uid)
    if not me or me.get('role') != 'admin':
        return jsonify({'success': False, 'error': '無權限'}), 403
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT * FROM payment_orders WHERE status="pending" ORDER BY created_at DESC')
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    return jsonify({'success': True, 'orders': rows})

def generate_payment_qr(order_id, amount, method):
    """Generate QR code image for payment"""
    import qrcode
    import os
    qr_dir = os.path.join(DATA_DIR, 'qrcodes')
    os.makedirs(qr_dir, exist_ok=True)
    # Payment info URL (simulated)
    if method == 'wechat':
        pay_url = f"weixin://wxpay/bizpayurl?pr={order_id}"
    else:
        pay_url = f"https://qr.alipay.com/{order_id}"
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(pay_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    filename = f"{order_id}.png"
    filepath = os.path.join(qr_dir, filename)
    img.save(filepath)
    return f"/data/qrcodes/{filename}"

# ===================== Admin =====================
@app.route('/api/admin/users', methods=['GET'])
def admin_list_users():
    uid = session.get('user_id')
    if not uid:
        return jsonify({'success': False, 'error': '未登入'}), 401
    me = get_user_or_404(uid)
    if not me or me.get('role') != 'admin':
        return jsonify({'success': False, 'error': '無權限'}), 403
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT id, name, balance, coins, role, banned, created_at, last_login FROM users ORDER BY created_at DESC')
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    return jsonify({'success': True, 'users': rows})

@app.route('/api/admin/user/<uid>', methods=['POST'])
def admin_update_user(uid):
    me = session.get('user_id')
    if not me:
        return jsonify({'success': False, 'error': '未登入'}), 401
    my = get_user_or_404(me)
    if not my or my.get('role') != 'admin':
        return jsonify({'success': False, 'error': '無權限'}), 403
    data = request.get_json() or {}
    allowed = ['balance', 'coins', 'ai_revives', 'role', 'banned', 'name']
    fields = {k: data[k] for k in allowed if k in data}
    if 'balance' in fields:
        fields['balance'] = int(fields['balance'])
    if 'coins' in fields:
        fields['coins'] = int(fields['coins'])
    if 'ai_revives' in fields:
        fields['ai_revives'] = int(fields['ai_revives'])
    if 'banned' in fields:
        fields['banned'] = 1 if fields['banned'] else 0
    update_user_field(uid, **fields)
    return jsonify({'success': True, 'user': get_user_or_404(uid)})

@app.route('/transactions.html')
def transactions_page():
    return send_from_directory('.', 'transactions.html')

@app.route('/shop.html')
def shop_page():
    return send_from_directory('.', 'shop.html')

@app.route('/api/user/transactions', methods=['GET'])
def user_transactions():
    uid = session.get('user_id') or request.args.get('id', 'guest')
    if uid == 'guest':
        return jsonify({'success': False, 'error': '未登入', 'transactions': []})
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT * FROM transactions WHERE user_id=? ORDER BY created_at DESC LIMIT 200', (uid,))
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    return jsonify({'success': True, 'transactions': rows})

# ===================== Leaderboard =====================
@app.route('/leaderboard.html')
def leaderboard_page():
    return send_from_directory('.', 'leaderboard.html')

@app.route('/chat.html')
def chat_page():
    return send_from_directory('.', 'chat.html')

@app.route('/rooms.html')
def rooms_page():
    return send_from_directory('.', 'rooms.html')

@app.route('/api/rooms', methods=['GET'])
def list_rooms():
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT id, name, host, players, max_players, status, created_at FROM rooms ORDER BY created_at DESC')
    rooms = [dict(r) for r in c.fetchall()]
    conn.close()
    return jsonify({'rooms': rooms})

@app.route('/api/rooms', methods=['POST'])
def create_room():
    data = request.get_json() or {}
    uid = session.get('user_id') or data.get('id') or 'guest'
    user = get_user_or_404(uid)
    if not user:
        return jsonify({'success': False, 'error': 'User not found'}), 404
    name = (data.get('name') or '未命名房間').strip()[:20]
    room_id = f"ROOM_{uid}_{int(datetime.datetime.now().timestamp())}"
    conn = get_db()
    c = conn.cursor()
    c.execute('''INSERT INTO rooms (id, name, host, players, max_players, status, created_at)
                 VALUES (?,?,?,?,?,?,?)''',
              (room_id, name, uid, 1, 8, 'waiting', now_iso()))
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'room_id': room_id, 'name': name})

@app.route('/api/rooms/<room_id>/join', methods=['POST'])
def join_room_api(room_id):
    data = request.get_json() or {}
    uid = session.get('user_id') or data.get('id') or 'guest'
    user = get_user_or_404(uid)
    if not user:
        return jsonify({'success': False, 'error': 'User not found'}), 404
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT * FROM rooms WHERE id=?', (room_id,))
    room = c.fetchone()
    if not room:
        conn.close()
        return jsonify({'success': False, 'error': '房間不存在'}), 404
    if room['players'] >= room['max_players']:
        conn.close()
        return jsonify({'success': False, 'error': '房間已滿'}), 400
    c.execute('UPDATE rooms SET players = players + 1 WHERE id=?', (room_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'room_id': room_id})

@app.route('/api/chat', methods=['GET'])
def get_chat():
    room = request.args.get('room', 'lobby')
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT user_id, message, created_at FROM chat WHERE room=? ORDER BY created_at ASC LIMIT 50', (room,))
    messages = [dict(r) for r in c.fetchall()]
    conn.close()
    return jsonify({'messages': messages})

@app.route('/api/chat', methods=['POST'])
def post_chat():
    data = request.get_json() or {}
    uid = session.get('user_id') or data.get('id') or 'guest'
    user = get_user_or_404(uid)
    if not user:
        # Allow guest chat with guest name
        uid = 'guest'
        user_name = '訪客'
    else:
        user_name = user.get('name') or uid
    room = data.get('room') or 'lobby'
    message = (data.get('message') or '').strip()[:200]
    if not message:
        return jsonify({'success': False, 'error': '訊息不能為空'}), 400
    conn = get_db()
    c = conn.cursor()
    c.execute('INSERT INTO chat (room, user_id, message, created_at) VALUES (?,?,?,?)',
              (room, user_name, message, now_iso()))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/leaderboard', methods=['GET'])
def leaderboard():
    conn = get_db()
    c = conn.cursor()
    c.execute('''SELECT id, name, balance, coins, ai_revives, avatar, role,
                 (SELECT COUNT(*) FROM transactions WHERE user_id=users.id AND type IN ('game_win','game_lose')) AS games,
                 (SELECT SUM(amount) FROM transactions WHERE user_id=users.id AND type='game_win') AS total_win
                 FROM users WHERE banned=0 ORDER BY balance DESC LIMIT 50''')
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    return jsonify({'leaderboard': rows})

# ===================== Serve =====================
@app.route('/data/users.json')
def serve_users():
    return send_from_directory(DATA_DIR, 'users.json')

@app.route('/data/<path:filename>')
def serve_data(filename):
    return send_from_directory(DATA_DIR, filename)

if __name__ == '__main__':
    print('伺服器啟動: http://localhost:8899')
    app.run(host='0.0.0.0', port=8899, debug=False)
