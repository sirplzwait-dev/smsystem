/* SGUNMS: keep the active entry field visible above mobile keyboard. */
(function(){
  'use strict';
  function isEditable(el){
    return el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) && !el.disabled && !el.readOnly && el.type!=='date';
  }
  function reveal(el){
    if(!isEditable(el) || window.innerWidth>768) return;
    setTimeout(function(){
      try{el.scrollIntoView({behavior:'smooth',block:'center',inline:'nearest'});}catch(_){el.scrollIntoView(false)}
    },180);
    setTimeout(function(){
      try{el.scrollIntoView({behavior:'smooth',block:'center',inline:'nearest'});}catch(_){ }
    },500);
  }
  document.addEventListener('focusin',function(e){reveal(e.target)},true);
  if(window.visualViewport){
    let last=window.visualViewport.height;
    window.visualViewport.addEventListener('resize',function(){
      const now=window.visualViewport.height;
      if(now<last-80){
        const el=document.activeElement;
        setTimeout(function(){reveal(el)},80);
      }
      last=now;
    });
  }
})();
