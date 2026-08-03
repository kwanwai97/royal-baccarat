function mk(r,s){return {rank:r,suit:s,value:(r==='A'?1:(parseInt(r,10)||0))};}
var pc=document.getElementById('playerCards');
var bc=document.getElementById('bankerCards');
pc.innerHTML=''; bc.innerHTML='';
var p=[mk('K','♠'),mk('Q','♥'),mk('4','♦')];
var b=[mk('9','♦'),mk('8','♣')];
p.forEach(function(c){var el=window.cardEl(c);pc.appendChild(el);el.classList.add('show','show-num');var cf=el.querySelector('.cf');if(cf)cf.classList.add('flip');var back=el.querySelector('.back');if(back)back.style.animation='none';});
b.forEach(function(c){var el=window.cardEl(c);bc.appendChild(el);el.classList.add('show','show-num');var cf=el.querySelector('.cf');if(cf)cf.classList.add('flip');var back=el.querySelector('.back');if(back)back.style.animation='none';});
function rectOf(el){var r=el.getBoundingClientRect();return {top:Math.round(r.top),bottom:Math.round(r.bottom),h:Math.round(r.height),cy:Math.round(r.top+r.height/2)};}
var big=document.getElementById('bigCanvas').getBoundingClientRect();
var panel=document.querySelector('.roadpanel').getBoundingClientRect();
var p1=pc.children[0], p2=pc.children[1], p3=pc.children[2];
// 未移位前嘅中心
window.__before={
  bigBottom:Math.round(big.bottom),
  panelBottom:Math.round(panel.bottom),
  dealzoneTop:Math.round(document.getElementById('dealzoneOverlay').getBoundingClientRect().top),
  p1:rectOf(p1), p2:rectOf(p2), p3:rectOf(p3),
  b1:rectOf(bc.children[0])
};
window.positionDealzone();
window.__after={
  dzShift:document.getElementById('dealzoneOverlay').dataset.dzShift,
  p1:rectOf(p1), p2:rectOf(p2), p3:rectOf(p3), b1:rectOf(bc.children[0])
};
