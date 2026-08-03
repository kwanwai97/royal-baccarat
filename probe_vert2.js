function mk(r,s){return {rank:r,suit:s,value:(r==='A'?1:(parseInt(r,10)||0))};}
var pc=document.getElementById('playerCards');
var bc=document.getElementById('bankerCards');
pc.innerHTML=''; bc.innerHTML='';
var p=[mk('K','♠'),mk('Q','♥'),mk('4','♦')];
var b=[mk('9','♦'),mk('8','♣')];
p.forEach(function(c){var el=window.cardEl(c);pc.appendChild(el);el.classList.add('show','show-num');var cf=el.querySelector('.cf');if(cf)cf.classList.add('flip');var back=el.querySelector('.back');if(back)back.style.animation='none';});
b.forEach(function(c){var el=window.cardEl(c);bc.appendChild(el);el.classList.add('show','show-num');var cf=el.querySelector('.cf');if(cf)cf.classList.add('flip');var back=el.querySelector('.back');if(back)back.style.animation='none';});
window.positionDealzone();
function rectOf(el){var r=el.getBoundingClientRect();return {top:Math.round(r.top),bottom:Math.round(r.bottom),h:Math.round(r.height)};}
var big=document.getElementById('bigCanvas').getBoundingClientRect();
var panel=document.querySelector('.roadpanel').getBoundingClientRect();
window.__vert={
  bigBottom:Math.round(big.bottom),
  panelBottom:Math.round(panel.bottom),
  dzShift:document.getElementById('dealzoneOverlay').dataset.dzShift,
  p1:rectOf(pc.children[0]),
  p2:rectOf(pc.children[1]),
  p3:rectOf(pc.children[2]),
  b1:rectOf(bc.children[0])
};
