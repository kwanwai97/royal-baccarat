
var bets={player:0,banker:0,tie:0};
var balance=100000;
var currentChip=1000;
var followPredictOn=true;
var history=[]; for(var i=0;i<10;i++) history.push(i%3===0?"B":i%3===1?"P":"T");
var settleMsg=function(){};
function clearBets(force){ bets={player:0,banker:0,tie:0}; }
function updateBalance(){}
function updateBetDisplay(){ console.log("bets after:", JSON.stringify(bets), "balance:", balance); }
function updateAiBalances(){}
function sndChip(){}
function showToast(m){ console.log("TOAST:", m); }
var deriveRoad=function(o){return [];};
var roadState=function(){return {streakType:"B",streakLen:4,last:"B"};};
var threeBead=function(){return {bRatio:0.6,bCols:3,pCols:1,totalCols:4};};

function predictScore(){
  // 返回 {banker, player, tie, conf, side, reason} —— conf=置信度0~1, side=建議邊
  const h = history;
  if(!h || h.length < 2) return {banker:45, player:44, tie:9, conf:0, side:'', reason:'新靴起局'};
  // 因子A：近期趨勢（近8局非和局邊）
  const recent = h.slice(-8).filter(x=>x!=='T');
  let p=0,b=0; recent.forEach(x=>{ if(x==='P')p++; else if(x==='B')b++; });
  const trendBias = b>p? 'B' : p>b? 'P' : '';
  const trendConf = Math.abs(b-p)/Math.max(1,b+p);
  // 因子B：連龍檢測（大路最尾同向手數）
  let streak=0, st=null;
  for(let i=h.length-1;i>=0;i--){
    const w=h[i];
    if(w==='T'){ if(streak===0) continue; else break; }
    if(st===null){ st=w; streak=1; }
    else if(w===st) streak++;
    else break;
  }
  // 因子C：下三路紅藍偏離（破碎=反手訊號）
  let red=0, blue=0;
  for(const off of [1,2,3]){ const d=deriveRoad(off); for(const n of d){ if(n.blue) blue++; else red++; } }
  const total=red+blue; const blueRatio = total>0 ? blue/total : 0.5;
  // 因子D：鋸齒/單跳（交替=反手有效）
  let jump=0;
  for(let i=h.length-1;i>=1;i--){ if(h[i]!=='T'&&h[i-1]!=='T'&&h[i]!==h[i-1]) jump++; else break; }
  // 綜合評分（娛樂向：放大信號令體驗似專家，但長遠仍~50%）
  let sB=45, sP=44, sT=9;
  if(trendBias==='B'){ sB += trendConf*12; sP -= trendConf*12; }
  else if(trendBias==='P'){ sP += trendConf*12; sB -= trendConf*12; }
  if(streak>=3){ const hot = st==='B'?'B':'P'; if(hot==='B'){ sB+=8; sP-=8; } else { sP+=8; sB-=8; } }
  if(blueRatio>0.62){ // 路破碎：輕微反手
    if(trendBias==='B'){ sP+=6; sB-=6; } else if(trendBias==='P'){ sB+=6; sP-=6; }
  }
  if(jump>=3){ // 單跳：反手
    const last = h[h.length-1];
    if(last==='B'){ sP+=5; } else if(last==='P'){ sB+=5; }
  }
  // 因子E：三珠路統計（每3局一列，莊/閒組合形態偏向）
  const tb=threeBead();
  if(tb && tb.totalCols>0){
    const colBias = tb.bCols - tb.pCols;
    if(colBias>0){ sB += Math.min(7, colBias); sP -= Math.min(7, colBias); }
    else if(colBias<0){ sP += Math.min(7, -colBias); sB -= Math.min(7, -colBias); }
    if(tb.bRatio>0.58){ sB += 4; sP -= 4; }
    else if(tb.bRatio<0.42){ sP += 4; sB -= 4; }
  }
  // 正規化
  const sum=sB+sP+sT; sB=Math.round(sB/sum*100); sP=Math.round(sP/sum*100); sT=100-sB-sP;
  let side='', conf=0, reason='';
  if(sB>sP+4){ side='B'; conf=(sB-50)/50; reason='莊線偏強'; }
  else if(sP>sB+4){ side='P'; conf=(sP-50)/50; reason='閒線偏強'; }
  else { side=''; conf=0; reason='路勢拉鋸，觀望'; }
  return {banker:sB, player:sP, tie:sT, conf:Math.min(0.85,conf), side, reason};
}
function autoFollowPredict(){
  const pr=predictScore();
  if(!pr.side){ return; }  // 觀望唔跟（正常）
  const amt = currentChip>0 ? currentChip : 1000;
  const betAmt = Math.min(amt, balance);
  if(betAmt<=0) return;
  clearBets(true);
  if(pr.side==='B') bets.banker=betAmt; else if(pr.side==='P') bets.player=betAmt;
  balance-=betAmt; updateBalance(); updateBetDisplay(); sndChip();
  showToast('🔮 跟預測：自動落注'+(pr.side==='B'?'莊':'閒')+' '+fmt(betAmt));
}
autoFollowPredict();
