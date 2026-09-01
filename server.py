#!/usr/bin/env python3
# royal-baccarat 後台伺服器 (localhost:5000)
from flask import Flask, request, jsonify, send_from_directory
import json, os
from werkzeug.middleware.proxy_fix import ProxyFix

app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app)

# 資料目錄
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
USERS_FILE = os.path.join(DATA_DIR, 'users.json')

# 確保資料目錄存在
os.makedirs(DATA_DIR, exist_ok=True)

# 載入/保存使用者資料
def load_users():
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def save_users(users):
    with open(USERS_FILE, 'w', encoding='utf-8') as f:
        json.dump(users, f, ensure_ascii=False, indent=2)

# 初始化使用者
def init_user(user_id, display_name='玩家'):
    users = load_users()
    if user_id not in users:
        users[user_id] = {
            'id': user_id,
            'name': display_name,
            'balance': 100000,
            'coins': 0,
            'ai_revives': 0,
            'avatar': '👤'
        }
        save_users(users)
    return users[user_id]

# 路由：提供前端檔案
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_file(filename):
    if os.path.exists(filename):
        return send_from_directory('.', filename)
    return '', 404

# 路由：API 介面
@app.route('/api/user', methods=['GET'])
def get_user():
    user_id = request.args.get('id', 'guest')
    users = load_users()
    if user_id in users:
        return jsonify(users[user_id])
    # 新訪客
    user = init_user(user_id)
    return jsonify(user)

@app.route('/api/user', methods=['POST'])
def update_user():
    data = request.get_json()
    user_id = data.get('id', 'guest')
    users = load_users()
    
    # 更新使用者資料
    if user_id not in users:
        users[user_id] = {'id': user_id}
    
    if 'name' in data:
        users[user_id]['name'] = data['name']
    if 'coins' in data:
        users[user_id]['coins'] = data['coins']
    if 'ai_revives' in data:
        users[user_id]['ai_revives'] = data['ai_revives']
    if 'balance' in data:
        users[user_id]['balance'] = data['balance']
    
    save_users(users)
    return jsonify(users[user_id])

@app.route('/api/recharge', methods=['POST'])
def recharge():
    data = request.get_json()
    user_id = data.get('id', 'guest')
    amount = data.get('amount', 0)
    
    users = load_users()
    if user_id in users:
        users[user_id]['coins'] = users[user_id].get('coins', 0) + amount
        save_users(users)
        return jsonify({'success': True, 'coins': users[user_id]['coins']})
    
    return jsonify({'success': False, 'error': 'User not found'}), 404

@app.route('/api/buy-revives', methods=['POST'])
def buy_revives():
    data = request.get_json()
    user_id = data.get('id', 'guest')
    count = data.get('count', 1)
    price = data.get('price', 0)
    
    users = load_users()
    if user_id in users and users[user_id].get('coins', 0) >= price:
        users[user_id]['coins'] -= price
        users[user_id]['ai_revives'] = users[user_id].get('ai_revives', 0) + count
        save_users(users)
        return jsonify({'success': True, 'coins': users[user_id]['coins'], 'revives': users[user_id]['ai_revives']})
    
    return jsonify({'success': False, 'error': 'Not enough coins'}), 400

@app.route('/data/users.json')
def serve_users():
    return send_from_directory(DATA_DIR, 'users.json')

if __name__ == '__main__':
    print('伺服器啟動: http://localhost:5000')
    app.run(host='0.0.0.0', port=5000, debug=False)