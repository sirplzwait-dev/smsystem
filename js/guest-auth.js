/* SGUNMS Guest Device Identity + 30-day retention.
   Browsers do NOT expose the computer's MAC address to websites.
   We therefore use a stable local device/browser ID plus a best-effort fingerprint.
*/
(function(){
  const SESSION_KEY='sagunGuestSession';
  const DEVICE_KEY='sgunmsGuestDeviceId';
  const DATA_KEYS=['eventSetupData','sagunSetup','offlineSetupData','birthdaySetup','birthdayPhoto','birthdayPhotoPending','birthdayGuests','offlineGuests','eventEntries','sagunEntries','cashHistory','sagunEventHistory'];
  const RETENTION_DAYS=30;
  const WARNING_DAYS=3;

  function read(){ try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch(e){return null} }
  function deviceId(){
    let id=localStorage.getItem(DEVICE_KEY);
    if(!id){
      const seed=[navigator.userAgent,navigator.language,screen.width+'x'+screen.height,screen.colorDepth,navigator.platform,navigator.hardwareConcurrency||'',Intl.DateTimeFormat().resolvedOptions().timeZone||''].join('|');
      let hash=2166136261;
      for(let i=0;i<seed.length;i++){ hash^=seed.charCodeAt(i); hash=Math.imul(hash,16777619); }
      id='dev_'+(hash>>>0).toString(36)+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8);
      localStorage.setItem(DEVICE_KEY,id);
    }
    return id;
  }
  function valid(){ const s=read(); return !!(s && s.deviceId===deviceId() && s.expiresAt && Date.now()<Number(s.expiresAt)); }
  function daysLeft(){ const s=read(); if(!s || s.deviceId!==deviceId()) return 0; return Math.max(0,Math.ceil((Number(s.expiresAt)-Date.now())/86400000)); }
  function purgeExpired(){
    const s=read();
    if(s && s.expiresAt && Date.now()>=Number(s.expiresAt)){
      DATA_KEYS.forEach(k=>localStorage.removeItem(k));
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem('sagunUserMode');
      return true;
    }
    return false;
  }
  function startGuest(){
    // Guest mode is disabled in production; authentication is required.
    location.href='../html/login.html'; return;
    /*
    purgeExpired();
    let s=read();
    if(!s || !s.expiresAt || Date.now()>=Number(s.expiresAt) || s.deviceId!==deviceId()){
      const now=Date.now();
      s={mode:'guest',guestId:'guest_'+now+'_'+Math.random().toString(36).slice(2,8),deviceId:deviceId(),createdAt:now,expiresAt:now+RETENTION_DAYS*86400000};
      localStorage.setItem(SESSION_KEY,JSON.stringify(s));
    }
    localStorage.setItem('sagunUserMode','guest');
    location.href='../html/home.html';
  }
    */
  function isGuest(){ return false; }
  function logoutGuest(){
    localStorage.removeItem('sagunUserMode');
    localStorage.removeItem('sagunActiveUserId');
    sessionStorage.clear();
    location.href='../html/login.html';
  }
  function clearForRegisteredLogout(){ localStorage.clear(); sessionStorage.clear(); location.href='../html/login.html'; }
  function warningMessage(){
    const d=daysLeft();
    if(!d) return '';
    if(d<=WARNING_DAYS) return `⚠️ Guest data warning: आपका Guest data ${d} दिन में हट जाएगा। Data बचाने के लिए अभी Register/Login करें।`;
    return `👤 Guest Mode: आपका data ${d} दिन तक सुरक्षित है। Register/Login करने पर इसे स्थायी account में रखने की सुविधा मिलेगी।`;
  }
  function showWarning(){ return; }
  window.SagunGuest={start:startGuest,isGuest,isValid:valid,daysLeft,logout:logoutGuest,clearRegistered:clearForRegisteredLogout,purgeExpired,deviceId,showWarning,retentionDays:RETENTION_DAYS};
  purgeExpired();
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',showWarning); else showWarning();
})();
