(function(){
  var bc = document.getElementById('betCountdown');
  var rb = document.querySelector('.road-big').getBoundingClientRect();
  var bcr = bc.getBoundingClientRect();
  window.betCdProbe = {
    hasElement: !!bc,
    textBefore: bc.textContent,
    displayBefore: getComputedStyle(bc).display,
    roadBigRect: {top:Math.round(rb.top), height:Math.round(rb.height), bottom:Math.round(rb.bottom)},
    bcRect: {top:Math.round(bcr.top), left:Math.round(bcr.left), width:Math.round(bcr.width), bottom:Math.round(bcr.bottom)},
    bcRelToRoadBig_top: Math.round(bcr.top - rb.top),
    bcRelToRoadBig_bottom: Math.round(rb.bottom - bcr.bottom)
  };
  // 模擬顯示一下睇文字
  bc.textContent = '🎙 請下注，剩 7 秒（AI 已落注，可跟注）';
  bc.classList.add('show');
  var bcr2 = bc.getBoundingClientRect();
  window.betCdProbe.afterShow = {
    display: getComputedStyle(bc).display,
    top: Math.round(bcr2.top),
    left: Math.round(bcr2.left),
    width: Math.round(bcr2.width),
    relToRoadBigBottom: Math.round(rb.bottom - bcr2.bottom)
  };
})();
