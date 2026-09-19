(function(){
  // Tool pages are embedded inside the Entry popup: no navigation/menu inside the popup.
  if(new URLSearchParams(location.search).get('popup')==='1'){
    document.documentElement.classList.add('sagun-popup-page');
    return;
  }
  if(document.getElementById('sagunTopbar')) return;
  const file=(location.pathname.split('/').pop()||'home.html').toLowerCase();
  const titles={
    'home.html':'🏠 Dashboard','family.html':'👨‍👩‍👧 Family','events.html':'🎉 Events','event-select.html':'➕ Add Event',
    'setup.html':'⚙️ Event Setup','event-details.html':'📋 Event Details',
    'tilak-entry.html':'🪔 Tilak Entry','barat-entry.html':'🥁 Barat Entry','reception-entry.html':'🎉 Reception Entry',
    'birthday-entry.html':'🎂 Birthday Entry','anniversary-entry.html':'💐 Anniversary Entry','engagement-entry.html':'💍 Engagement Entry',
    'griha-pravesh-entry.html':'🏠 Griha Pravesh Entry','generic-event-entry.html':'🎊 Event Entry','event-entry.html':'📝 Shagun Entry',
    'shagun.html':'🎁 Shagun','shagun-given.html':'📤 Shagun Diya','cash-counter.html':'💰 Cash Counter','cashbook.html':'📒 Cash Book',
    'report.html':'📊 Reports','reminders.html':'🔔 Reminders','assistant.html':'🤖 AI Assistant','settings.html':'⚙️ Settings',
    'admin.html':'🛡️ Super Admin','admin-dashboard.html':'🛡️ Admin Dashboard','manual.html':'📖 Manual'
  };
  const title=titles[file]||document.title.replace(/\s*\|.*$/,'')||'SGUNMS';
  // Navigation is always visible on every window.
  const shouldAutoHide=false;
  const menu=[
    ['home.html','🏠 Dashboard'],['family.html','👨‍👩‍👧 Family'],['events.html','🎉 Events'],['shagun.html','🎁 Shagun'],
    ['shagun-given.html','📤 Shagun Diya'],['cash-counter.html','💰 Cash Counter'],['cashbook.html','📒 Cash In / Cash Out'],
    ['report.html','📊 Reports'],['reminders.html','🔔 Reminders'],['assistant.html','🤖 AI Assistant'],['settings.html','⚙️ Settings'],['admin.html','🛡️ Super Admin']
  ];
  const bar=document.createElement('nav');bar.id='sagunTopbar';bar.className='sagun-topbar';bar.setAttribute('aria-label','SGUNMS Navigation');
  const menuLinks=menu.map(([href,label])=>`<a href="${href}" class="${file===href?'active':''}">${label}</a>`).join('');
  const showQuickTools=['tilak-entry.html','barat-entry.html','reception-entry.html'].includes(file);
  const quickTools=showQuickTools?`<div class="sagun-quick-tools"><button class="sagun-quick-btn" id="sagunQuickBtn" type="button" aria-expanded="false">⚡ Tools</button><div class="sagun-quick-panel" id="sagunQuickPanel"><div class="sagun-quick-title">Quick Tools</div><button type="button" class="sagun-quick-link" data-tool="cash-counter.html">💰 Cash Counter</button><button type="button" class="sagun-quick-link" data-tool="cashbook.html">💵 Cash In / Out</button><button type="button" class="sagun-quick-link" data-tool="report.html">📊 Report</button><button type="button" id="sagunQuickClose" class="sagun-quick-close">✕ Close</button></div></div>`:'';
  bar.innerHTML=`<div class="sagun-left"><a class="sagun-nav-btn" href="home.html">⌂ Home</a><button class="sagun-nav-btn" id="sagunBack" type="button">← Back</button></div><div class="sagun-center" title="${title}">${title}</div><div class="sagun-right"><a class="sagun-site" href="https://www.sgunms.in" target="_blank" rel="noopener">www.sgunms.in</a>${quickTools}<div class="sagun-tools"><button class="sagun-menu-btn" type="button" aria-expanded="false">☰ Menu</button><div class="sagun-menu-panel" role="menu">${menuLinks}<div class="sagun-menu-sep"></div><button type="button" class="sagun-logout" id="sagunLogout">🚪 Logout</button></div></div></div>`;
  const trigger=document.createElement('div');trigger.className='sagun-topbar-trigger';trigger.setAttribute('aria-hidden','true');
  document.body.prepend(trigger);document.body.prepend(bar);
  const btn=bar.querySelector('.sagun-menu-btn'),panel=bar.querySelector('.sagun-menu-panel');let timer;
  btn.onclick=e=>{e.stopPropagation();const open=panel.classList.toggle('open');btn.setAttribute('aria-expanded',String(open));bar.classList.remove('is-hidden');if(open)clearTimeout(timer);else hideSoon()};
  const quickBtn=bar.querySelector('#sagunQuickBtn'),quickPanel=bar.querySelector('#sagunQuickPanel'),quickClose=bar.querySelector('#sagunQuickClose');
  // Quick tools open inside a compact modal on the same entry window.
  let toolZoom=1;
  function openToolModal(src,label){
    let modal=document.getElementById('sagunToolModal');
    if(!modal){
      modal=document.createElement('div'); modal.id='sagunToolModal'; modal.className='sagun-tool-modal';
      modal.innerHTML='<div class="sagun-tool-dialog" role="dialog" aria-modal="true"><div class="sagun-tool-head"><strong id="sagunToolTitle"></strong><div class="sagun-tool-window-actions"><button type="button" class="sagun-tool-win" id="sagunToolZoomOut" title="Zoom Out">−</button><span id="sagunToolZoomValue">100%</span><button type="button" class="sagun-tool-win" id="sagunToolZoomIn" title="Zoom In">＋</button><button type="button" class="sagun-tool-win" id="sagunToolMax" title="Maximize">□</button><button type="button" class="sagun-tool-x" id="sagunToolX" title="Close">✕</button></div></div><div class="sagun-tool-body"><iframe id="sagunToolFrame" title="Quick Tool"></iframe></div></div>';
      document.body.appendChild(modal);
      modal.addEventListener('click',e=>{if(e.target===modal) closeToolModal()});
      modal.querySelector('#sagunToolX').onclick=closeToolModal;
      const dialog=modal.querySelector('.sagun-tool-dialog'), head=modal.querySelector('.sagun-tool-head');
      modal.querySelector('#sagunToolZoomIn').onclick=()=>setToolZoom(toolZoom+.1);
      modal.querySelector('#sagunToolZoomOut').onclick=()=>setToolZoom(toolZoom-.1);
      modal.querySelector('#sagunToolMax').onclick=()=>{dialog.classList.toggle('maximized'); modal.querySelector('#sagunToolMax').textContent=dialog.classList.contains('maximized')?'❐':'□';};
      let dragging=false,dx=0,dy=0;
      head.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;if(dialog.classList.contains('maximized'))return;dragging=true;const r=dialog.getBoundingClientRect();dx=e.clientX-r.left;dy=e.clientY-r.top;head.setPointerCapture?.(e.pointerId)});
      head.addEventListener('pointermove',e=>{if(!dragging)return;dialog.style.left=Math.max(0,Math.min(window.innerWidth-dialog.offsetWidth,e.clientX-dx))+'px';dialog.style.top=Math.max(0,Math.min(window.innerHeight-dialog.offsetHeight,e.clientY-dy))+'px';dialog.style.margin='0';});
      head.addEventListener('pointerup',()=>dragging=false);head.addEventListener('pointercancel',()=>dragging=false);
      const frame=modal.querySelector('#sagunToolFrame');
      frame.addEventListener('load',()=>applyToolZoom());
    }
    toolZoom=1; const dialog=modal.querySelector('.sagun-tool-dialog');dialog.classList.remove('maximized');dialog.style.left='';dialog.style.top='';dialog.style.margin='';
    modal.querySelector('#sagunToolMax').textContent='□';
    modal.querySelector('#sagunToolTitle').textContent=label;
    modal.querySelector('#sagunToolFrame').src=src + (src.includes('?')?'&':'?') + 'popup=1';
    modal.classList.add('open');
    modal.querySelector('#sagunToolZoomValue').textContent='100%';
    if(quickPanel){quickPanel.classList.remove('open');quickBtn.setAttribute('aria-expanded','false')}
  }
  function applyToolZoom(){
    const frame=document.getElementById('sagunToolFrame'); if(!frame)return;
    try{const d=frame.contentDocument; if(d&&d.documentElement){d.documentElement.style.zoom=toolZoom; d.body.style.minWidth='0';}}catch(e){}
  }
  function setToolZoom(z){toolZoom=Math.max(.7,Math.min(1.5,Math.round(z*10)/10));document.getElementById('sagunToolZoomValue').textContent=Math.round(toolZoom*100)+'%';applyToolZoom();}
  function closeToolModal(){const m=document.getElementById('sagunToolModal');if(m){m.classList.remove('open');const f=m.querySelector('iframe');if(f)f.src='about:blank'}}
  if(quickBtn&&quickPanel){
    quickBtn.onclick=e=>{e.stopPropagation();const open=quickPanel.classList.toggle('open');quickBtn.setAttribute('aria-expanded',String(open));panel.classList.remove('open');btn.setAttribute('aria-expanded','false')};
    quickClose.onclick=()=>{quickPanel.classList.remove('open');quickBtn.setAttribute('aria-expanded','false')};
    bar.querySelectorAll('.sagun-quick-link').forEach(b=>b.onclick=()=>openToolModal(b.dataset.tool,b.textContent.trim()));
  }
  document.addEventListener('click',e=>{if(!bar.contains(e.target)){panel.classList.remove('open');btn.setAttribute('aria-expanded','false');if(quickPanel){quickPanel.classList.remove('open');quickBtn.setAttribute('aria-expanded','false')}}});
  bar.querySelector('#sagunBack').onclick=()=>{if(document.referrer&&new URL(document.referrer).origin===location.origin&&history.length>1)history.back();else location.href='home.html'};
  async function logout(){try{if(window.sb&&window.sb.auth)await window.sb.auth.signOut();}catch(e){}try{localStorage.removeItem('currentEventType');localStorage.removeItem('selectedEventType');localStorage.removeItem('pendingEventType');}catch(e){}location.href='login.html'}
  bar.querySelector('#sagunLogout').onclick=logout;
  // Keep navigation permanently visible. No auto-hide timers or triggers.
  clearTimeout(timer);
  bar.classList.remove('is-hidden');
  trigger.style.display='none';
})();
