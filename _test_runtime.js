const fs=require('fs');
const html=fs.readFileSync('index.html','utf-8');
const s=html.match(/<script>([\s\S]*?)<\/script>/g).pop().replace(/<\/?script>/g,'');
const stub='function fmt(n){return n;} function sleep(){} function speak(){} function showToast(){} function updateAiBalances(){} function setAiSel(){} function randomizeNewAi(){} function deriveRoad(o){return [{blue:false},{blue:true}];}';
try{
  eval('(function(){'+stub+s+'; history=["B","B","P","B","B","P","P","B"]; const pr=predictScore(); console.log("predictScore OK:", JSON.stringify(pr)); updatePredict(); console.log("updatePredict OK (no crash)"); })()');
}catch(e){ console.log('RUNTIME ERROR:', e.message); }
