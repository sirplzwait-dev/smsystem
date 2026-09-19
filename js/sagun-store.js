/* SGUNMS local-first + incremental Supabase sync.
   - Browser cache is the primary read source after the first sync.
   - Existing cached data is shown immediately, even offline.
   - Only new cloud rows are fetched after the first successful sync.
   - Local saves never wait for the network; they sync in the background.
   - Guest mode remains local-only.
*/
(function(){
  const EVENTS='sagun:events:v1', ENTRIES='sagun:entries:v1', DELETED='sagun:deleted-events:v1';
  const UID_KEY='sagunActiveUserId', MODE_KEY='sagunUserMode', GUEST_SESSION='sagunGuestSession';
  const META='sagun:cloud-sync-meta:v2';
  const SUPA_URL='https://rdlliurzgwwfjscgwssa.supabase.co';
  const SUPA_KEY='sb_publishable_HX1QmjO0SPyW3rUoihZkkQ_tRTE1bLc';
  const AUTH_STORAGE='sgunms-auth-session';
  let syncPromise=null;

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
      if(u?.id){localStorage.setItem(UID_KEY,u.id);localStorage.removeItem(MODE_KEY);return u;}
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
    return {id:uuidRe.test(idOf(x))?idOf(x):crypto.randomUUID(),user_id:userId,event_name:String(x?.event_name||x?.eventName||x?.name||x?.event_type||'समारोह'),event_type:String(x?.event_type||x?.eventType||x?.wedding_type||'other'),event_date:x?.event_date||x?.eventDate||null,welcome_name:x?.welcome_name||x?.welcomeName||null,person1:x?.person1||x?.first_name||x?.groom_name||'',person2:x?.person2||x?.second_name||x?.bride_name||'',photo1_url:x?.photo1_url||x?.photo1||x?.groom_photo_url||'',photo2_url:x?.photo2_url||x?.photo2||x?.bride_photo_url||'',qr_url:x?.qr_url||x?.qr||'',created_at:x?.created_at||x?.createdAt||new Date().toISOString()};
  }
  function entryRow(userId,x,eid){
    return {id:uuidRe.test(entryId(x))?entryId(x):crypto.randomUUID(),user_id:userId,name:String(x?.name||x?.guestName||''),state:x?.state||'Bihar',district:x?.district||'',village:x?.village||x?.city||'',amount:Number(x?.amount||x?.cashAmount||x?.giftAmount||0)||0,payment_mode:x?.payment_mode||x?.paymentMode||x?.mode||x?.type||'CASH',gift_type:x?.gift_type||x?.giftType||null,gift_description:x?.gift_description||x?.giftDescription||null,event_type:x?.event_type||x?.eventType||null,event_id:uuidRe.test(eid)?eid:null,event_person:x?.event_person||x?.eventPerson||x?.event_person_1||'',event_person_2:x?.event_person_2||x?.eventPerson2||'',event_date:x?.event_date||x?.eventDate||null,relationship:x?.relationship||null,remark:x?.remark||null,created_at:x?.created_at||x?.createdAt||x?.timestamp||new Date().toISOString()};
  }
  function meta(){return parse(META)}
  function setMeta(scopeKey,kind,value){const m=meta();m[scopeKey]=m[scopeKey]||{};m[scopeKey][kind]=value;put(META,m)}
  function getMeta(scopeKey,kind){return meta()?.[scopeKey]?.[kind]||''}
  function newest(rows){return rows.reduce((m,x)=>{const t=Date.parse(x?.created_at||x?.createdAt||'');return Number.isFinite(t)&&t>m?t:m},0)}
  function notify(kind){try{window.dispatchEvent(new CustomEvent('sagun:sync',{detail:{kind}}))}catch(_){} }

  async function syncLocalEvents(userId, localRows){
    const sb=cloud(); if(!sb||!userId||!navigator.onLine)return;
    for(const x of localRows){
      const row=eventRow(userId,x); if(!row.event_name||!row.event_type)continue;
      try{
        const r=await sb.from('events').upsert(row,{onConflict:'id'});
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
        const r=await sb.from('guests').upsert(row,{onConflict:'id'});
        if(!r.error){
          const localId=entryId(x),idx=list.findIndex(z=>entryId(z)===localId);
          if(idx>=0){list[idx]={...list[idx],__cloudSynced:true,__cloudId:r.data?.[0]?.id||r.data?.id||row.id};changed=true;}
        }else console.warn('Cloud entry sync:',r.error.message);
      }catch(e){console.warn('Cloud entry sync:',e)}
    }
    if(changed)put(ENTRIES,{...p,[key]:list});
  }

  async function fetchIncremental(userId){
    if(!navigator.onLine)return;
    if(syncPromise)return syncPromise;
    syncPromise=(async()=>{
      const sb=cloud();if(!sb||!userId)return;
      const s='user:'+userId,p=parse(EVENTS),n=parse(ENTRIES);
      // Push local changes first, but never block the UI on these calls.
      await syncLocalEvents(userId,[...(p[s]||[]),...eventListFromLegacy(s)]);
      await syncLocalEntries(userId,[...(n[s]||[]),...entryListFromLegacy(s)]);

      // First successful sync: fetch existing cloud data. Later: fetch only new rows.
      const eLast=getMeta(s,'eventsCreatedAt'),gLast=getMeta(s,'guestsCreatedAt');
      let evRes,guRes;
      try{
        let q=sb.from('events').select('*').eq('user_id',userId).order('created_at',{ascending:true});
        if(eLast)q=q.gt('created_at',eLast); evRes=await q;
      }catch(e){console.warn('Cloud events read:',e)}
      try{
        let q=sb.from('guests').select('*').eq('user_id',userId).order('created_at',{ascending:true});
        if(gLast)q=q.gt('created_at',gLast); guRes=await q;
      }catch(e){console.warn('Cloud guests read:',e)}

      let changed=false;
      if(!evRes?.error){
        const rows=evRes.data||[], list=Array.isArray(p[s])?p[s]:[], map=new Map(list.map(x=>[idOf(x),x]));
        rows.forEach(x=>map.set(idOf(x),x));p[s]=Array.from(map.values()).sort((a,b)=>Date.parse(b.created_at||0)-Date.parse(a.created_at||0));put(EVENTS,p);
        if(rows.length||!eLast)setMeta(s,'eventsCreatedAt',new Date().toISOString());
        changed=changed||rows.length>0;
      } else console.warn('Cloud events read:',evRes.error.message);
      if(!guRes?.error){
        const rows=guRes.data||[], list=Array.isArray(n[s])?n[s]:[], map=new Map(list.map(x=>[entryId(x),x]));
        rows.forEach(x=>map.set(entryId(x),x));n[s]=Array.from(map.values()).sort((a,b)=>Date.parse(b.created_at||0)-Date.parse(a.created_at||0));put(ENTRIES,n);
        if(rows.length||!gLast)setMeta(s,'guestsCreatedAt',new Date().toISOString());
        changed=changed||rows.length>0;
      } else console.warn('Cloud guests read:',guRes.error.message);
      if(changed)notify('cloud');
    })().finally(()=>{syncPromise=null});
    return syncPromise;
  }

  async function getEvents(){
    const s=await scope(),p=parse(EVENTS),canonical=Array.isArray(p[s])?p[s]:[],legacy=eventListFromLegacy(s);
    const d=parse(DELETED),deleted=new Set(Array.isArray(d[s])?d[s].map(String):[]);
    const local=[...canonical,...legacy],seen=new Set(),out=[];
    for(const x of local){const id=idOf(x);if(!x||!id||seen.has(id)||deleted.has(id))continue;seen.add(id);out.push({...x,user_id:s.startsWith('user:')?s.slice(5):x.user_id,userId:s.startsWith('user:')?s.slice(5):x.userId})}
    if(s.startsWith('user:')){
      const uid=s.slice(5);
      // Cache-first: if data exists, return it immediately and sync in background.
      if(out.length){fetchIncremental(uid).catch(()=>{});return out;}
      await fetchIncremental(uid);
      const fresh=parse(EVENTS)[s]||[];return fresh.filter(x=>!deleted.has(idOf(x)));
    }
    return out;
  }

  async function getEntries(){
    const s=await scope(),p=parse(ENTRIES),canonical=Array.isArray(p[s])?p[s]:[],legacy=entryListFromLegacy(s),d=parse(DELETED),deleted=new Set(Array.isArray(d[s])?d[s].map(String):[]);
    const local=[...canonical,...legacy],seen=new Set(),out=[];
    const normalize=x=>({...x,event_id:String(x?.event_id||x?.eventId||'').trim(),eventId:String(x?.event_id||x?.eventId||'').trim()});
    for(const x of local){if(!x||typeof x!=='object')continue;const y=normalize(x),id=entryId(y),eid=y.event_id;if(!eid||deleted.has(eid))continue;const k=id?'id:'+id:'fp:'+eid+'|'+String(y.name||'').trim().toLowerCase()+'|'+String(y.amount||0)+'|'+String(y.created_at||'');if(seen.has(k))continue;seen.add(k);out.push({...y,user_id:s.startsWith('user:')?s.slice(5):y.user_id,userId:s.startsWith('user:')?s.slice(5):y.userId})}
    if(s.startsWith('user:')){
      const uid=s.slice(5);
      if(out.length){fetchIncremental(uid).catch(()=>{});return out;}
      await fetchIncremental(uid);
      const fresh=parse(ENTRIES)[s]||[];return fresh.map(normalize);
    }
    return out;
  }

  async function addEvent(event){
    const s=await scope();if(!event||typeof event!=='object')throw new Error('Invalid event');
    const id=idOf(event)||crypto.randomUUID(),rec={...event,id,user_id:s.startsWith('user:')?s.slice(5):'',userId:s.startsWith('user:')?s.slice(5):''};
    const p=parse(EVENTS),list=Array.isArray(p[s])?p[s]:[],i=list.findIndex(x=>idOf(x)===id);if(i>=0)list[i]={...list[i],...rec};else list.unshift(rec);p[s]=list.slice(0,500);put(EVENTS,p);
    if(s.startsWith('user:')){const k='sagunEventHistory_'+s.slice(5),old=arr(k),j=old.findIndex(x=>idOf(x)===id);if(j>=0)old[j]={...old[j],...rec};else old.unshift(rec);put(k,old.slice(0,500));syncLocalEvents(s.slice(5),[rec]).then(()=>notify('cloud')).catch(()=>{});}
    localStorage.setItem('currentEventId',id);localStorage.setItem('sgunmsActiveEvent',JSON.stringify(rec));return rec;
  }

  async function addEntry(entry){
    const s=await scope(),eid=String(entry?.event_id||entry?.eventId||localStorage.getItem('currentEventId')||'').trim();if(!eid)throw new Error('Entry cannot be saved without event_id');
    const id=entryId(entry)||crypto.randomUUID(),rec={...entry,id,user_id:s.startsWith('user:')?s.slice(5):'',userId:s.startsWith('user:')?s.slice(5):'',event_id:eid,eventId:eid,created_at:entry?.created_at||entry?.createdAt||new Date().toISOString()};
    const p=parse(ENTRIES),list=Array.isArray(p[s])?p[s]:[],i=list.findIndex(x=>entryId(x)===id);if(i>=0)list[i]={...list[i],...rec};else list.unshift(rec);p[s]=list.slice(0,10000);put(ENTRIES,p);
    if(s.startsWith('user:'))syncLocalEntries(s.slice(5),[rec]).then(()=>notify('cloud')).catch(()=>{});
    return rec;
  }

  async function deleteEvent(id){
    const s=await scope(),eid=String(id||'').trim();if(!eid)return false;
    const p=parse(EVENTS),n=parse(ENTRIES),d=parse(DELETED);p[s]=(p[s]||[]).filter(x=>idOf(x)!==eid);n[s]=(n[s]||[]).filter(x=>String(x?.event_id||x?.eventId||'')!==eid);d[s]=Array.from(new Set([...(d[s]||[]).map(String),eid])).slice(-1000);put(EVENTS,p);put(ENTRIES,n);put(DELETED,d);
    if(s.startsWith('user:')){try{const c=cloud();if(c&&navigator.onLine){await c.from('guests').delete().eq('user_id',s.slice(5)).eq('event_id',eid);await c.from('events').delete().eq('user_id',s.slice(5)).eq('id',eid)}}catch(e){console.warn('Cloud event delete:',e)}}
    notify('local');return true;
  }

  async function syncNow(){const u=await currentUser();if(!u)return false;await fetchIncremental(u.id);return true}
  window.addEventListener('online',()=>{currentUser().then(u=>{if(u)fetchIncremental(u.id).catch(()=>{})})});

  window.SagunStore={uid:scope,getEvents,getEntries,addEvent,addEntry,deleteEvent,migrate:async()=>true,
    eventsSync:(u)=>{const p=parse(EVENTS),s=u?('user:'+u):scopeSync();return Array.isArray(p[s])?p[s]:[]},
    entriesSync:(u)=>{const p=parse(ENTRIES),s=u?('user:'+u):scopeSync();return Array.isArray(p[s])?p[s]:[]},
    deletedEvents:async()=>{const s=await scope(),d=parse(DELETED);return Array.isArray(d[s])?d[s]:[]},
    syncNow,
    EVENTS_KEY:EVENTS,ENTRIES_KEY:ENTRIES};
})();
