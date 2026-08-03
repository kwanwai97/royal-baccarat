(function(){
  var pc=document.getElementById('playerCards');
  var bc=document.getElementById('bankerCards');
  pc.innerHTML=''; bc.innerHTML='';
  var mk=function(r,s){return {rank:r,suit:s,value:(r==='A'?1:(parseInt(r,10)||0))};};
  var p=[mk('K','♠'),mk('Q','♥'),mk('4','♦')];
  var b=[mk('9','♦'),mk('8','♣')];
  p.forEach(function(c){var el=window.cardEl(c);pc.appendChild(el);});
  b.forEach(function(c){var el=window.cardEl(c);bc.appendChild(el);});
  function reveal(){
    [].concat([].slice.call(pc.children),[].slice.call(bc.children)).forEach(function(el){
      el.classList.add('show','show-num');
      var cf=el.querySelector('.cf'); if(cf) cf.classList.add('flip');
      var back=el.querySelector('.back'); if(back) back.style.animation='none';
    });
  }
  setTimeout(function(){ reveal(); setTimeout(function(){
    window.positionDealzone();
    var big=document.getElementById('bigCanvas').getBoundingClientRect();
    var dz=document.getElementById('dealzoneOverlay').getBoundingClientRect();
    var panel=document.querySelector('.roadpanel').getBoundingClientRect();
    function rectOf(el){ if(!el) return null; var r=el.getBoundingClientRect(); return {top:Math.round(r.top), bottom:Math.round(r.bottom), left:Math.round(r.left), right:Math.round(r.right), h:Math.round(r.height)}; }
    var p1=pc.children[0], p2=pc.children[1], p3=pc.children[2];
    window.__vert={
      bigBottom: Math.round(big.bottom),
      panelBottom: Math.round(panel.bottom),
      dzShift: dz.dataset.dzShift,
      playerCard1: rectOf(p1),
      playerCard2: rectOf(p2),
      playerCard3: rectOf(p3),
      bankerCard1: rectOf(bc.children[0])
    };
  }, 400); }, 1200);
})();
