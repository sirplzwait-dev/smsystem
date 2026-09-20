/* Home dashboard support. Event/entry rendering is owned by the canonical
   SagunStore renderer embedded in home.html. This file must not render a second
   Event list or calculate a second set of totals. */
const SAGUN_HOME_URL="https://rdlliurzgwwfjscgwssa.supabase.co";
const SAGUN_HOME_KEY="sb_publishable_HX1QmjO0SPyW3rUoihZkkQ_tRTE1bLc";
const sagunHomeClient=window.supabase?.createClient
  ? window.supabase.createClient(SAGUN_HOME_URL,SAGUN_HOME_KEY) : null;

function homeSearch(value){
  const q=String(value||'').trim().toLowerCase();
  document.querySelectorAll('#dynamicHomeEvents .event-card-premium').forEach(card=>{
    card.style.display=(!q || (card.textContent||'').toLowerCase().includes(q)) ? '' : 'flex';
  });
}

function getCachedHomeName(){
  try{
    const guest = localStorage.getItem('guestMode')==='true' || localStorage.getItem('guestAuth')==='true' || localStorage.getItem('sagunUserMode')==='guest';
    if(guest) return 'Guest';
    const raw = localStorage.getItem('sgunms_profile_v1');
    if(raw){
      const p=JSON.parse(raw);
      if(p?.name && String(p.name).trim()) return String(p.name).trim();
    }
    const direct=localStorage.getItem('userName');
    if(direct && String(direct).trim() && !String(direct).includes('@')) return String(direct).trim();
  }catch(_){}
  return '';
}

function cleanDisplayName(name){
  return String(name||'').trim().replace(/\s+(?:Ji)+$/i,'').trim();
}

function paintHomeName(name){
  const n=cleanDisplayName(name) || 'User';
  const el=document.querySelector('.userName');
  if(el) el.textContent='👤 '+n+' Ji';
  const welcome=document.getElementById('homeWelcomeName');
  if(welcome) welcome.textContent=n+' Ji';
}

// Paint the locally saved profile name immediately; network auth runs in background.
(function(){
  const cached=getCachedHomeName();
  if(cached) paintHomeName(cached);
})();

async function loadUserProfile(){
  try{
    if(!sagunHomeClient) return;
    const {data:{user}}=await sagunHomeClient.auth.getUser();
    if(!user){ paintHomeName('Guest'); return; }
    localStorage.setItem('sagunActiveUserId',user.id);

    // Keep the UI responsive: cached profile is already painted above.
    let displayName='';
    try{
      const {data}=await sagunHomeClient.from('profiles').select('name').eq('id',user.id).maybeSingle();
      if(data?.name) displayName=String(data.name).trim();
      if(!displayName){
        const r=await sagunHomeClient.from('profiles').select('name').eq('user_id',user.id).maybeSingle();
        if(r.data?.name) displayName=String(r.data.name).trim();
      }
    }catch(_){}
    if(!displayName){
      const meta=user.user_metadata||{};
      displayName=String(meta.full_name||meta.name||meta.display_name||'').trim();
    }
    // Never use username/email as the displayed name.
    if(displayName){
      try{ localStorage.setItem('sgunms_profile_v1',JSON.stringify({name:displayName})); }catch(_){}
      paintHomeName(displayName);
    }
  }catch(e){ console.log('Home profile:',e); }
}


/* Kept for compatibility with older inline calls. They intentionally do not
   touch Event/Entry totals, which are calculated by home.html from SagunStore. */
async function loadDashboard(){ return true; }
async function loadGuestDashboard(){ return true; }
async function loadSagunEvents(){ return true; }
async function loadEventWiseDashboard(){ return true; }
async function loadGuests(){ return true; }
async function loadCashBook(){ return true; }
async function loadRecent(){ return true; }

window.addEventListener('load',()=>{ loadUserProfile(); });
