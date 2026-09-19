/* Sagun local-first store: strict per-user/per-guest isolation. */
(function(){
  const EVENTS='sagun:events:v1', ENTRIES='sagun:entries:v1', DELETED='sagun:deleted-events:v1';
  const UID_KEY='sagunActiveUserId', MODE_KEY='sagunUserMode', GUEST_SESSION='sagunGuestSession';
  const SUPA_URL='https://rdlliurzgwwfjscgwssa.supabase.co';
  const SUPA_KEY='sb_publishable_HX1QmjO0SPyW3rUoihZkkQ_tRTE1bLc';
  const parse=k=>{try{const v=JSON.parse(localStorage.getItem(k)||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{};}catch(_){return{}}};
  const put=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch(_){return false}};
  const arr=k=>{try{const v=JSON.parse(localStorage.getItem(k)||'[]');return Array.isArray(v)?v:[];}catch(_){return[]}};
  function guestId(){try{const s=JSON.parse(localStorage.getItem(GUEST_SESSION)||'null');return String(s?.guestId||'').trim()}catch(_){return''}}
  function guestActive(){try{return !!(window.SagunGuest?.isGuest?.() && guestId())}catch(_){return false}}
  async function currentUser(){
    try{
      if(window.supabase?.createClient){
        const sb=window.supabase.createClient(SUPA_URL,SUPA_KEY,{auth:{persistSession:true,storageKey:'sgunms-auth-session'}});
        const r=await sb.auth.getUser(); const u=r?.data?.user;
        if(u?.id){localStorage.setItem(UID_KEY,u.id);localStorage.removeItem(MODE_KEY);return String(u.id)}
      }
    }catch(_){ }
    return '';
  }
  async function scope(){
    // Registered authentication ALWAYS wins. A stale guest flag cannot hijack it.
    const u=await currentUser(); if(u)return 'user:'+u;
    if(guestActive())return 'guest:'+guestId();
    const cached=String(localStorage.getItem(UID_KEY)||'').trim();
    if(cached && localStorage.getItem(MODE_KEY)!=='guest')return 'user:'+cached;
    return 'guest:'+('device_'+(String(localStorage.getItem('sgunmsGuestDeviceId')||'unknown')));
  }
  function scopeSync(){
    const cached=String(localStorage.getItem(UID_KEY)||'').trim();
    if(cached && localStorage.getItem(MODE_KEY)!=='guest')return 'user:'+cached;
    const gid=guestId(); if(gid && localStorage.getItem(MODE_KEY)==='guest')return 'guest:'+gid;
    return 'guest:'+('device_'+(String(localStorage.getItem('sgunmsGuestDeviceId')||'unknown')));
  }
  function idOf(x){return String(x?.id||x?.eventId||x?.event_id||x?.key||'').trim()}
  function entryId(x){return String(x?.id||x?.entry_id||'').trim()}
  function eventListFromLegacy(scopeKey){
    const uid=scopeKey.startsWith('user:')?scopeKey.slice(5):'';
    if(uid){
      const scoped=arr('sagunEventHistory_'+uid).filter(x=>String(x?.user_id||x?.userId||'')===uid);
      return scoped;
    }
    const gid=scopeKey.startsWith('guest:')?scopeKey.slice(6):'';
    if(gid){return arr('sagunEventHistory_'+gid)}
    return [];
  }
  function entryListFromLegacy(scopeKey){
    const uid=scopeKey.startsWith('user:')?scopeKey.slice(5):'';
    const keys=['offlineGuests','eventEntries','sagunEntries','birthdayEntries','birthdayGuests','guestEntries'];
    const all=keys.flatMap(arr);
    return all.filter(x=>{
      const owner=String(x?.user_id||x?.userId||x?.uid||x?.owner_id||x?.ownerId||'').trim();
      if(uid)return owner===uid;
      return false; // never import ownerless shared entries into a guest/account
    });
  }
  async function getEvents(){
    const s=await scope(), p=parse(EVENTS), canonical=Array.isArray(p[s])?p[s]:[];
    const legacy=eventListFromLegacy(s), out=[], seen=new Set();
    for(const x of [...canonical,...legacy]){if(!x||typeof x!=='object')continue;const id=idOf(x);if(!id||seen.has(id))continue;seen.add(id);out.push({...x,user_id:s.startsWith('user:')?s.slice(5):x.user_id,userId:s.startsWith('user:')?s.slice(5):x.userId})}
    const d=parse(DELETED), deleted=new Set(Array.isArray(d[s])?d[s].map(String):[]);
    return out.filter(x=>!deleted.has(idOf(x)));
  }
  async function getEntries(){
    const s=await scope(), p=parse(ENTRIES), canonical=Array.isArray(p[s])?p[s]:[];
    const legacy=entryListFromLegacy(s), out=[], seen=new Set();
    for(const x of [...canonical,...legacy]){if(!x||typeof x!=='object')continue;const id=entryId(x), eid=String(x?.event_id||x?.eventId||'').trim();if(!eid)continue;const k=id?'id:'+id:'fp:'+eid+'|'+JSON.stringify(x);if(seen.has(k))continue;seen.add(k);out.push({...x,user_id:s.startsWith('user:')?s.slice(5):x.user_id,userId:s.startsWith('user:')?s.slice(5):x.userId,event_id:eid,eventId:eid})}
    return out;
  }
  async function addEvent(event){
    const s=await scope(); if(!event||typeof event!=='object')throw new Error('Invalid event');
    const id=idOf(event)||crypto.randomUUID(), rec={...event,id,user_id:s.startsWith('user:')?s.slice(5):'',userId:s.startsWith('user:')?s.slice(5):''};
    const p=parse(EVENTS), list=Array.isArray(p[s])?p[s]:[], i=list.findIndex(x=>idOf(x)===id); if(i>=0)list[i]={...list[i],...rec};else list.unshift(rec);p[s]=list.slice(0,500);put(EVENTS,p);
    if(s.startsWith('user:')){const k='sagunEventHistory_'+s.slice(5), old=arr(k), j=old.findIndex(x=>idOf(x)===id);if(j>=0)old[j]={...old[j],...rec};else old.unshift(rec);put(k,old.slice(0,500));}
    localStorage.setItem('currentEventId',id);localStorage.setItem('sgunmsActiveEvent',JSON.stringify(rec));
    return rec;
  }
  async function addEntry(entry){
    const s=await scope(), eid=String(entry?.event_id||entry?.eventId||localStorage.getItem('currentEventId')||'').trim(); if(!eid)throw new Error('Entry cannot be saved without event_id');
    const id=entryId(entry)||crypto.randomUUID(), rec={...entry,id,user_id:s.startsWith('user:')?s.slice(5):'',userId:s.startsWith('user:')?s.slice(5):'',event_id:eid,eventId:eid};
    const p=parse(ENTRIES), list=Array.isArray(p[s])?p[s]:[], i=list.findIndex(x=>entryId(x)===id);if(i>=0)list[i]={...list[i],...rec};else list.unshift(rec);p[s]=list.slice(0,10000);put(ENTRIES,p);return rec;
  }
  async function deleteEvent(id){const s=await scope(), eid=String(id||'').trim();if(!eid)return false;const p=parse(EVENTS),n=parse(ENTRIES),d=parse(DELETED);p[s]=(p[s]||[]).filter(x=>idOf(x)!==eid);n[s]=(n[s]||[]).filter(x=>String(x?.event_id||x?.eventId||'')!==eid);d[s]=Array.from(new Set([...(d[s]||[]).map(String),eid])).slice(-1000);put(EVENTS,p);put(ENTRIES,n);put(DELETED,d);return true}
  window.SagunStore={uid:scope,getEvents,getEntries,addEvent,addEntry,deleteEvent,migrate:async()=>true,eventsSync:(u)=>{const p=parse(EVENTS),s=u?('user:'+u):scopeSync();return Array.isArray(p[s])?p[s]:[]},entriesSync:(u)=>{const p=parse(ENTRIES),s=u?('user:'+u):scopeSync();return Array.isArray(p[s])?p[s]:[]},deletedEvents:async()=>{const s=await scope(),d=parse(DELETED);return Array.isArray(d[s])?d[s]:[]},EVENTS_KEY:EVENTS,ENTRIES_KEY:ENTRIES};
})();
