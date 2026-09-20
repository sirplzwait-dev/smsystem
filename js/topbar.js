
/* SGUNMS_PROFILE_LOCAL_FIRST_FINAL
   Topbar identity is painted from local cache immediately.
   Supabase is only a background refresh and never blocks the UI.
*/
(function(){
  const KEY='sgunms_profile_v2';
  const OLD='sgunms_profile_v1';

  function read(){
    try{
      const a=JSON.parse(localStorage.getItem(KEY)||'null');
      if(a && (a.name || a.email || a.photo)) return a;
    }catch(e){}
    try{
      const a=JSON.parse(localStorage.getItem(OLD)||'null');
      if(a && (a.name || a.email || a.photo)){
        localStorage.setItem(KEY,JSON.stringify(a));
        return a;
      }
    }catch(e){}
    return {};
  }

  function guest(){
    return localStorage.getItem('guestMode')==='true' ||
           localStorage.getItem('guestAuth')==='true';
  }

  function paint(p){
    const name=String(p.name||'').trim() || (guest()?'Guest':'User');
    const photo=String(p.photo||p.avatar_url||'').trim();

    ['#sagunProfileName','#sagunProfilePanelName','#headerUserName','#userName']
      .forEach(sel=>{
        const el=document.querySelector(sel);
        if(el) el.textContent=name;
      });

    document.querySelectorAll('#sagunAvatar,#sagunAvatarBig').forEach(el=>{
      if(photo){
        el.innerHTML='<img src="'+photo.replace(/"/g,'')+'" alt="" referrerpolicy="no-referrer">';
      }else{
        el.textContent=(name[0]||'U').toUpperCase();
      }
    });
  }

  function save(p){
    try{
      localStorage.setItem(KEY,JSON.stringify({
        name:String(p.name||'').trim(),
        email:String(p.email||'').trim(),
        photo:String(p.photo||'').trim(),
        updatedAt:Date.now()
      }));
    }catch(e){}
  }

  // IMPORTANT: first paint is local only.
  paint(read());

  // Refresh after the page is already usable.
  setTimeout(async()=>{
    try{
      const client=window.sb || window.supabaseClient;
      if(!client?.auth?.getUser) return;

      const r=await client.auth.getUser();
      const u=r?.data?.user;
      if(!u) return;

      const m=u.user_metadata||{};
      let name=String(m.full_name||m.name||m.display_name||'').trim();
      let photo=String(m.avatar_url||m.picture||m.photo_url||'').trim();

      // Only if metadata has no name, try profile table in background.
      if(!name && client.from){
        try{
          let q=await client.from('profiles').select('name,avatar_url,photo_url').eq('id',u.id).maybeSingle();
          if(!q.data) q=await client.from('profiles').select('name,avatar_url,photo_url').eq('user_id',u.id).maybeSingle();
          if(q.data?.name) name=String(q.data.name).trim();
          if(!photo) photo=String(q.data?.avatar_url||q.data?.photo_url||'').trim();
        }catch(e){}
      }

      const old=read();
      const fresh={
        name:name || old.name || (guest()?'Guest':'User'),
        email:u.email||old.email||'',
        photo:photo || old.photo || ''
      };
      save(fresh);
      paint(fresh);
    }catch(e){}
  },120);
})();

(function(){
  // Load the global beautiful loading UI on every page that uses the topbar.
  (function loadSagunLoadingUI(){
    try{
      if(!document.querySelector('link[data-sagun-process-css]')){
        const link=document.createElement('link');
        link.rel='stylesheet'; link.href='../css/process-ui.css'; link.dataset.sagunProcessCss='1';
        document.head.appendChild(link);
      }
      if(!document.querySelector('script[data-sagun-process-js]')){
        const script=document.createElement('script');
        script.src='../js/process-ui.js'; script.dataset.sagunProcessJs='1';
        document.head.appendChild(script);
      }
    }catch(e){}
  })();
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
    ['report.html','📊 Reports'],['reminders.html','🔔 Reminders'],['assistant.html','🤖 AI Assistant'],['admin.html','🛡️ Super Admin']
  ];
  const bar=document.createElement('nav');bar.id='sagunTopbar';bar.className='sagun-topbar';bar.setAttribute('aria-label','SGUNMS Navigation');
  const menuLinks=menu.map(([href,label])=>`<a href="${href}" class="${file===href?'active':''}">${label}</a>`).join('');
  const entryPages=['tilak-entry.html','barat-entry.html','reception-entry.html','birthday-entry.html','anniversary-entry.html','engagement-entry.html','griha-pravesh-entry.html','generic-event-entry.html','event-entry.html'];
  const showQuickTools=entryPages.includes(file);
  const quickTools=showQuickTools?`<div class="sagun-quick-tools"><button class="sagun-quick-btn" id="sagunQuickBtn" type="button" aria-expanded="false">⚡ Tools</button><div class="sagun-quick-panel" id="sagunQuickPanel"><div class="sagun-quick-title">Quick Tools</div><button type="button" class="sagun-quick-link" data-tool="cash-counter.html">💰 Cash Counter</button><button type="button" class="sagun-quick-link" data-tool="cashbook.html">💵 Cash In / Out</button><button type="button" class="sagun-quick-link" data-tool="report.html">📊 Report</button><button type="button" id="sagunQuickClose" class="sagun-quick-close">✕ Close</button></div></div>`:'';
  bar.innerHTML=`<div class="sagun-left"><a class="sagun-nav-btn" href="home.html">⌂ Home</a><button class="sagun-nav-btn" id="sagunBack" type="button">← Back</button></div><div class="sagun-center" title="${title}">${title}</div><div class="sagun-right">${quickTools}<div class="sagun-profile"><button type="button" class="sagun-profile-btn" id="sagunProfileBtn"><span class="sagun-avatar" id="sagunAvatar">U</span><span class="sagun-profile-name" id="sagunProfileName">User</span><span>▾</span></button><div class="sagun-profile-panel" id="sagunProfilePanel"><div class="sagun-profile-head"><span class="sagun-avatar big" id="sagunAvatarBig">U</span><div><strong id="sagunProfilePanelName">User</strong><small id="sagunProfileEmail"></small></div></div><button type="button" data-profile-action="edit">✏️ Profile Edit</button><button type="button" data-profile-action="account">⚙️ Account & Security</button><button type="button" data-profile-action="delete" class="danger">🗑️ Delete Account</button><button type="button" data-profile-action="logout">🚪 Logout</button></div></div></div>`;
  const trigger=document.createElement('div');trigger.className='sagun-topbar-trigger';trigger.setAttribute('aria-hidden','true');
  document.body.prepend(trigger);document.body.prepend(bar);
  if(!document.getElementById('sagun-profile-style')){const st=document.createElement('style');st.id='sagun-profile-style';st.textContent=`.sagun-profile{position:relative;margin-left:8px}.sagun-profile-btn{display:flex;align-items:center;gap:6px;border:1px solid rgba(255,255,255,.55);background:rgba(255,255,255,.14);color:#fff;border-radius:22px;padding:4px 9px 4px 5px;font-weight:800;cursor:pointer}.sagun-avatar{width:28px;height:28px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:#fff;color:#7a0025;font-weight:900;overflow:hidden}.sagun-avatar.big{width:46px;height:46px;font-size:18px}.sagun-avatar img{width:100%;height:100%;object-fit:cover}.sagun-profile-name{max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.sagun-profile-panel{display:none;position:absolute;right:0;top:calc(100% + 8px);width:260px;background:#fff;color:#1f2937;border-radius:16px;box-shadow:0 16px 40px rgba(0,0,0,.22);padding:10px;z-index:99999}.sagun-profile-panel.open{display:block}.sagun-profile-head{display:flex;gap:10px;align-items:center;padding:8px;border-bottom:1px solid #e5e7eb;margin-bottom:6px}.sagun-profile-head strong{display:block;font-size:15px}.sagun-profile-head small{display:block;color:#64748b;font-size:11px;max-width:170px;overflow:hidden;text-overflow:ellipsis}.sagun-profile-panel>button{display:block;width:100%;border:0;background:#fff;text-align:left;padding:10px 9px;border-radius:9px;cursor:pointer;font-weight:700}.sagun-profile-panel>button:hover{background:#f3f4f6}.sagun-profile-panel>button.danger{color:#b91c1c}@media(max-width:700px){.sagun-profile-name{display:none}.sagun-profile-panel{right:-4px;width:245px}}`;document.head.appendChild(st)}
  const btn=bar.querySelector('.sagun-menu-btn'),panel=bar.querySelector('.sagun-menu-panel');let timer;
  if(btn && panel) btn.onclick=e=>{e.stopPropagation();const open=panel.classList.toggle('open');btn.setAttribute('aria-expanded',String(open));bar.classList.remove('is-hidden');if(open)clearTimeout(timer);else hideSoon()};
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
  const profileBtn=bar.querySelector('#sagunProfileBtn'), profilePanel=bar.querySelector('#sagunProfilePanel');
  async function profileFallback(user){
    const meta=user?.user_metadata||{};
    let name='';
    // Always prefer the saved Profile Name from Supabase profiles table.
    try{
      if(user?.id){
        const client=window.sb?.from ? window.sb : (window.supabase?.createClient ? window.supabase.createClient('https://rdlliurzgwwfjscgwssa.supabase.co','sb_publishable_HX1QmjO0SPyW3rUoihZkkQ_tRTE1bLc') : null);
        if(client?.from){
          let r=await client.from('profiles').select('name').eq('id',user.id).maybeSingle();
          if(r.data?.name) name=String(r.data.name).trim();
          if(!name){
            r=await client.from('profiles').select('name').eq('user_id',user.id).maybeSingle();
            if(r.data?.name) name=String(r.data.name).trim();
          }
        }
      }
    }catch(e){}
    if(!name) name=String(meta.full_name||meta.name||meta.display_name||'').trim();
    if(!name) name=String(localStorage.getItem('sagunProfileName')||'User').trim()||'User';
    // Never use username or email as the displayed profile name.
    const photo=meta.avatar_url||meta.picture||meta.photo_url||'';
    const avatar=bar.querySelector('#sagunAvatar'), big=bar.querySelector('#sagunAvatarBig');
    [avatar,big].forEach(el=>{if(!el)return;if(photo){el.innerHTML=`<img src="${photo.replace(/\"/g,'')}" alt="" referrerpolicy="no-referrer">`;}else el.textContent=(name.trim()[0]||'U').toUpperCase();});
    bar.querySelector('#sagunProfileName').textContent=name; bar.querySelector('#sagunProfilePanelName').textContent=name; bar.querySelector('#sagunProfileEmail').textContent=user?.email||'';
  }
  async function loadProfile(){
    try{const client=window.sb?.auth?window.sb:(window.supabase?.createClient?window.supabase.createClient('https://rdlliurzgwwfjscgwssa.supabase.co','sb_publishable_HX1QmjO0SPyW3rUoihZkkQ_tRTE1bLc'):null); if(client?.auth){const {data}=await client.auth.getUser(); await profileFallback(data?.user);}}catch(e){console.log('Profile:',e)}
  }
  profileBtn.onclick=e=>{e.stopPropagation();const open=profilePanel.classList.toggle('open');profilePanel.setAttribute('aria-hidden',String(!open));panel.classList.remove('open');btn.setAttribute('aria-expanded','false');if(open)paint(read())};
  profilePanel.querySelectorAll('[data-profile-action]').forEach(b=>b.onclick=async()=>{const a=b.dataset.profileAction;if(a==='edit'||a==='account'||a==='delete'){location.href='settings.html#'+(a==='edit'?'profile':a==='delete'?'delete-account':'data-security');return;} if(a==='logout') await logout();});
  document.addEventListener('click',e=>{if(!bar.contains(e.target)){panel.classList.remove('open');btn.setAttribute('aria-expanded','false');if(quickPanel){quickPanel.classList.remove('open');quickBtn.setAttribute('aria-expanded','false')}profilePanel.classList.remove('open')}});
  bar.querySelector('#sagunBack').onclick=()=>{if(document.referrer&&new URL(document.referrer).origin===location.origin&&history.length>1)history.back();else location.href='home.html'};
  async function logout(){try{if(window.sb&&window.sb.auth)await window.sb.auth.signOut();}catch(e){}try{window.SagunStore?.clearTransient?.();localStorage.removeItem('sagunActiveUserId');localStorage.removeItem('sagunActiveAccountType');localStorage.removeItem('sagunUserMode');localStorage.removeItem('sagunGuestSession');}catch(e){}location.href='login.html'}
  // Keep navigation permanently visible. No auto-hide timers or triggers.
  clearTimeout(timer);
  bar.classList.remove('is-hidden');
  trigger.style.display='none';
})();

