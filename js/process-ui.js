/* SGUNMS lightweight process UI
   Important: normal Supabase/background fetches do NOT show a full-screen loader.
   Loaders are shown only for explicit user actions or when code calls SagunProcess.loading().
*/
(function(){
  if(window.SagunProcess) return;

  let overlay=null, textEl=null, subEl=null, progress=null, timer=null;

  function ensure(){
    if(overlay) return;
    overlay=document.createElement('div');
    overlay.id='sagunProcessOverlay';
    overlay.innerHTML='<div class="sagun-process-box" role="status" aria-live="polite">'
      +'<div class="sagun-orbit"><span></span><span></span><span></span></div>'
      +'<div class="sagun-process-text">Please wait...</div>'
      +'<div class="sagun-process-sub">काम हो रहा है…</div>'
      +'<div class="sagun-mini-dots"><i></i><i></i><i></i></div>'
      +'</div>';
    document.body.appendChild(overlay);
    progress=document.createElement('div');
    progress.id='sagunProgressBar';
    document.body.appendChild(progress);
    textEl=overlay.querySelector('.sagun-process-text');
    subEl=overlay.querySelector('.sagun-process-sub');
  }

  function startBar(){
    if(!progress) return;
    progress.style.opacity='1';
    progress.style.width='12%';
    setTimeout(()=>{ if(progress?.style.opacity==='1') progress.style.width='48%'; },120);
    setTimeout(()=>{ if(progress?.style.opacity==='1') progress.style.width='76%'; },500);
  }

  function hide(){
    clearTimeout(timer);
    if(!overlay) return;
    overlay.classList.remove('active');
    if(progress){
      progress.style.width='100%';
      setTimeout(()=>{
        if(progress){ progress.style.opacity='0'; progress.style.width='0'; }
      },280);
    }
  }

  function show(message='Please wait...', sub='काम हो रहा है…', autoHide=false){
    ensure();
    textEl.textContent=message;
    subEl.textContent=sub;
    overlay.classList.add('active');
    startBar();
    clearTimeout(timer);
    // Safety timeout only. Real operations should call hide() when finished.
    if(autoHide) timer=setTimeout(hide,8000);
  }

  function labelFor(el){
    const t=((el?.innerText||el?.value||el?.getAttribute?.('aria-label')||'')+'').trim().toLowerCase();
    if(/delete|remove|erase|account/.test(t)) return ['Deleting…','डेटा हटाया जा रहा है'];
    if(/export|download|pdf|excel|report/.test(t)) return ['Preparing…','रिपोर्ट तैयार हो रही है'];
    if(/upload|photo|image|file/.test(t)) return ['Uploading…','फाइल तैयार हो रही है'];
    if(/sync|backup|restore/.test(t)) return ['Syncing…','डेटा sync हो रहा है'];
    if(/login|sign in/.test(t)) return ['Signing in…','कृपया प्रतीक्षा करें'];
    if(/register|create account|creating/.test(t)) return ['Creating account…','खाता बनाया जा रहा है'];
    if(/save|submit|add|update|confirm|verify|send|resend/.test(t)) return ['Processing…','आपका काम process हो रहा है'];
    return ['Please wait…','काम हो रहा है'];
  }

  function buttonBusy(el){
    if(!el || el.classList.contains('sagun-btn-processing')) return;
    el.classList.add('sagun-btn-processing');
    el.setAttribute('aria-busy','true');
    el.dataset.sagunOldDisabled=el.disabled?'1':'0';
    if('disabled' in el) el.disabled=true;
    // Do not leave buttons disabled forever if a page forgets to hide the loader.
    setTimeout(()=>{
      if(document.body.contains(el)){
        el.classList.remove('sagun-btn-processing');
        el.removeAttribute('aria-busy');
        if('disabled' in el) el.disabled=el.dataset.sagunOldDisabled==='1';
      }
    },10000);
  }

  window.SagunProcess={
    show, hide,
    loading:()=>show('Loading…','डेटा लोड हो रहा है…',false),
    saving:()=>show('Saving…','डेटा save हो रहा है…',false),
    processing:()=>show('Processing…','काम process हो रहा है…',false),
    syncing:()=>show('Syncing…','डेटा sync हो रहा है…',false)
  };

  // Explicit user actions only. Background Supabase reads/writes are intentionally silent.
  document.addEventListener('click',e=>{
    const el=e.target.closest?.('button,input[type=submit],input[type=button],a');
    if(!el || el.disabled || el.closest('[data-no-process-animation]')) return;

    // Opening a confirmation modal is NOT the deletion itself.
    const id=(el.id||'').toLowerCase();
    if(['deletebtn','opendeletemodal','showdeletemodal','deleteeventbtn'].includes(id)) return;

    const t=((el.innerText||el.value||el.getAttribute('aria-label')||'')+'').toLowerCase();
    if(!/save|submit|add|update|delete|remove|erase|export|download|pdf|excel|report|upload|sync|backup|restore|login|sign in|register|create account|verify|send|resend|confirm|continue|next|logout/.test(t)) return;
    if(el.tagName==='A' && /^(#|javascript:)/.test(el.getAttribute('href')||'')) return;

    const [a,b]=labelFor(el);
    buttonBusy(el);
    show(a,b,true);
  },true);

  document.addEventListener('submit',e=>{
    if(e.target.closest('[data-no-process-animation]')) return;
    const submit=e.target.querySelector('button[type=submit],input[type=submit]');
    const [a,b]=labelFor(submit||e.target);
    if(submit) buttonBusy(submit);
    show(a,b,true);
  },true);

  // Image placeholders remain useful without blocking the page.
  function watchImage(img){
    if(!img || img.dataset.sagunLoadingWatched) return;
    img.dataset.sagunLoadingWatched='1';
    if(img.complete && img.naturalWidth>0) return;
    img.classList.add('sagun-image-loading');
    const done=()=>{
      img.classList.remove('sagun-image-loading');
      img.classList.add('sagun-image-loaded');
      img.removeEventListener('load',done);
      img.removeEventListener('error',done);
    };
    img.addEventListener('load',done);
    img.addEventListener('error',done);
  }

  document.querySelectorAll('img').forEach(watchImage);
  new MutationObserver(m=>m.forEach(x=>x.addedNodes?.forEach(n=>{
    if(n.nodeType!==1)return;
    if(n.matches?.('img')) watchImage(n);
    n.querySelectorAll?.('img').forEach(watchImage);
  }))).observe(document.documentElement,{childList:true,subtree:true});

  // Deliberately no automatic initial-page overlay and no fetch interception.
  // This keeps cached/offline-first pages instant and prevents loaders on every Supabase request.
})();
