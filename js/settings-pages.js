(function(){
'use strict';
const PROFILE_KEY='sgunms_profile_v1';
const SUPA_URL='https://rdlliurzgwwfjscgwssa.supabase.co';
const SUPA_KEY='sb_publishable_HX1QmjO0SPyW3rUoihZkkQ_tRTE1bLc';
const $=id=>document.getElementById(id);
let sb=null,deferredInstall=null;
try{if(window.supabase?.createClient) sb=window.supabase.createClient(SUPA_URL,SUPA_KEY)}catch(e){}

function getLocalProfile(){try{return JSON.parse(localStorage.getItem(PROFILE_KEY)||'{}')}catch(e){return {}}}
async function getUser(){try{if(!sb)return null;const r=await sb.auth.getUser();return r?.data?.user||null}catch(e){return null}}

async function initProfile(){
 const p=getLocalProfile(),guest=localStorage.getItem('guestMode')==='true'||localStorage.getItem('guestAuth')==='true';
 $('profileName').value=p.name||'';$('profileMobile').value=p.mobile||'';$('profilePlace').value=p.place||'';
 $('profileDisplayName').textContent=(p.name||'').trim()||(guest?'Guest':'Account User');
 $('profileMode').textContent=guest?'Guest / Local mode':'Account / Local session';
 const cache=(()=>{try{return JSON.parse(localStorage.getItem('sgunms_user_cache_v1')||'{}')}catch(e){return {}}})();
 if(!p.name && cache.name){$('profileName').value=cache.name;$('profileDisplayName').textContent=cache.name}
 $('saveProfile').onclick=async()=>{
   const next={name:$('profileName').value.trim(),mobile:$('profileMobile').value.trim(),place:$('profilePlace').value.trim()};
   // Save locally first so every next page opens instantly.
   localStorage.setItem(PROFILE_KEY,JSON.stringify(next));
   try{localStorage.setItem('sgunms_user_cache_v1',JSON.stringify({...next,updatedAt:Date.now()}))}catch(e){}
   $('profileDisplayName').textContent=next.name||'Account User';
   $('profileStatus').textContent='✓ Profile saved locally';

   // Sync to Supabase in the background; UI never waits for this.
   setTimeout(async()=>{
     try{
       const u=await getUser();
       if(!u||!sb) return;
       try{ await sb.from('profiles').upsert({id:u.id,name:next.name,mobile:next.mobile,place:next.place},{onConflict:'id'}); }catch(e){}
       try{ await sb.auth.updateUser({data:{full_name:next.name}}); }catch(e){}
     }catch(e){}
   },0);

   setTimeout(()=>$('profileStatus').textContent='✓ Synced in background',700);
   setTimeout(()=>$('profileStatus').textContent='',2200);
 };
}

async function initSecurity(){
 const guest=localStorage.getItem('guestMode')==='true'||localStorage.getItem('guestAuth')==='true';
 const user=await getUser();
 $('sessionText').textContent=guest?'Guest session active':(user?'Logged-in session active':'No active account session');
 $('securityAccount').textContent=guest?'Guest / Local':(user?.email||'Account');
 $('settingsLogout').onclick=async()=>{
   if(!confirm('क्या आप Logout करना चाहते हैं?'))return;
   try{if(sb)await sb.auth.signOut()}catch(e){}
   try{localStorage.removeItem('guestMode');localStorage.removeItem('guestAuth')}catch(e){}
   location.href='login.html';
 };
}

function collect(){
 const data={version:1,createdAt:new Date().toISOString(),storage:{}};
 for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k)try{data.storage[k]=JSON.parse(localStorage.getItem(k))}catch(e){data.storage[k]=localStorage.getItem(k)}}
 return data;
}
function initSync(){
 $('exportData').onclick=()=>{
   const blob=new Blob([JSON.stringify(collect(),null,2)],{type:'application/json'});
   const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='SGUNMS-Backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();URL.revokeObjectURL(a.href);
   $('syncStatus').textContent='✓ Backup तैयार है';
 };
 $('importData').onchange=e=>{
   const f=e.target.files?.[0];if(!f)return;
   const r=new FileReader();r.onload=()=>{
     try{const d=JSON.parse(r.result);if(!d.storage)throw new Error('Invalid backup');
       Object.entries(d.storage).forEach(([k,v])=>localStorage.setItem(k,typeof v==='string'?v:JSON.stringify(v)));
       $('syncStatus').textContent='✓ Restore हो गया।';
     }catch(err){$('syncStatus').textContent='✕ Backup file सही नहीं है'}
   };r.readAsText(f);
 };
 $('clearLocal').onclick=()=>{
   if(!confirm('Local data साफ करना है? पहले Backup ले लें।'))return;
   const keep=[PROFILE_KEY,'guestDeviceId','guestAuthStartedAt'],keys=[];
   for(let i=0;i<localStorage.length;i++)keys.push(localStorage.key(i));
   keys.forEach(k=>{if(!keep.includes(k))localStorage.removeItem(k)});
   $('syncStatus').textContent='✓ Local data साफ किया गया';
 };
}

