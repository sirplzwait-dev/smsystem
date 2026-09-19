/* Sagun local-first + Supabase cloud-sync store.
   Registered users: local data is kept immediately AND synced to Supabase.
   Guest users: data stays local only. */
(function(){
  const EVENTS='sagun:events:v1', ENTRIES='sagun:entries:v1', DELETED='sagun:deleted-events:v1';
  const UID_KEY='sagunActiveUserId', MODE_KEY='sagunUserMode', GUEST_SESSION='sagunGuestSession';
  const SUPA_URL='https://rdlliurzgwwfjscgwssa.supabase.co';
  const SUPA_KEY='sb_publishable_HX1QmjO0SPyW3rUoihZkkQ_tRTE1bLc';
  const AUTH_STORAGE='sgunms-auth-session';

  // These keys are temporary UI/session state. They must never survive an
  // account switch, otherwise User B could briefly see User A's last event/setup.
  const TRANSIENT_KEYS=[
    'currentEventId','sgunmsActiveEvent','currentEventType','selectedEventType','pendingEventType',
    'currentMarriageEvent','eventSetupData','sagunSetup','offlineSetupData','currentEventSetup',
    'birthdaySetup','birthdayPhoto','birthdayPhotoPending','profileData','sagunProfile','userName'
  ];
  function prepareUserContext(uid){
    const next=String(uid||'').trim();
    if(!next)return;
    const previous=String(localStorage.getItem('sagunLastAuthUserId')||'').trim();
    if(previous && previous!==next){
      TRANSIENT_KEYS.forEach(k=>{try{localStorage.removeItem(k)}catch(_){}});
    }
    localStorage.setItem('sagunLastAuthUserId',next);
    localStorage.setItem(UID_KEY,next);
    localStorage.setItem('sagunActiveAccountType','registered');
    localStorage.removeItem(MODE_KEY);
    localStorage.removeItem(GUEST_SESSION);
  }
  function clearTransient(){
    TRANSIENT_KEYS.forEach(k=>{try{localStorage.removeItem(k)}catch(_){}});
  }

  function cloud(){
    try{
      if(!window.supabase?.createClient) return null;
      if(window.__sgunmsCloudClient) return window.__sgunmsCloudClient;
      window.__sgunmsCloudClient=window.supabase.createClient(SUPA_URL,SUPA_KEY,{auth:{persistSession:true,storageKey:AUTH_STORAGE,autoRefreshToken:true,detectSessionInUrl:true}});
      return window.__sgunmsCloudClient;
    }catch(e){ console.warn('Supabase client:',e); return null; }
  }
  const parse=k=>{try{const v=JSON.parse(localStorage.getItem(k)||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{};}catch(_){return{}}};
  const put=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch(_){return false}};
  const arr=k=>{try{const v=JSON.parse(localStorage.getItem(k)||'[]');return Array.isArray(v)?v:[];}catch(_){return[]}};
  function guestId(){try{const s=JSON.parse(localStorage.getItem(GUEST_SESSION)||'null');return String(s?.guestId||'').trim()}catch(_){return''}}
  function guestActive(){try{return !!(window.SagunGuest?.isGuest?.() && guestId())}catch(_){return false}}
  async function currentUser(){
    try{
      const sb=cloud(); if(!sb)return null;
      const r=await sb.auth.getUser(); const u=r?.data?.user;
      if(u?.id){prepareUserContext(u.id);return u;}
    }catch(_){ }
    return null;
  }
  async function scope(){
    const u=await currentUser(); if(u)return 'user:'+u.id;
    if(guestActive())return 'guest:'+guestId();
    const cached=String(localStorage.getItem(UID_KEY)||'').trim();
    if(cached && localStorage.getItem(MODE_KEY)!=='guest')return 'user:'+cached;
    return 'guest:'+('device_'+String(localStorage.getItem('sgunmsGuestDeviceId')||'unknown'));
  }
  function scopeSync(){
    const cached=String(localStorage.getItem(UID_KEY)||'').trim();
    if(cached && localStorage.getItem(MODE_KEY)!=='guest')return 'user:'+cached;
    const gid=guestId(); if(gid && localStorage.getItem(MODE_KEY)==='guest')return 'guest:'+gid;
    return 'guest:'+('device_'+String(localStorage.getItem('sgunmsGuestDeviceId')||'unknown'));
  }
  const uuidRe=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  function idOf(x){return String(x?.id||x?.eventId||x?.event_id||x?.key||'').trim()}
  function entryId(x){return String(x?.id||x?.entry_id||'').trim()}
  function eventListFromLegacy(scopeKey){
    const uid=scopeKey.startsWith('user:')?scopeKey.slice(5):'';
    if(uid)return arr('sagunEventHistory_'+uid).filter(x=>String(x?.user_id||x?.userId||'')===uid);
    const gid=scopeKey.startsWith('guest:')?scopeKey.slice(6):'';
    return gid?arr('sagunEventHistory_'+gid):[];
  }
  function entryListFromLegacy(scopeKey){
    const uid=scopeKey.startsWith('user:')?scopeKey.slice(5):'';
    if(!uid)return [];
    const keys=['offlineGuests','eventEntries','sagunEntries','birthdayEntries','birthdayGuests','guestEntries'];
    return keys.flatMap(arr).filter(x=>String(x?.user_id||x?.userId||x?.uid||x?.owner_id||x?.ownerId||'').trim()===uid);
  }

  function eventRow(userId,x){
    return {
      id:uuidRe.test(idOf(x))?idOf(x):undefined,
      user_id:userId,
      event_name:String(x?.event_name||x?.eventName||x?.name||x?.event_type||'समारोह'),
      event_type:String(x?.event_type||x?.eventType||x?.wedding_type||'other'),
      event_date:x?.event_date||x?.eventDate||null,
      welcome_name:x?.welcome_name||x?.welcomeName||null,
      person1:x?.person1||x?.first_name||x?.groom_name||'',
      person2:x?.person2||x?.second_name||x?.bride_name||'',
      photo1_url:x?.photo1_url||x?.photo1||x?.groom_photo_url||'',
      photo2_url:x?.photo2_url||x?.photo2||x?.bride_photo_url||'',
      qr_url:x?.qr_url||x?.qr||'',
      created_at:x?.created_at||x?.createdAt||new Date().toISOString()
    };
  }

  function entryRow(userId,x,eid){
    return {
      id:uuidRe.test(entryId(x))?entryId(x):undefined,
      user_id:userId,
      name:String(x?.name||x?.guestName||''),
      state:x?.state||'Bihar',
      district:x?.district||'',
      village:x?.village||x?.city||'',
      amount:Number(x?.amount||x?.cashAmount||x?.giftAmount||0)||0,
      payment_mode:x?.payment_mode||x?.paymentMode||x?.mode||x?.type||'CASH',
      gift_type:x?.gift_type||x?.giftType||null,
      gift_description:x?.gift_description||x?.giftDescription||null,
      event_type:x?.event_type||x?.eventType||null,
      event_id:uuidRe.test(eid)?eid:null,
      event_person:x?.event_person||x?.eventPerson||x?.event_person_1||'',
      event_person_2:x?.event_person_2||x?.eventPerson2||'',
      event_date:x?.event_date||x?.eventDate||null,
      relationship:x?.relationship||null,
      remark:x?.remark||null,
      created_at:x?.created_at||x?.createdAt||x?.timestamp||new Date().toISOString()
    };
  }

  async function syncLocalEvents(userId, localRows){
    const sb=cloud(); if(!sb||!userId||!navigator.onLine)return;
    for(const x of localRows){
      const row=eventRow(userId,x); if(!row.event_name||!row.event_type)continue;
      try{
        const q=row.id ? sb.from('events').upsert(row,{onConflict:'id'}) : sb.from('events').insert(row);
        const r=await q;
        if(r.error) console.warn('Cloud event sync:',r.error.message);
      }catch(e){console.warn('Cloud event sync:',e)}
    }
  }

  async function syncLocalEntries(userId, localRows){
    const sb=cloud(); if(!sb||!userId||!navigator.onLine)return;
    const p=parse(ENTRIES), key='user:'+userId, list=Array.isArray(p[key])?p[key]:[];
    let changed=false;
    for(const x of localRows){
      const eid=String(x?.event_id||x?.eventId||'').trim(); if(!eid||!uuidRe.test(eid))continue;
      if(x.__cloudSynced && x.__cloudId)continue;
      const row=entryRow(userId,x,eid);
      try{
        const r=row.id ? await sb.from('guests').upsert(row,{onConflict:'id'}) : await sb.from('guests').insert(row).select('id').single();
        if(!r.error){
          const localId=entryId(x);
          const idx=list.findIndex(z=>entryId(z)===localId);
          if(idx>=0){list[idx]={...list[idx],__cloudSynced:true,__cloudId:r.data?.id||row.id||''};changed=true;}
        }else console.warn('Cloud entry sync:',r.error.message);
      }catch(e){console.warn('Cloud entry sync:',e)}
    }
    if(changed)put(ENTRIES,{...p,[key]:list});
  }

  // ---- Local-first cloud hydration + realtime background sync ----
  const hydration = new Map();
  const realtime = new Map();
  let syncTimer = null;
  let syncRunning = false;

  function cacheEvents(scopeKey){
    const p=parse(EVENTS), canonical=Array.isArray(p[scopeKey])?p[scopeKey]:[], legacy=eventListFromLegacy(scopeKey), out=[], seen=new Set();
    for(const x of [...canonical,...legacy]){
      if(!x||typeof x!=='object')continue;
      const id=idOf(x); if(!id||seen.has(id))continue;
      seen.add(id); out.push({...x});
    }
    const d=parse(DELETED), deleted=new Set(Array.isArray(d[scopeKey])?d[scopeKey].map(String):[]);
    return out.filter(x=>!deleted.has(idOf(x)));
  }

  function cacheEntries(scopeKey){
    const p=parse(ENTRIES), canonical=Array.isArray(p[scopeKey])?p[scopeKey]:[], legacy=entryListFromLegacy(scopeKey), out=[], seen=new Set();
    const normalize=x=>({...x,event_id:String(x?.event_id||x?.eventId||'').trim(),eventId:String(x?.event_id||x?.eventId||'').trim()});
    for(const x of [...canonical,...legacy]){
      if(!x||typeof x!=='object')continue;
      const y=normalize(x),id=entryId(y),eid=y.event_id;
      if(!eid)continue;
      const k=id?'id:'+id:'fp:'+eid+'|'+String(y.name||'').trim().toLowerCase()+'|'+String(y.amount||0)+'|'+String(y.created_at||'');
      if(seen.has(k))continue; seen.add(k); out.push({...y});
    }
    return out;
  }

  function saveCloudEvents(scopeKey, rows){
    const p=parse(EVENTS), d=parse(DELETED), deleted=new Set(Array.isArray(d[scopeKey])?d[scopeKey].map(String):[]);
    const list=(Array.isArray(rows)?rows:[]).filter(x=>!deleted.has(idOf(x))).map(x=>({...x,user_id:scopeKey.startsWith('user:')?scopeKey.slice(5):x.user_id,userId:scopeKey.startsWith('user:')?scopeKey.slice(5):x.userId}));
    p[scopeKey]=list; put(EVENTS,p); return list;
  }
  function saveCloudEntries(scopeKey, rows){
    const p=parse(ENTRIES), list=[]; const seen=new Set();
    for(const x of (Array.isArray(rows)?rows:[])){
      const y={...x,event_id:String(x?.event_id||x?.eventId||'').trim(),eventId:String(x?.event_id||x?.eventId||'').trim()};
      if(!y.event_id)continue;
      const k=entryId(y)?'id:'+entryId(y):'fp:'+y.event_id+'|'+String(y.name||'').trim().toLowerCase()+'|'+String(y.amount||0)+'|'+String(y.created_at||'');
      if(seen.has(k))continue; seen.add(k); list.push(y);
    }
    p[scopeKey]=list; put(ENTRIES,p); return list;
  }

  function notifyChanged(kind){
    try{window.dispatchEvent(new CustomEvent('sagun:data-changed',{detail:{kind}}));}catch(_){ }
  }

  function subscribeRealtime(userId){
    if(!userId || realtime.has(userId)) return;
    const sb=cloud(); if(!sb) return;
    try{
      const ch=sb.channel('sgunms-live-'+userId)
        .on('postgres_changes',{event:'*',schema:'public',table:'events',filter:'user_id=eq.'+userId},payload=>{
          const s='user:'+userId, p=parse(EVENTS), list=Array.isArray(p[s])?p[s].slice():[];
          const id=idOf(payload.new||payload.old);
          if(payload.eventType==='DELETE') p[s]=list.filter(x=>idOf(x)!==id);
          else { const row=payload.new; const i=list.findIndex(x=>idOf(x)===id); if(i>=0)list[i]={...list[i],...row}; else list.unshift(row); p[s]=list; }
          put(EVENTS,p); notifyChanged('events');
        })
        .on('postgres_changes',{event:'*',schema:'public',table:'guests',filter:'user_id=eq.'+userId},payload=>{
          const s='user:'+userId, p=parse(ENTRIES), list=Array.isArray(p[s])?p[s].slice():[];
          const id=entryId(payload.new||payload.old);
          if(payload.eventType==='DELETE') p[s]=list.filter(x=>entryId(x)!==id);
          else { const row=payload.new, i=list.findIndex(x=>entryId(x)===id); if(i>=0)list[i]={...list[i],...row}; else list.unshift(row); p[s]=list; }
          put(ENTRIES,p); notifyChanged('entries');
        })
        .subscribe();
      realtime.set(userId,ch);
    }catch(e){console.warn('Realtime subscribe:',e)}
  }

  async function hydrateCloud(userId){
    if(!userId || !navigator.onLine) return false;
    const key='user:'+userId;
    if(hydration.has(key)) return hydration.get(key);
    const task=(async()=>{
      const sb=cloud(); if(!sb) return false;
      subscribeRealtime(userId);
      await syncLocalEvents(userId,cacheEvents(key));
      await syncLocalEntries(userId,cacheEntries(key));
      try{
        const [er,gr]=await Promise.all([
          sb.from('events').select('*').eq('user_id',userId).order('created_at',{ascending:false}),
          sb.from('guests').select('*').eq('user_id',userId).order('created_at',{ascending:false})
        ]);
        if(!er.error) saveCloudEvents(key,er.data||[]);
        if(!gr.error) saveCloudEntries(key,gr.data||[]);
        notifyChanged('all');
        try{window.dispatchEvent(new CustomEvent('sagun:cloud-hydrated',{detail:{userId}}));}catch(_){}
        return !er.error && !gr.error;
      }catch(e){console.warn('Cloud hydrate:',e);return false}
      finally{setTimeout(()=>hydration.delete(key),5000)}
    })();
    hydration.set(key,task); return task;
  }

  function scheduleBackgroundSync(delay=900){
    clearTimeout(syncTimer);
    syncTimer=setTimeout(()=>{window.SagunStore?.syncNow?.().catch(()=>{});},delay);
  }

  async function getEvents(){
    const s=scopeSync();
    const cached=cacheEvents(s);
    if(s.startsWith('user:')){
      const uid=s.slice(5); subscribeRealtime(uid); if(!hydration.has(s)) hydrateCloud(uid).catch(()=>{}); else scheduleBackgroundSync();
    }
    return cached;
  }

  async function getEntries(){
    const s=scopeSync();
    const cached=cacheEntries(s);
    if(s.startsWith('user:')){
      const uid=s.slice(5); subscribeRealtime(uid); if(!hydration.has(s)) hydrateCloud(uid).catch(()=>{}); else scheduleBackgroundSync();
    }
    return cached;
  }

  async function addEvent(event){
    const s=await scope();if(!event||typeof event!=='object')throw new Error('Invalid event');
    const id=idOf(event)||crypto.randomUUID(),rec={...event,id,user_id:s.startsWith('user:')?s.slice(5):'',userId:s.startsWith('user:')?s.slice(5):''};
    const p=parse(EVENTS),list=Array.isArray(p[s])?p[s]:[],i=list.findIndex(x=>idOf(x)===id);if(i>=0)list[i]={...list[i],...rec};else list.unshift(rec);p[s]=list.slice(0,500);put(EVENTS,p);
    if(s.startsWith('user:')){const k='sagunEventHistory_'+s.slice(5),old=arr(k),j=old.findIndex(x=>idOf(x)===id);if(j>=0)old[j]={...old[j],...rec};else old.unshift(rec);put(k,old.slice(0,500));scheduleBackgroundSync(300);}
    localStorage.setItem('currentEventId',id);localStorage.setItem('sgunmsActiveEvent',JSON.stringify(rec));return rec;
  }

  async function addEntry(entry){
    const s=await scope(),eid=String(entry?.event_id||entry?.eventId||localStorage.getItem('currentEventId')||'').trim();if(!eid)throw new Error('Entry cannot be saved without event_id');
    const id=entryId(entry)||crypto.randomUUID(),rec={...entry,id,user_id:s.startsWith('user:')?s.slice(5):'',userId:s.startsWith('user:')?s.slice(5):'',event_id:eid,eventId:eid};
    const p=parse(ENTRIES),list=Array.isArray(p[s])?p[s]:[],i=list.findIndex(x=>entryId(x)===id);if(i>=0)list[i]={...list[i],...rec};else list.unshift(rec);p[s]=list.slice(0,10000);put(ENTRIES,p);
    if(s.startsWith('user:')) scheduleBackgroundSync(300);
    return rec;
  }

  async function deleteEvent(id){
    const s=await scope(),eid=String(id||'').trim();if(!eid)return false;
    const p=parse(EVENTS),n=parse(ENTRIES),d=parse(DELETED);p[s]=(p[s]||[]).filter(x=>idOf(x)!==eid);n[s]=(n[s]||[]).filter(x=>String(x?.event_id||x?.eventId||'')!==eid);d[s]=Array.from(new Set([...(d[s]||[]).map(String),eid])).slice(-1000);put(EVENTS,p);put(ENTRIES,n);put(DELETED,d);
    if(s.startsWith('user:')){try{const c=cloud();if(c){await c.from('guests').delete().eq('user_id',s.slice(5)).eq('event_id',eid);await c.from('events').delete().eq('user_id',s.slice(5)).eq('id',eid)}}catch(e){console.warn('Cloud event delete:',e)}}
    return true;
  }

  window.addEventListener('online',()=>{ setTimeout(()=>scheduleBackgroundSync(100),100); });
  window.SagunStore={uid:scope,getEvents,getEntries,addEvent,addEntry,deleteEvent,migrate:async()=>true,
    prepareUserContext,clearTransient,
    eventsSync:(u)=>{const p=parse(EVENTS),s=u?('user:'+u):scopeSync();return Array.isArray(p[s])?p[s]:[]},
    entriesSync:(u)=>{const p=parse(ENTRIES),s=u?('user:'+u):scopeSync();return Array.isArray(p[s])?p[s]:[]},
    deletedEvents:async()=>{const s=await scope(),d=parse(DELETED);return Array.isArray(d[s])?d[s]:[]},
    syncNow:async()=>{
      if(syncRunning)return false; const u=await currentUser(); if(!u||!navigator.onLine)return false;
      syncRunning=true; try{const s='user:'+u.id; subscribeRealtime(u.id); const p=parse(EVENTS),n=parse(ENTRIES);
        await syncLocalEvents(u.id,[...(p[s]||[]),...eventListFromLegacy(s)]);
        await syncLocalEntries(u.id,[...(n[s]||[]),...entryListFromLegacy(s)]);
        await hydrateCloud(u.id); return true;
      }finally{syncRunning=false;}
    },
    EVENTS_KEY:EVENTS,ENTRIES_KEY:ENTRIES};

  // Start silent background sync after the UI is ready. Never block first paint.
  window.addEventListener('load',()=>setTimeout(()=>{scheduleBackgroundSync(1200);},1200));
})();
