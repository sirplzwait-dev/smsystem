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

  // Local-first reads: return cached data immediately. Cloud refresh happens
  // in the background and updates the page through a custom event.
  function localEventsForScope(s){
    const p=parse(EVENTS), canonical=Array.isArray(p[s])?p[s]:[], legacy=eventListFromLegacy(s);
    const d=parse(DELETED),deleted=new Set(Array.isArray(d[s])?d[s].map(String):[]);
    const out=[],seen=new Set();
    for(const x of [...canonical,...legacy]){
      if(!x||typeof x!=='object')continue;
      const id=idOf(x); if(!id||seen.has(id)||deleted.has(id))continue;
      seen.add(id); out.push({...x,user_id:s.startsWith('user:')?s.slice(5):x.user_id,userId:s.startsWith('user:')?s.slice(5):x.userId});
    }
    return out;
  }

  function localEntriesForScope(s){
    const p=parse(ENTRIES), canonical=Array.isArray(p[s])?p[s]:[], legacy=entryListFromLegacy(s);
    const out=[],seen=new Set();
    const normalize=x=>({...x,event_id:String(x?.event_id||x?.eventId||'').trim(),eventId:String(x?.event_id||x?.eventId||'').trim()});
    for(const x of [...canonical,...legacy]){
      if(!x||typeof x!=='object')continue;
      const y=normalize(x),id=entryId(y),eid=y.event_id;if(!eid)continue;
      const k=id?'id:'+id:'fp:'+eid+'|'+String(y.name||y.guestName||'').trim().toLowerCase()+'|'+String(y.amount||0)+'|'+String(y.created_at||y.createdAt||'');
      if(seen.has(k))continue;seen.add(k);
      out.push({...y,user_id:s.startsWith('user:')?s.slice(5):y.user_id,userId:s.startsWith('user:')?s.slice(5):y.userId});
    }
    return out;
  }

  function mergeCloudEvents(uid, rows){
    const s='user:'+uid, p=parse(EVENTS), current=Array.isArray(p[s])?p[s]:[], map=new Map();
    [...current,...(rows||[])].forEach(x=>{const id=idOf(x);if(id)map.set(id,{...map.get(id),...x});});
    p[s]=Array.from(map.values()).sort((a,b)=>new Date(b?.created_at||0)-new Date(a?.created_at||0)).slice(0,500);
    put(EVENTS,p);
    return p[s];
  }

  function mergeCloudEntries(uid, rows){
    const s='user:'+uid, p=parse(ENTRIES), current=Array.isArray(p[s])?p[s]:[], map=new Map();
    [...current,...(rows||[])].forEach(x=>{
      const id=entryId(x);
      const key=id||('fp:'+String(x?.event_id||x?.eventId||'')+'|'+String(x?.name||'').toLowerCase()+'|'+String(x?.amount||0)+'|'+String(x?.created_at||''));
      map.set(key,{...map.get(key),...x,__cloudSynced:true,__cloudId:id||x?.id||''});
    });
    p[s]=Array.from(map.values()).slice(0,10000);
    put(ENTRIES,p);
    return p[s];
  }

  let cloudRefreshPromise=null;
  async function refreshCloudForUser(uid){
    if(!uid||!navigator.onLine)return;
    if(cloudRefreshPromise)return cloudRefreshPromise;
    cloudRefreshPromise=(async()=>{
      const c=cloud(); if(!c)return;
      try{
        const [ev,gu]=await Promise.all([
          c.from('events').select('*').eq('user_id',uid).order('created_at',{ascending:false}),
          c.from('guests').select('*').eq('user_id',uid).order('created_at',{ascending:false})
        ]);
        if(!ev.error)mergeCloudEvents(uid,ev.data||[]);
        if(!gu.error)mergeCloudEntries(uid,gu.data||[]);
        try{window.dispatchEvent(new CustomEvent('sgunms:data-updated',{detail:{userId:uid}}));}catch(_){}
      }catch(e){console.warn('Background cloud refresh:',e)}
      finally{cloudRefreshPromise=null}
    })();
    return cloudRefreshPromise;
  }

  let realtimeStartedFor='';
  function startRealtime(uid){
    if(!uid||!navigator.onLine||realtimeStartedFor===uid)return;
    const c=cloud(); if(!c)return;
    realtimeStartedFor=uid;
    try{
      c.channel('sgunms-live-'+uid)
       .on('postgres_changes',{event:'*',schema:'public',table:'events',filter:'user_id=eq.'+uid},payload=>{
          mergeCloudEvents(uid,payload.eventType==='DELETE'?[]:[payload.new]);
          if(payload.eventType==='DELETE'){
            const p=parse(EVENTS),s='user:'+uid;p[s]=(p[s]||[]).filter(x=>idOf(x)!==String(payload.old?.id||''));put(EVENTS,p);
          }
          window.dispatchEvent(new CustomEvent('sgunms:data-updated',{detail:{userId:uid,table:'events'}}));
       })
       .on('postgres_changes',{event:'*',schema:'public',table:'guests',filter:'user_id=eq.'+uid},payload=>{
          mergeCloudEntries(uid,payload.eventType==='DELETE'?[]:[payload.new]);
          if(payload.eventType==='DELETE'){
            const p=parse(ENTRIES),s='user:'+uid;p[s]=(p[s]||[]).filter(x=>entryId(x)!==String(payload.old?.id||''));put(ENTRIES,p);
          }
          window.dispatchEvent(new CustomEvent('sgunms:data-updated',{detail:{userId:uid,table:'guests'}}));
       })
       .subscribe();
    }catch(e){console.warn('Realtime:',e)}
  }

  async function getEvents(){
    const s=await scope(), local=localEventsForScope(s);
    if(s.startsWith('user:')){
      const uid=s.slice(5);
      // Never block the UI when cache already exists.
      if(local.length){ refreshCloudForUser(uid); startRealtime(uid); return local; }
      // First device / empty cache: one initial cloud read is necessary.
      await refreshCloudForUser(uid);
      startRealtime(uid);
      return localEventsForScope(s);
    }
    return local;
  }

  async function getEntries(){
    const s=await scope(), local=localEntriesForScope(s);
    if(s.startsWith('user:')){
      const uid=s.slice(5);
      if(local.length){ refreshCloudForUser(uid); startRealtime(uid); return local; }
      await refreshCloudForUser(uid);
      startRealtime(uid);
      return localEntriesForScope(s);
    }
    return local;
  }

  async function addEvent(event){
    const s=await scope();if(!event||typeof event!=='object')throw new Error('Invalid event');
    const id=idOf(event)||crypto.randomUUID(),rec={...event,id,user_id:s.startsWith('user:')?s.slice(5):'',userId:s.startsWith('user:')?s.slice(5):''};
    const p=parse(EVENTS),list=Array.isArray(p[s])?p[s]:[],i=list.findIndex(x=>idOf(x)===id);if(i>=0)list[i]={...list[i],...rec};else list.unshift(rec);p[s]=list.slice(0,500);put(EVENTS,p);
    if(s.startsWith('user:')){const k='sagunEventHistory_'+s.slice(5),old=arr(k),j=old.findIndex(x=>idOf(x)===id);if(j>=0)old[j]={...old[j],...rec};else old.unshift(rec);put(k,old.slice(0,500));await syncLocalEvents(s.slice(5),[rec]);}
    localStorage.setItem('currentEventId',id);localStorage.setItem('sgunmsActiveEvent',JSON.stringify(rec));return rec;
  }

  async function addEntry(entry){
    const s=await scope(),eid=String(entry?.event_id||entry?.eventId||localStorage.getItem('currentEventId')||'').trim();if(!eid)throw new Error('Entry cannot be saved without event_id');
    const id=entryId(entry)||crypto.randomUUID(),rec={...entry,id,user_id:s.startsWith('user:')?s.slice(5):'',userId:s.startsWith('user:')?s.slice(5):'',event_id:eid,eventId:eid};
    const p=parse(ENTRIES),list=Array.isArray(p[s])?p[s]:[],i=list.findIndex(x=>entryId(x)===id);if(i>=0)list[i]={...list[i],...rec};else list.unshift(rec);p[s]=list.slice(0,10000);put(ENTRIES,p);
    if(s.startsWith('user:')) await syncLocalEntries(s.slice(5),[rec]);
    return rec;
  }

  async function deleteEvent(id){
    const s=await scope(),eid=String(id||'').trim();if(!eid)return false;
    const p=parse(EVENTS),n=parse(ENTRIES),d=parse(DELETED);p[s]=(p[s]||[]).filter(x=>idOf(x)!==eid);n[s]=(n[s]||[]).filter(x=>String(x?.event_id||x?.eventId||'')!==eid);d[s]=Array.from(new Set([...(d[s]||[]).map(String),eid])).slice(-1000);put(EVENTS,p);put(ENTRIES,n);put(DELETED,d);
    if(s.startsWith('user:')){try{const c=cloud();if(c){await c.from('guests').delete().eq('user_id',s.slice(5)).eq('event_id',eid);await c.from('events').delete().eq('user_id',s.slice(5)).eq('id',eid)}}catch(e){console.warn('Cloud event delete:',e)}}
    return true;
  }

  window.addEventListener('online',()=>{
    setTimeout(()=>{
      try{
        window.SagunStore?.syncNow?.();
        currentUser().then(u=>{if(u){refreshCloudForUser(u.id);startRealtime(u.id);}});
      }catch(_){}
    },300);
  });
  window.SagunStore={uid:scope,getEvents,getEntries,addEvent,addEntry,deleteEvent,migrate:async()=>true,
    prepareUserContext,clearTransient,
    eventsSync:(u)=>{const p=parse(EVENTS),s=u?('user:'+u):scopeSync();return Array.isArray(p[s])?p[s]:[]},
    entriesSync:(u)=>{const p=parse(ENTRIES),s=u?('user:'+u):scopeSync();return Array.isArray(p[s])?p[s]:[]},
    deletedEvents:async()=>{const s=await scope(),d=parse(DELETED);return Array.isArray(d[s])?d[s]:[]},
    syncNow:async()=>{const u=await currentUser();if(!u)return false;const s='user:'+u.id,p=parse(EVENTS),n=parse(ENTRIES);await syncLocalEvents(u.id,[...(p[s]||[]),...eventListFromLegacy(s)]);await syncLocalEntries(u.id,[...(n[s]||[]),...entryListFromLegacy(s)]);return true},
    EVENTS_KEY:EVENTS,ENTRIES_KEY:ENTRIES};
})();
