/* shop.js - 商店功能（模擬伺服器版充值） */
function initShop(){
  const KEY='bac_player_name';
  // 讀取資源
  function getCoins() { try { return parseInt(localStorage.getItem('bac_coins')||'0') || 0; } catch(e){ return 0; } }
  function getRevives() { try { return parseInt(localStorage.getItem('bac_ai_revives')||'0') || 0; } catch(e){ return 0; } }
  function saveCoins(v){ localStorage.setItem('bac_coins', v); }
  function saveRevives(v){ localStorage.setItem('bac_ai_revives', v); }
  
  // 讀取玩家名稱
  function loadName(){ return localStorage.getItem(KEY) || '玩家'; }
  function renderName(){
    const txt=document.getElementById('playerNameTxt');
    const balName=document.getElementById('balanceName');
    const n=loadName();
    if(txt) txt.textContent = n;
    if(balName) balName.textContent = '👤 ' + n;
  }
  
  // 更新顯示（含資源）
  window.shopUpdateBalance = function(){
    const balName=document.getElementById('balanceName');
    const playerNameTxt=document.getElementById('playerNameTxt');
    if(balName){
      const playerName = (playerNameTxt ? playerNameTxt.textContent : '玩家');
      const coins = getCoins();
      balName.textContent = '👤 ' + playerName + ' 💎' + coins;
    }
  };
  
  // 充值
  window.shopRecharge = function(amount, label){
    const coins = getCoins() + amount;
    saveCoins(coins);
    showToast('💰 充值成功！獲得 ' + amount.toLocaleString() + ' 幣（' + label + '）');
    shopUpdateBalance();
  };
  
  // 購買 AI 復活
  window.shopBuyRevives = function(count, price){
    const coins = getCoins();
    if (coins < price) { showToast('❌ 餘額不足！需要 ' + price + ' 幣'); return false; }
    const revives = getRevives() + count;
    saveCoins(coins - price);
    saveRevives(revives);
    showToast('🤖 購買成功！AI 復活次數 +' + count + ' 次');
    shopUpdateBalance();
    return true;
  };
  
  // 改名彈窗
  window.shopOpenEditName = function(){
    const cur = loadName();
    const box=document.createElement('div');
    box.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:9999;';
    const card=document.createElement('div');
    card.style.cssText='background:#1d1530;border:1px solid #ffd479;border-radius:12px;padding:16px;width:80%;max-width:280px;color:#fff;font-family:inherit;';
    card.innerHTML='<div style="font-size:14px;font-weight:800;margin-bottom:10px;color:#ffd479;">改你嘅名稱</div>';
    const inp=document.createElement('input');
    inp.value=cur==='玩家'?'':cur;
    inp.placeholder='填你嘅名（例如：阿強）';
    inp.maxLength=12;
    inp.style.cssText='width:100%;box-sizing:border-box;padding:8px;border-radius:8px;border:1px solid #555;background:#0f0a1c;color:#fff;font-size:14px;';
    card.appendChild(inp);
    const row=document.createElement('div');
    row.style.cssText='display:flex;gap:8px;margin-top:12px;';
    const ok=document.createElement('button');
    ok.textContent='確定';
    ok.style.cssText='flex:1;padding:8px;border:none;border-radius:8px;background:#3a7c5a;color:#fff;font-size:14px;font-weight:700;cursor:pointer;';
    const cancel=document.createElement('button');
    cancel.textContent='取消';
    cancel.style.cssText='flex:1;padding:8px;border:none;border-radius:8px;background:#444;color:#fff;font-size:14px;cursor:pointer;';
    row.appendChild(ok); row.appendChild(cancel);
    card.appendChild(row);
    box.appendChild(card);
    document.body.appendChild(box);
    setTimeout(()=>inp.focus(),50);
    function close(){ if(box.parentNode) box.parentNode.removeChild(box); }
    ok.addEventListener('click',()=>{
      const v=inp.value.trim();
      if(v){ localStorage.setItem(KEY,v); renderName(); shopUpdateBalance(); showToast('✅ 名稱已改為『'+v+'』'); }
      close();
    });
    cancel.addEventListener('click',close);
    box.addEventListener('click',e=>{ if(e.target===box) close(); });
  };
  
  // 開本人資源彈窗
  window.shopOpenProfile = function(loadNameFn){
    const box=document.createElement('div');
    box.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:9999;';
    const card=document.createElement('div');
    card.style.cssText='background:#1d1530;border:1px solid #ffd479;border-radius:12px;padding:16px;width:85%;max-width:280px;color:#fff;font-family:inherit;';
    card.innerHTML='<div style="font-size:14px;font-weight:800;margin-bottom:10px;color:#ffd479;">個人資源</div>';
    const coins = getCoins();
    const revives = getRevives();
    card.innerHTML += '<div style="margin:8px 0;"><span style="color:#ffd479;">💎 幣數：</span> ' + coins.toLocaleString() + '</div>';
    card.innerHTML += '<div style="margin:8px 0;"><span style="color:#ffd479;">🤖 AI復活次數：</span> ' + revives + '</div>';
    const row=document.createElement('div');
    row.style.cssText='display:flex;gap:8px;margin-top:12px;';
    const nameBtn=document.createElement('button');
    nameBtn.textContent='改名';
    nameBtn.style.cssText='flex:1;padding:8px;border:none;border-radius:8px;background:#7a5cbb;color:#fff;font-size:14px;font-weight:700;cursor:pointer;';
    const shopBtn=document.createElement('button');
    shopBtn.textContent='商店';
    shopBtn.style.cssText='flex:1;padding:8px;border:none;border-radius:8px;background:#5a7cbf;color:#fff;font-size:14px;font-weight:700;cursor:pointer;';
    const closeBtn=document.createElement('button');
    closeBtn.textContent='關閉';
    closeBtn.style.cssText='flex:1;padding:8px;border:none;border-radius:8px;background:#444;color:#fff;font-size:14px;cursor:pointer;';
    row.appendChild(nameBtn); row.appendChild(shopBtn); row.appendChild(closeBtn);
    card.appendChild(row);
    box.appendChild(card);
    function close(){ if(box.parentNode) box.parentNode.removeChild(box); }
    closeBtn.addEventListener('click',close);
    box.addEventListener('click',e=>{ if(e.target===box) close(); });
    nameBtn.addEventListener('click',()=>{ shopOpenEditName(); close(); });
    shopBtn.addEventListener('click',()=>{ shopOpenShop(); close(); });
  };
  
  // 開啟商店（統一使用 window 函數）
  window.shopOpenShop = function(){
    const box=document.createElement('div');
    box.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:9999;';
    const card=document.createElement('div');
    card.style.cssText='background:#1d1530;border:1px solid #ffd479;border-radius:12px;padding:16px;width:90%;max-width:320px;color:#fff;font-family:inherit;';
    card.innerHTML='<div style="font-size:14px;font-weight:800;margin-bottom:10px;color:#ffd479;">🛒 銀行商店</div>';
    card.innerHTML += 
      '<div style="margin:8px 0;padding:8px;background:#0f0a1c;border-radius:6px;">' +
      '<div style="color:#ffd479;font-weight:700;margin-bottom:6px;">充值</div>' +
      '<button data-amount="100" style="width:100%;margin:4px 0;padding:8px;border:none;border-radius:6px;background:#3a7c5a;color:#fff;cursor:pointer;">✅ 充值 100 幣 (模擬)</button>' +
      '<button data-amount="500" style="width:100%;margin:4px 0;padding:8px;border:none;border-radius:6px;background:#3a7c5a;color:#fff;cursor:pointer;">✅ 充值 500 幣 (模擬)</button>' +
      '<button data-amount="1000" style="width:100%;margin:4px 0;padding:8px;border:none;border-radius:6px;background:#3a7c5a;color:#fff;cursor:pointer;">✅ 充值 1000 幣 +500 贈 (模擬)</button>' +
      '</div>' +
      '<div style="margin:8px 0;padding:8px;background:#0f0a1c;border-radius:6px;">' +
      '<div style="color:#ffd479;font-weight:700;margin-bottom:6px;">AI 陪玩復活</div>' +
      '<button data-price="200" data-count="3" style="width:100%;margin:4px 0;padding:8px;border:none;border-radius:6px;background:#9b59b6;color:#fff;cursor:pointer;">🤖 購買 3 次復活 (200 幣)</button>' +
      '</div>';
    const closeBtn=document.createElement('button');
    closeBtn.textContent='關閉';
    closeBtn.style.cssText='margin-top:8px;padding:8px 16px;border:none;border-radius:6px;background:#444;color:#fff;cursor:pointer;';
    card.appendChild(closeBtn);
    box.appendChild(card);
    function close(){ if(box.parentNode) box.parentNode.removeChild(box); }
    // 充值按鈕
    card.querySelectorAll('button[data-amount]').forEach(btn=>{
      btn.addEventListener('click',()=>{ shopRecharge(parseInt(btn.dataset.amount), btn.textContent); });
    });
    // AI復活按鈕
    card.querySelectorAll('button[data-price]').forEach(btn=>{
      btn.addEventListener('click',()=>{ shopBuyRevives(parseInt(btn.dataset.count), parseInt(btn.dataset.price)); });
    });
    closeBtn.addEventListener('click',close);
    box.addEventListener('click',e=>{ if(e.target===box) close(); });
  };
  
  // 初始化：載入資源
  renderName();
  shopUpdateBalance();
}

// 當 DOM 完成後初始化
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', initShop);
}else{
  initShop();
}