function initPwa(){
 window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;$('pwaStatus').textContent='✓ यह device PWA install कर सकता है'});
 $('installPwa').onclick=async()=>{
   if(!deferredInstall){$('pwaStatus').textContent='इस browser/device पर Install option अभी उपलब्ध नहीं है।';return}
   deferredInstall.prompt();const r=await deferredInstall.userChoice;$('pwaStatus').textContent=r.outcome==='accepted'?'✓ SGUNMS install शुरू हो गया':'Install cancel किया गया';deferredInstall=null;
 };
 window.addEventListener('appinstalled',()=>{$('pwaStatus').textContent='✓ SGUNMS installed';deferredInstall=null});
}

async function deleteGuest(){
 const guest=localStorage.getItem('guestMode')==='true'||localStorage.getItem('guestAuth')==='true';
 const btn=$('deleteGuestDetails');
 if(!guest){btn.disabled=true;btn.textContent='🗑️ केवल Guest mode में उपलब्ध';$('guestDeleteStatus').textContent='यह विकल्प केवल Guest mode के लिए है।';return}
 btn.onclick=async()=>{
   const ok=confirm('⚠️ WARNING\n\nGuest का पूरा data delete होने वाला है।\n\nक्या आप आगे बढ़ना चाहते हैं?');if(!ok)return;
   const ok2=confirm('🚨 FINAL CONFIRMATION\n\nDelete करने के बाद Guest data वापस नहीं आएगा।\n\nक्या Delete करना है?');if(!ok2)return;
   btn.disabled=true;
   try{
     localStorage.clear();try{sessionStorage.clear()}catch(e){}
     if(indexedDB.databases){const dbs=await indexedDB.databases();await Promise.all((dbs||[]).filter(x=>x?.name).map(x=>new Promise(r=>{try{const q=indexedDB.deleteDatabase(x.name);q.onsuccess=q.onerror=q.onblocked=()=>r()}catch(e){r()}})))}
     if(window.caches){const names=await caches.keys();await Promise.all(names.map(n=>caches.delete(n)))}
     if(navigator.serviceWorker){const regs=await navigator.serviceWorker.getRegistrations();await Promise.all(regs.map(r=>r.unregister()))}
     alert('✅ Guest का पूरा local data delete कर दिया गया है।');location.href='login.html';
   }catch(e){btn.disabled=false;btn.textContent='🗑️ Delete Guest Details';alert('कुछ data delete नहीं हो सका।')}
 };
}

document.addEventListener('DOMContentLoaded',()=>{
 const f=location.pathname.split('/').pop().toLowerCase();
 if(f==='profile.html')initProfile();
 if(f==='security.html')initSecurity();
 if(f==='data-sync.html')initSync();
 if(f==='pwa.html')initPwa();
 if(f==='delete-guest.html')deleteGuest();
});
})();