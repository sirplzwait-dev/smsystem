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

async function loadUserProfile(){
  try{
    if(!sagunHomeClient)return;
    const {data:{user}}=await sagunHomeClient.auth.getUser();
    if(!user)return;
    localStorage.setItem('sagunActiveUserId',user.id);
    let displayName=user.email ? user.email.split('@')[0] : 'User';
    try{
      const {data}=await sagunHomeClient.from('profiles').select('name').eq('id',user.id).maybeSingle();
      if(data?.name) displayName=data.name;
      else{
        const r=await sagunHomeClient.from('profiles').select('name').eq('user_id',user.id).maybeSingle();
        if(r.data?.name) displayName=r.data.name;
      }
    }catch(_){}
    const el=document.querySelector('.userName');
    if(el) el.textContent=displayName;
    const welcome=document.getElementById('homeWelcomeName');
    if(welcome) welcome.textContent=displayName;
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
