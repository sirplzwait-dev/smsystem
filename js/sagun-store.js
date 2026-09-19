/* Sagun Store — Local-first, background sync, realtime multi-device sync.
   - Reads cached data first (no blocking Supabase fetch on every page render)
   - Saves every new entry/event locally immediately
   - Syncs pending changes quietly in the background
   - Uses Supabase Realtime for fast laptop <-> mobile updates
   - Registered users are isolated by auth user id; guests remain local-only
*/
(function(){
  const EVENTS='sagun:events:v1', ENTRIES='sagun:entries:v1', DELETED='sagun:deleted-events:v1';
  const META='sagun:cloud-meta:v2', PENDING='sagun:cloud-pending:v2';
  const UID_KEY='sagunActiveUserId', MODE_KEY='sagunUserMode', GUEST_SESSION='sagunGuestSession';
  const SUPA_URL='https://rdlliurzgwwfjscgwssa.supabase.co';
  const SUPA_KEY='sb_publishable_HX1QmjO0SPyW3rUoihZkkQ_tRTE1bLc';
  const AUTH_STORAGE='sgunms-auth-session';
  const HYDRATE_TTL=10*60*1000;

  const TRANSIENT_KEYS=['currentEventId','sgunmsActiveEvent','currentEventType','selectedEventType','pendingEventType','currentMarriageEvent','eventSetupData','sagunSetup','offlineSetupData','currentEventSetup','birthdaySetup','birthdayPhoto','birthdayPhotoPending','profileData','sagunProfile','userName'];
  const state={};
  let userCache={id:'',user:null,at:0};
  const parse=(k,f={})=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v??f}catch(_){return f}};
  const put=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch(_){return false}};
  const arr=k=>{const v=parse(k,[]);return Array.isArray(v)?v:[]};
  const now=()=>Date.now();
  const uuidRe=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const idOf=x=>String(x?.id||x?.eventId||x?.event_id||x?.key||'').trim();
  const entryId=x=>String(x?.id||x?.entry_id||'').trim();

  function cloud(){
    try{
      if(!window.supabase?.createClient)return null;
      if(window.__sgunmsCloudClient)return window.__sgunmsCloudClient;
      window.__sgunmsCloudClient=window.supabase.createClient(SUPA_URL,SUPA_KEY,{auth:{persistSession:true,storageKey:AUTH_STORAGE,autoRefreshToken:true,detectSessionInUrl:true}});
      return window.__sgunmsCloudClient;
    }catch(e){console.warn('Supabase client:',e);return null;}
  }
  function prepareUserContext(uid){
    const next=String(uid||'').trim();if(!next)return;
    const previous=String(localStorage.getItem('sagunLastAuthUserId')||'').trim();
    if(previous&&previous!==next)TRANSIENT_KEYS.forEach(k=>{try{localStorage.removeItem(k)}catch(_) {}});
    localStorage.setItem('sagunLastAuthUserId',next);localStorage.setItem(UID_KEY,next);
    localStorage.setItem('sagunActiveAccountType','registered');localStorage.removeItem(MODE_KEY);localStorage.removeItem(GUEST_SESSION);
  }
  function clearTransient(){TRANSIENT_KEYS.forEach(k=>{try{localStorage.removeItem(k)}catch(_) {}})}
  function guestId(){try{return String(JSON.parse(localStorage.getItem(GUEST_SESSION)||'null')?.guestId||'').trim()}catch(_){return''}}
  function guestActive(){try{return !!(window.SagunGuest?.isGuest?.()&&guestId())}catch(_){return false}}

  async function currentUser(){
    try{
      if(userCache.user && (now()-userCache.at)<30000) return userCache.user;
      const sb=cloud();if(!sb)return null;
      const r=await sb.auth.getUser();const u=r?.data?.user;
      if(u?.id){userCache={id:u.id,user:u,at:now()};prepareUserContext(u.id);return u;}
    }catch(_){}
    return null;
  }
  try{cloud()?.auth.onAuthStateChange((_event,session)=>{const u=session?.user||null;userCache={id:u?.id||'',user:u,at:now()};if(u?.id)prepareUserContext(u.id);});}catch(_){}
  async function scope(){
    const u=await currentUser();if(u)return'user:'+u.id;
    if(guestActive())return'guest:'+guestId();
    const cached=String(localStorage.getItem(UID_KEY)||'').trim();
    if(cached&&localStorage.getItem(MODE_KEY)!=='guest')return'user:'+cached;
    return'guest:'+('device_'+String(localStorage.getItem('sgunmsGuestDeviceId')||'unknown'));
  }
  function scopeSync(){
    const cached=String(localStorage.getItem(UID_KEY)||'').trim();
    if(cached&&localStorage.getItem(MODE_KEY)!=='guest')return'user:'+cached;
    const gid=guestId();if(gid&&localStorage.getItem(MODE_KEY)==='guest')return'guest:'+gid;
    return'guest:'+('device_'+String(localStorage.getItem('sgunmsGuestDeviceId')||'unknown'));
  }
  function eventListFromLegacy(s){
    const uid=s.startsWith('user:')?s.slice(5):'';if(uid)return arr('sagunEventHistory_'+uid).filter(x=>String(x?.user_id||x?.userId||'')===uid);
    const gid=s.startsWith('guest:')?s.slice(6):'';return gid?arr('sagunEventHistory_'+gid):[];
  }
  function entryListFromLegacy(s){
    const uid=s.startsWith('user:')?s.slice(5):'';if(!uid)return[];
    return ['offlineGuests','eventEntries','sagunEntries','birthdayEntries','birthdayGuests','guestEntries'].flatMap(arr).filter(x=>String(x?.user_id||x?.userId||x?.uid||x?.owner_id||x?.ownerId||'').trim()===uid);
  }
  function eventRow(uid,x){return{ id:uuidRe.test(idOf(x))?idOf(x):undefined,user_id:uid,event_name:String(x?.event_name||x?.eventName||x?.name||x?.event_type||'समारोह'),event_type:String(x?.event_type||x?.eventType||x?.wedding_type||'other'),event_date:x?.event_date||x?.eventDate||null,welcome_name:x?.welcome_name||x?.welcomeName||null,person1:x?.person1||x?.first_name||x?.groom_name||'',person2:x?.person2||x?.second_name||x?.bride_name||'',photo1_url:x?.photo1_url||x?.photo1||x?.groom_photo_url||'',photo2_url:x?.photo2_url||x?.photo2||x?.bride_photo_url||'',qr_url:x?.qr_url||x?.qr||'',created_at:x?.created_at||x?.createdAt||new Date().toISOString()}}
  function entryRow(uid,x,eid){return{ id:uuidRe.test(entryId(x))?entryId(x):undefined,user_id:uid,name:String(x?.name||x?.guestName||''),state:x?.state||'Bihar',district:x?.district||'',village:x?.village||x?.city||'',amount:Number(x?.amount||x?.cashAmount||x?.giftAmount||0)||0,payment_mode:x?.payment_mode||x?.paymentMode||x?.mode||x?.type||'CASH',gift_type:x?.gift_type||x?.giftType||null,gift_description:x?.gift_description||x?.giftDescription||null,event_type:x?.event_type||x?.eventType||null,event_id:uuidRe.test(eid)?eid:null,event_person:x?.event_person||x?.eventPerson||x?.event_person_1||'',event_person_2:x?.event_person_2||x?.eventPerson2||'',event_date:x?.event_date||x?.eventDate||null,relationship:x?.relationship||null,remark:x?.remark||null,created_at:x?.created_at||x?.createdAt||x?.timestamp||new Date().toISOString()}}

  function meta(){return parse(META,{})}
  function markMeta(uid,patch){const m=meta();m[uid]={...(m[uid]||{}),...patch};put(META,m)}
  function pending(){return parse(PENDING,{events:{},entries:{}})}
  function markPending(kind,uid,id){const p=pending();p[kind]=p[kind]||{};p[kind][uid]=Array.from(new Set([...(p[kind][uid]||[]),String(id)]));put(PENDING,p)}
  function clearPending(kind,uid,id){const p=pending();p[kind]=p[kind]||{};p[kind][uid]=(p[kind][uid]||[]).filter(x=>String(x)!==String(id));put(PENDING,p)}

  function dispatch(type,detail){try{window.dispatchEvent(new CustomEvent(type,{detail}))}catch(_) {}}
  function localEventsSync(uid){const p=parse(EVENTS,{});return Array.isArray(p['user:'+uid])?p['user:'+uid]:[]}
  function localEntriesSync(uid){const p=parse(ENTRIES,{});return Array.isArray(p['user:'+uid])?p['user:'+uid]:[]}
  function setLocalEvents(uid,rows){const p=parse(EVENTS,{});p['user:'+uid]=rows;put(EVENTS,p)}
  function setLocalEntries(uid,rows){const p=parse(ENTRIES,{});p['user:'+uid]=rows;put(ENTRIES,p)}

  async function syncPending(uid){
    if(!navigator.onLine)return;
    const sb=cloud();if(!sb)return;
    const s='user:'+uid;
    const evs=localEventsSync(uid).filter(x=>x?.__pendingCloud);
    for(const x of evs){
      const row=eventRow(uid,x);if(!row.event_name)continue;
      try{const r=await sb.from('events').upsert(row,{onConflict:'id'});if(!r.error){const list=localEventsSync(uid).map(z=>idOf(z)===idOf(x)?{...z,__pendingCloud:false,__cloudSyncedAt:new Date().toISOString()}:z);setLocalEvents(uid,list);clearPending('events',uid,idOf(x));}else console.warn('Background event sync:',r.error.message)}catch(e){console.warn('Background event sync:',e)}
    }
    const ents=localEntriesSync(uid).filter(x=>x?.__pendingCloud);
    for(const x of ents){
      const eid=String(x?.event_id||x?.eventId||'').trim();if(!uuidRe.test(eid))continue;
      const row=entryRow(uid,x,eid);try{const r=await sb.from('guests').upsert(row,{onConflict:'id'});if(!r.error){const list=localEntriesSync(uid).map(z=>entryId(z)===entryId(x)?{...z,__pendingCloud:false,__cloudSyncedAt:new Date().toISOString()}:z);setLocalEntries(uid,list);clearPending('entries',uid,entryId(x));}else console.warn('Background entry sync:',r.error.message)}catch(e){console.warn('Background entry sync:',e)}
    }
  }

  async function hydrate(uid,force=false){
    if(!navigator.onLine)return;
    const sb=cloud();if(!sb)return;
    const key='user:'+uid, m=meta()[uid]||{}, lastAt=Number(m.lastHydratedAt||0);
    if(!force&&m.initialHydrated&&(now()-lastAt)<HYDRATE_TTL)return;
    try{
      // First hydration gets the full cloud snapshot. Later reconnect/focus checks only rows
      // created since the last successful snapshot; realtime handles live INSERT/UPDATE/DELETE.
      const first=!m.initialHydrated;
      const cutoff=first?null:new Date(lastAt).toISOString();
      let eq, gq;
      if(cutoff){
        eq=sb.from('events').select('*').eq('user_id',uid).gt('created_at',cutoff).order('created_at',{ascending:false});
        gq=sb.from('guests').select('*').eq('user_id',uid).gt('created_at',cutoff).order('created_at',{ascending:false});
      }else{
        eq=sb.from('events').select('*').eq('user_id',uid).order('created_at',{ascending:false});
        gq=sb.from('guests').select('*').eq('user_id',uid).order('created_at',{ascending:false});
      }
      const [er,gr]=await Promise.all([eq,gq]);
      if(er.error)throw er.error;if(gr.error)throw gr.error;
      const localE=localEventsSync(uid),localG=localEntriesSync(uid);
      const pendingE=new Set(localE.filter(x=>x?.__pendingCloud).map(idOf)),pendingG=new Set(localG.filter(x=>x?.__pendingCloud).map(entryId));
      const eMap=new Map(localE.map(x=>[idOf(x),x]));
      (er.data||[]).forEach(x=>{if(!pendingE.has(idOf(x)))eMap.set(idOf(x),x)});
      const gMap=new Map(localG.map(x=>[entryId(x),x]));
      (gr.data||[]).forEach(x=>{if(!pendingG.has(entryId(x)))gMap.set(entryId(x),x)});
      setLocalEvents(uid,[...eMap.values()].sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0)));
      setLocalEntries(uid,[...gMap.values()].sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0)));
      markMeta(uid,{initialHydrated:true,lastHydratedAt:now()});
      if((er.data?.length||0)||(gr.data?.length||0)||first) dispatch('sagun:data-updated',{reason:'cloud-hydrate',userId:uid});
      await syncPending(uid);
    }catch(e){console.warn('Background hydrate:',e)}
  }

  function startRealtime(uid){
    const st=state[uid]||(state[uid]={});if(st.channel||!navigator.onLine)return;
    const sb=cloud();if(!sb)return;
    try{
      const channel=sb.channel('sgunms-live-'+uid+'-'+Math.random().toString(36).slice(2))
        .on('postgres_changes',{event:'*',schema:'public',table:'events',filter:'user_id=eq.'+uid},payload=>applyRemoteEvent(uid,payload))
        .on('postgres_changes',{event:'*',schema:'public',table:'guests',filter:'user_id=eq.'+uid},payload=>applyRemoteGuest(uid,payload))
        .subscribe(status=>{if(status==='SUBSCRIBED'){st.channel=channel;dispatch('sagun:realtime-ready',{userId:uid})}else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'){st.channel=null}});
    }catch(e){console.warn('Realtime:',e)}
  }
  function applyRemoteEvent(uid,p){
    const list=localEventsSync(uid),row=p?.new||p?.old,id=idOf(row);if(!id)return;
    const next=p.eventType==='DELETE'?list.filter(x=>idOf(x)!==id):[...list.filter(x=>idOf(x)!==id),{...row,__pendingCloud:false,__cloudSyncedAt:new Date().toISOString()}];
    setLocalEvents(uid,next.sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0)));markMeta(uid,{lastRemoteAt:now()});dispatch('sagun:data-updated',{reason:'realtime-events',userId:uid});
  }
  function applyRemoteGuest(uid,p){
    const list=localEntriesSync(uid),row=p?.new||p?.old,id=entryId(row);if(!id)return;
    const next=p.eventType==='DELETE'?list.filter(x=>entryId(x)!==id):[...list.filter(x=>entryId(x)!==id),{...row,__pendingCloud:false,__cloudSyncedAt:new Date().toISOString()}];
    setLocalEntries(uid,next.sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0)));markMeta(uid,{lastRemoteAt:now()});dispatch('sagun:data-updated',{reason:'realtime-guests',userId:uid});
  }

  function ensureBackground(uid){
    const st=state[uid]||(state[uid]={});
    if(!st.channel) startRealtime(uid);
    if(st.started)return;
    st.started=true;
    hydrate(uid,false);
    syncPending(uid);
  }

  async function getEvents(){
    const s=await scope(),p=parse(EVENTS,{}),canonical=Array.isArray(p[s])?p[s]:[],legacy=eventListFromLegacy(s),out=[],seen=new Set();
    if(s.startsWith('user:'))ensureBackground(s.slice(5));
    for(const x of [...canonical,...legacy]){if(!x||typeof x!=='object')continue;const id=idOf(x);if(!id||seen.has(id))continue;seen.add(id);out.push({...x,user_id:s.startsWith('user:')?s.slice(5):x.user_id,userId:s.startsWith('user:')?s.slice(5):x.userId})}
    const d=parse(DELETED,{}),deleted=new Set(Array.isArray(d[s])?d[s].map(String):[]);return out.filter(x=>!deleted.has(idOf(x)));
  }
  async function getEntries(){
    const s=await scope(),p=parse(ENTRIES,{}),canonical=Array.isArray(p[s])?p[s]:[],legacy=entryListFromLegacy(s),out=[],seen=new Set();
    if(s.startsWith('user:'))ensureBackground(s.slice(5));
    const normalize=x=>({...x,event_id:String(x?.event_id||x?.eventId||'').trim(),eventId:String(x?.event_id||x?.eventId||'').trim()});
    for(const x of [...canonical,...legacy]){if(!x||typeof x!=='object')continue;const y=normalize(x),id=entryId(y),eid=y.event_id;if(!eid)continue;const k=id?'id:'+id:'fp:'+eid+'|'+String(y.name||'').trim().toLowerCase()+'|'+String(y.amount||0)+'|'+String(y.created_at||'');if(seen.has(k))continue;seen.add(k);out.push({...y,user_id:s.startsWith('user:')?s.slice(5):y.user_id,userId:s.startsWith('user:')?s.slice(5):y.userId})}
    return out;
  }

  async function addEvent(event){
    const s=await scope();if(!event||typeof event!=='object')throw new Error('Invalid event');
    const id=idOf(event)||crypto.randomUUID(),rec={...event,id,user_id:s.startsWith('user:')?s.slice(5):'',userId:s.startsWith('user:')?s.slice(5):'',__pendingCloud:s.startsWith('user:')};
    const p=parse(EVENTS,{}),list=Array.isArray(p[s])?p[s]:[],i=list.findIndex(x=>idOf(x)===id);if(i>=0)list[i]={...list[i],...rec};else list.unshift(rec);p[s]=list.slice(0,500);put(EVENTS,p);
    if(s.startsWith('user:')){markPending('events',s.slice(5),id);setTimeout(()=>syncPending(s.slice(5)),0)}
    localStorage.setItem('currentEventId',id);localStorage.setItem('sgunmsActiveEvent',JSON.stringify(rec));dispatch('sagun:data-updated',{reason:'local-event',userId:s.slice(5)});return rec;
  }
  async function addEntry(entry){
    const s=await scope(),eid=String(entry?.event_id||entry?.eventId||localStorage.getItem('currentEventId')||'').trim();if(!eid)throw new Error('Entry cannot be saved without event_id');
    const id=entryId(entry)||crypto.randomUUID(),rec={...entry,id,user_id:s.startsWith('user:')?s.slice(5):'',userId:s.startsWith('user:')?s.slice(5):'',event_id:eid,eventId:eid,__pendingCloud:s.startsWith('user:')};
    const p=parse(ENTRIES,{}),list=Array.isArray(p[s])?p[s]:[],i=list.findIndex(x=>entryId(x)===id);if(i>=0)list[i]={...list[i],...rec};else list.unshift(rec);p[s]=list.slice(0,10000);put(ENTRIES,p);
    if(s.startsWith('user:')){markPending('entries',s.slice(5),id);setTimeout(()=>syncPending(s.slice(5)),0)}
    dispatch('sagun:data-updated',{reason:'local-entry',userId:s.slice(5),eventId:eid,entry:rec});return rec;
  }
  async function deleteEvent(id){
    const s=await scope(),eid=String(id||'').trim();if(!eid)return false;const p=parse(EVENTS,{}),n=parse(ENTRIES,{}),d=parse(DELETED,{});p[s]=(p[s]||[]).filter(x=>idOf(x)!==eid);n[s]=(n[s]||[]).filter(x=>String(x?.event_id||x?.eventId||'')!==eid);d[s]=Array.from(new Set([...(d[s]||[]).map(String),eid])).slice(-1000);put(EVENTS,p);put(ENTRIES,n);put(DELETED,d);
    if(s.startsWith('user:')){try{const c=cloud();if(c&&navigator.onLine){await c.from('guests').delete().eq('user_id',s.slice(5)).eq('event_id',eid);await c.from('events').delete().eq('user_id',s.slice(5)).eq('id',eid)}}catch(e){console.warn('Cloud event delete:',e)}}
    dispatch('sagun:data-updated',{reason:'local-delete',userId:s.slice(5)});return true;
  }

  async function syncNow(){const u=await currentUser();if(!u)return false;ensureBackground(u.id);await syncPending(u.id);return true}
  window.addEventListener('online',async()=>{const u=await currentUser();if(u){ensureBackground(u.id);await syncPending(u.id);await hydrate(u.id,true)}});
  document.addEventListener('visibilitychange',async()=>{if(document.visibilityState!=='visible')return;const u=await currentUser();if(u){ensureBackground(u.id);await hydrate(u.id,false)}});

  window.SagunStore={uid:scope,getEvents,getEntries,addEvent,addEntry,deleteEvent,migrate:async()=>true,prepareUserContext,clearTransient,
    eventsSync:u=>{const p=parse(EVENTS,{}),s=u?'user:'+u:scopeSync();return Array.isArray(p[s])?p[s]:[]},
    entriesSync:u=>{const p=parse(ENTRIES,{}),s=u?'user:'+u:scopeSync();return Array.isArray(p[s])?p[s]:[]},
    deletedEvents:async()=>{const s=await scope(),d=parse(DELETED,{});return Array.isArray(d[s])?d[s]:[]},
    syncNow,refreshFromCloud:async()=>{const u=await currentUser();if(!u)return false;ensureBackground(u.id);await hydrate(u.id,true);return true},
    EVENTS_KEY:EVENTS,ENTRIES_KEY:ENTRIES};
})();
