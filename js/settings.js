(function(){
'use strict';
const PROFILE_KEY='sgunms_profile_v1';
const SUPA_URL='https://rdlliurzgwwfjscgwssa.supabase.co';
const SUPA_KEY='sb_publishable_HX1QmjO0SPyW3rUoihZkkQ_tRTE1bLc';
let deferredInstall=null;
const $=id=>document.getElementById(id);
let sb=null;
try{ if(window.supabase?.createClient) sb=window.supabase.createClient(SUPA_URL,SUPA_KEY); }catch(e){ console.warn('Supabase init:',e); }
async function loadProfile(){
  let p={}; try{p=JSON.parse(localStorage.getItem(PROFILE_KEY)||'{}')}catch(e){}
  let user=null;
  try{ if(sb){ const r=await sb.auth.getUser(); user=r?.data?.user||null; } }catch(e){}
  const meta=user?.user_metadata||{};
  const email=user?.email||'';
  const fallbackEmailName=email?email.split('@')[0]:'';
  const name=p.name||meta.full_name||meta.name||localStorage.getItem('userName')||fallbackEmailName||'Account User';
  $('userName').textContent=name;
  $('profileName').value=p.name||meta.full_name||meta.name||name;
  $('profileMobile').value=p.mobile||meta.phone||'';
  $('profilePlace').value=p.place||'';
  const guest=localStorage.getItem('guestMode')==='true'||localStorage.getItem('guestAuth')==='true';
  $('userMode').textContent=guest?'Guest / Local mode':(user?'Logged-in account':'Account / Local session');
  $('sessionText').textContent=guest?'Guest session active':(user?'Logged-in session active':'Session information available in this browser');
}
function openPanel(id, updateHash=true){
  const p=$(id);
  if(!p)return;
  document.querySelectorAll('.settings-panel').forEach(function(x){
    x.classList.remove('open');
    x.style.setProperty('display','none','important');
  });
  document.querySelectorAll('.settings-card').forEach(function(c){c.classList.remove('active');});
  p.classList.add('open');
  p.style.setProperty('display','block','important');
  const c=document.querySelector('[data-panel="'+id+'"]');
  if(c)c.classList.add('active');
  if(updateHash){
    const map={profilePanel:'profile',securityPanel:'data-security',syncPanel:'sync',pwaPanel:'pwa',guestDataPanel:'guest-data'};
    if(map[id]) history.replaceState(null,'','#'+map[id]);
  }
  p.scrollIntoView({behavior:'smooth',block:'start'});
}
document.querySelectorAll('.settings-card').forEach(function(c){
  c.addEventListener('click',function(e){
    e.preventDefault();
    if(window.openSettingsPanel) window.openSettingsPanel(c.dataset.panel);
    else openPanel(c.dataset.panel);
  });
});
document.querySelectorAll('.close-panel').forEach(function(b){
  b.addEventListener('click',function(){
    const p=b.closest('.settings-panel');
    if(p){
      p.style.setProperty('display','none','important');
      p.classList.remove('open');
    }
  });
});

$('saveProfile').addEventListener('click',()=>{const p={name:$('profileName').value.trim(),mobile:$('profileMobile').value.trim(),place:$('profilePlace').value.trim()};localStorage.setItem(PROFILE_KEY,JSON.stringify(p));$('userName').textContent=p.name||'Account User';$('profileStatus').textContent='✓ Saved';setTimeout(()=>$('profileStatus').textContent='',1800);});
$('settingsLogout').addEventListener('click',async()=>{if(confirm('क्या आप Logout करना चाहते हैं?')){try{if(sb)await sb.auth.signOut();}catch(e){}try{localStorage.removeItem('guestMode');localStorage.removeItem('guestAuth');}catch(e){}location.href='login.html';}});

async function getCurrentUser(){
  try{
    if(!sb) return null;
    const r=await sb.auth.getUser();
    return r?.data?.user||null;
  }catch(e){return null;}
}
function clearLocalEverything(){
  try{localStorage.clear();}catch(e){}
  try{sessionStorage.clear();}catch(e){}
}
async function deleteOwnedRows(userId){
  if(!sb||!userId) return [];
  const errors=[];
  // Delete application data by the authenticated user's owner id.
  // Do NOT query profiles.user_id: this project's profiles table uses id.
  const tables=['guests','shagun_entries','gifts','cash_transactions','cash_history','events','setup','families','family_members','relationships','event_members','reminders','activity_logs'];
  for(const table of tables){
    try{
      const r=await sb.from(table).delete().eq('user_id',userId);
      if(r.error){
        const msg=r.error.message||'';
        // Some optional/legacy tables may not exist. They should not block account deletion.
        if(!/does not exist|relation .* does not exist|Could not find the table/i.test(msg)) errors.push(table+': '+msg);
      }
    }catch(e){
      const msg=e?.message||String(e);
      if(!/does not exist|relation .* does not exist|Could not find the table/i.test(msg)) errors.push(table+': '+msg);
    }
  }
  // profiles is keyed by auth user id in this project, not profiles.user_id.
  try{
    const r=await sb.from('profiles').delete().eq('id',userId);
    if(r.error){
      const msg=r.error.message||'';
      if(!/does not exist|relation .* does not exist|Could not find the table/i.test(msg)) errors.push('profiles: '+msg);
    }
  }catch(e){
    const msg=e?.message||String(e);
    if(!/does not exist|relation .* does not exist|Could not find the table/i.test(msg)) errors.push('profiles: '+msg);
  }
  return errors;
}
async function tryServerAccountDeletion(userId){
  // Optional Edge Function: when deployed, it can securely delete the Supabase Auth user.
  // Browser code must never contain a service-role key.
  if(!sb||!userId) return {available:false,deleted:false};
  try{
    const {data:{session}}=await sb.auth.getSession();
    if(!session?.access_token) return {available:false,deleted:false};
    const res=await fetch(SUPA_URL+'/functions/v1/delete-account',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},body:JSON.stringify({user_id:userId})});
    if(!res.ok) return {available:false,deleted:false};
    const body=await res.json().catch(()=>({}));
    return {available:true,deleted:body.deleted!==false};
  }catch(e){return {available:false,deleted:false};}
}
$('deleteAccount').addEventListener('click',async()=>{
  const guest=localStorage.getItem('guestMode')==='true'||localStorage.getItem('guestAuth')==='true';
  if(guest){
    alert('Guest account के लिए “Delete Guest Details” विकल्प इस्तेमाल करें।');
    return;
  }
  const user=await getCurrentUser();
  if(!user){
    alert('Active account session नहीं मिला। पहले login करें।');
    return;
  }
  const ok=confirm('⚠️ DELETE ACCOUNT\n\nआपका profile, Events, Guest Entries, Cash/UPI records और account data permanently delete किया जाएगा।\n\nयह action वापस नहीं किया जा सकता।\n\nक्या आप आगे बढ़ना चाहते हैं?');
  if(!ok)return;
  const ok2=confirm('🚨 FINAL CONFIRMATION\n\nDelete Account करने के बाद आपका saved data वापस नहीं आएगा।\n\nक्या सच में Delete Account करना है?');
  if(!ok2)return;
  const btn=$('deleteAccount'); btn.disabled=true; btn.textContent='Deleting…'; $('accountDeleteStatus').textContent='Account data delete किया जा रहा है…';
  try{
    // First try secure server-side Auth deletion, if the project has the optional function.
    const authDeletion=await tryServerAccountDeletion(user.id);
    // Delete all application rows allowed by the logged-in user's RLS policies.
    const errors=await deleteOwnedRows(user.id);
    clearLocalEverything();
    try{if(sb)await sb.auth.signOut({scope:'local'});}catch(e){}
    if(authDeletion.deleted){
      alert('✅ आपका account और उससे जुड़ा पूरा data delete कर दिया गया है।');
    }else if(errors.length===0){
      alert('✅ आपका profile, Events, Entries और local data delete कर दिया गया है।\n\nAuth account को पूरी तरह delete करने के लिए Supabase में secure delete-account Edge Function enable होना चाहिए।');
    }else{
      alert('⚠️ Local/app data delete कर दिया गया है, लेकिन कुछ cloud records delete नहीं हो सके।\n\n'+errors.join('\n'));
    }
    location.href='login.html';
  }catch(e){
    console.error(e); btn.disabled=false; btn.textContent='🗑️ Delete Account'; $('accountDeleteStatus').textContent='✕ Delete failed'; alert('Account delete करते समय समस्या हुई: '+(e.message||e));
  }
});
function collect(){const data={version:1,createdAt:new Date().toISOString(),storage:{}};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k)try{data.storage[k]=JSON.parse(localStorage.getItem(k));}catch(e){data.storage[k]=localStorage.getItem(k)}}return data;}
$('exportData').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(collect(),null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='SGUNMS-Backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();URL.revokeObjectURL(a.href);$('syncStatus').textContent='✓ Backup तैयार है';});
$('importData').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);if(!d.storage)throw new Error('Invalid backup');Object.entries(d.storage).forEach(([k,v])=>localStorage.setItem(k,typeof v==='string'?v:JSON.stringify(v)));$('syncStatus').textContent='✓ Restore हो गया। Home/Reports refresh करें।';loadProfile();}catch(err){$('syncStatus').textContent='✕ Backup file सही नहीं है';}};r.readAsText(f);});
$('clearLocal').addEventListener('click',()=>{if(confirm('Local data साफ करना है? यह browser में रखा data हटा सकता है। पहले Backup ले लें।')){const keep=[PROFILE_KEY,'guestDeviceId','guestAuthStartedAt'];const all=[];for(let i=0;i<localStorage.length;i++)all.push(localStorage.key(i));all.forEach(k=>{if(!keep.includes(k))localStorage.removeItem(k)});$('syncStatus').textContent='✓ Local data साफ किया गया';loadProfile();}});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;$('pwaStatus').textContent='✓ यह device PWA install कर सकता है';});
$('installPwa').addEventListener('click',async()=>{if(!deferredInstall){$('pwaStatus').textContent='इस browser/device पर Install option अभी उपलब्ध नहीं है।';return;}deferredInstall.prompt();const r=await deferredInstall.userChoice;$('pwaStatus').textContent=r.outcome==='accepted'?'✓ SGUNMS install शुरू हो गया':'Install cancel किया गया';deferredInstall=null;});
window.addEventListener('appinstalled',()=>{$('pwaStatus').textContent='✓ SGUNMS installed';deferredInstall=null;});
loadProfile();
// Open the requested settings panel when coming from the Home profile menu.
try{
  const hash=(location.hash||'').replace(/^#/,'');
  const map={profile:'profilePanel','data-security':'securityPanel','sync:'syncPanel','pwa:'pwaPanel'};
  const panelId=map[hash];
  if(panelId) setTimeout(()=>openPanel(panelId),0);
}catch(e){}
})();
