/* SGUNMS Guest Mode
   Guest data stays in THIS browser/device for 30 days.
   It is isolated from registered-user data and is restored automatically
   whenever Guest Mode is opened again in the same browser.
*/
(function(){
  const SESSION_KEY='sagunGuestSession';
  const DEVICE_KEY='sgunmsGuestDeviceId';
  const RETENTION_DAYS=30;
  const WARNING_DAYS=3;

  // All application data keys that should belong to Guest Mode.
  // Registered-user auth/session keys are intentionally excluded.
  const DATA_KEYS = [
    'eventSetupData','sagunSetup','offlineSetupData',
    'birthdaySetup','birthdayPhoto','birthdayPhotoPending','birthdayGuests','birthdayEntries',
    'offlineGuests','eventEntries','sagunEntries','guestEntries',
    'cashHistory','sagunEventHistory','sagunEvents','sgunmsEvents','sagunEventsData',
    'events','setup','familyTree','familyMembers','reminders','birthdayReminders',
    'anniversaryReminders','currentEventId','sgunmsActiveEvent',
    'eventReportData','reportData','pendingSync','syncQueue','offlineQueue',
    'guestData','guestList','entries','entryData'
  ];

  const GLOBAL_KEYS = new Set([
    SESSION_KEY, DEVICE_KEY,
    'sagunUserMode','sagunActiveAccountType','sagunActiveUserId',
    'sagun-auth-session'
  ]);

  function read(){
    try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}
    catch(e){return null}
  }

  function deviceId(){
    let id=localStorage.getItem(DEVICE_KEY);
    if(!id){
      const seed=[
        navigator.userAgent,navigator.language,
        screen.width+'x'+screen.height,screen.colorDepth,
        navigator.platform,navigator.hardwareConcurrency||'',
        Intl.DateTimeFormat().resolvedOptions().timeZone||''
      ].join('|');
      let hash=2166136261;
      for(let i=0;i<seed.length;i++){
        hash^=seed.charCodeAt(i);
        hash=Math.imul(hash,16777619);
      }
      id='dev_'+(hash>>>0).toString(36)+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8);
      localStorage.setItem(DEVICE_KEY,id);
    }
    return id;
  }

  function valid(){
    const s=read();
    return !!(s && s.mode==='guest' && s.deviceId===deviceId() &&
      s.expiresAt && Date.now()<Number(s.expiresAt));
  }

  function daysLeft(){
    const s=read();
    if(!s || s.deviceId!==deviceId()) return 0;
    return Math.max(0,Math.ceil((Number(s.expiresAt)-Date.now())/86400000));
  }

  function guestKey(key){
    const s=read();
    return (s && s.guestId) ? '__sgunms_guest__'+s.guestId+'__'+key : key;
  }

  function rawGet(key){
    try{return localStorage.getItem(key)}catch(_){return null}
  }
  function rawSet(key,value){
    try{localStorage.setItem(key,value)}catch(_){}
  }
  function rawRemove(key){
    try{localStorage.removeItem(key)}catch(_){}
  }

  // Save current browser data into the Guest account namespace.
  function snapshot(){
    if(!valid()) return;
    DATA_KEYS.forEach(k=>{
      const value=rawGet(k);
      if(value!==null) rawSet(guestKey(k),value);
    });
  }

  // Restore Guest data into the keys already used by the existing pages.
  function restore(){
    if(!valid()) return;
    DATA_KEYS.forEach(k=>{
      const value=rawGet(guestKey(k));
      if(value!==null) rawSet(k,value);
    });
  }

  // Make existing pages' direct localStorage calls Guest-scoped.
  // This keeps the current app code working without rewriting every page.
  function installGuestStorageBridge(){
    if(window.__sgunmsGuestStorageBridgeInstalled || !valid()) return;
    window.__sgunmsGuestStorageBridgeInstalled=true;

    const originalGet=Storage.prototype.getItem;
    const originalSet=Storage.prototype.setItem;
    const originalRemove=Storage.prototype.removeItem;

    Storage.prototype.getItem=function(key){
      if(this===localStorage && valid() && DATA_KEYS.includes(String(key))){
        const scoped=originalGet.call(this,guestKey(String(key)));
        if(scoped!==null) return scoped;
      }
      return originalGet.call(this,key);
    };

    Storage.prototype.setItem=function(key,value){
      if(this===localStorage && valid() && DATA_KEYS.includes(String(key))){
        return originalSet.call(this,guestKey(String(key)),String(value));
      }
      return originalSet.call(this,key,value);
    };

    Storage.prototype.removeItem=function(key){
      if(this===localStorage && valid() && DATA_KEYS.includes(String(key))){
        return originalRemove.call(this,guestKey(String(key)));
      }
      return originalRemove.call(this,key);
    };
  }

  function purgeExpired(){
    const s=read();
    if(s && s.expiresAt && Date.now()>=Number(s.expiresAt)){
      if(s.guestId){
        DATA_KEYS.forEach(k=>rawRemove('__sgunms_guest__'+s.guestId+'__'+k));
      }
      DATA_KEYS.forEach(k=>rawRemove(k));
      rawRemove(SESSION_KEY);
      rawRemove('sagunUserMode');
      rawRemove('sagunActiveAccountType');
      rawRemove('sagunActiveUserId');
      return true;
    }
    return false;
  }

  function startGuest(){
    purgeExpired();
    let s=read();

    if(!s || !s.expiresAt || Date.now()>=Number(s.expiresAt) || s.deviceId!==deviceId()){
      const now=Date.now();
      s={
        mode:'guest',
        guestId:'guest_'+now+'_'+Math.random().toString(36).slice(2,8),
        deviceId:deviceId(),
        createdAt:now,
        expiresAt:now+RETENTION_DAYS*86400000
      };
      rawSet(SESSION_KEY,JSON.stringify(s));
    }

    rawSet('sagunUserMode','guest');
    rawSet('sagunActiveAccountType','guest');
    rawRemove('sagunActiveUserId');

    restore();
    installGuestStorageBridge();

    location.href='../html/home.html';
  }

  function isGuest(){ return valid(); }

  function logoutGuest(){
    // Keep the Guest data in this browser.
    // Only the active mode is cleared, so Guest can return later
    // and get the same events/entries back.
    snapshot();
    rawRemove('sagunUserMode');
    rawRemove('sagunActiveUserId');
    rawRemove('sagunActiveAccountType');
    sessionStorage.clear();
    location.href='../html/login.html';
  }

  function clearForRegisteredLogout(){
    // Registered logout must not delete Guest archive.
    localStorage.removeItem('sagunUserMode');
    localStorage.removeItem('sagunActiveUserId');
    localStorage.removeItem('sagunActiveAccountType');
    sessionStorage.clear();
    location.href='../html/login.html';
  }

  function warningMessage(){
    const d=daysLeft();
    if(!d) return '';
    if(d<=WARNING_DAYS)
      return `⚠️ Guest data warning: आपका Guest data ${d} दिन में हट जाएगा। Data बचाने के लिए अभी Register/Login करें।`;
    return `👤 Guest Mode: आपका data इस browser में ${d} दिन तक सुरक्षित है।`;
  }

  function showWarning(){ return; }

  window.SagunGuest={
    start:startGuest,
    isGuest,
    isValid:valid,
    daysLeft,
    logout:logoutGuest,
    clearRegistered:clearForRegisteredLogout,
    purgeExpired,
    deviceId,
    snapshot,
    restore,
    showWarning,
    retentionDays:RETENTION_DAYS
  };

  purgeExpired();

  if(valid()){
    restore();
    installGuestStorageBridge();
    // Keep a backup of guest data even if a page writes directly before bridge initialization.
    setTimeout(snapshot,1500);
    setInterval(snapshot,10000);
    window.addEventListener('beforeunload',snapshot);
  }

  if(document.readyState==='loading')
    document.addEventListener('DOMContentLoaded',showWarning);
  else showWarning();
})();
