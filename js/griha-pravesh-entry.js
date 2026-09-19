const sb=window.supabase.createClient("https://rdlliurzgwwfjscgwssa.supabase.co","sb_publishable_HX1QmjO0SPyW3rUoihZkkQ_tRTE1bLc");
const modal=document.getElementById('entryModal'),nameEl=document.getElementById('guestName'),villageEl=document.getElementById('guestVillage'),statusEl=document.getElementById('status');
function openEntry(){modal.classList.add('show');setTimeout(()=>nameEl.focus(),80)}
function closeEntry(){modal.classList.remove('show');statusEl.textContent=''}
// गृह प्रवेश शंख ध्वनि: पहली interaction पर शुरू होगी और हर 1 मिनट में बजेगी
const mangalAudio=document.getElementById('mangalAudio');
const soundControl=document.getElementById('soundControl');
let soundEnabled=true, soundTimer=null, soundStarted=false;

async function playShankh(){
  if(!soundEnabled)return;
  try{
    mangalAudio.currentTime=0;
    await mangalAudio.play();
  }catch(e){}
}
function startMangalDhwanि(){
  if(soundStarted || !soundEnabled)return;
  soundStarted=true;
  playShankh();
  soundTimer=setInterval(playShankh,60000);
}
function stopMangalDhwanि(){
  soundEnabled=false;
  soundStarted=false;
  if(soundTimer){clearInterval(soundTimer);soundTimer=null;}
  mangalAudio.pause();
  mangalAudio.currentTime=0;
  soundControl.textContent='🔇 ध्वनि चालू करें';
  soundControl.classList.add('off');
}
function enableMangalDhwanि(){
  soundEnabled=true;
  soundControl.textContent='🔊 ध्वनि बंद';
  soundControl.classList.remove('off');
  soundStarted=false;
  startMangalDhwanि();
}
soundControl.onclick=(e)=>{
  e.stopPropagation();
  if(soundEnabled) stopMangalDhwanि(); else enableMangalDhwanि();
};
document.getElementById('cancelBtn').onclick=closeEntry;
document.addEventListener('pointerdown',()=>startMangalDhwanि(),{once:true,passive:true});
modal.addEventListener('click',e=>{if(e.target===modal)closeEntry()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeEntry()});
async function saveGuest(){
 const name=nameEl.value.trim().toUpperCase(),village=villageEl.value.trim().toUpperCase();
 if(!name)return Swal.fire('त्रुटि','कृपया अतिथि का नाम दर्ज करें।','error');
 if(!village)return Swal.fire('त्रुटि','कृपया गाँव / शहर दर्ज करें।','error');
 let userId='offline-user';try{const {data:{user}}=await sb.auth.getUser();if(user)userId=user.id}catch(e){}
 const setup=(()=>{try{return JSON.parse(localStorage.getItem('eventSetupData')||localStorage.getItem('sagunSetup')||'{}')}catch(e){return {}}})();
 const record={user_id:userId,name,village,event_type:'griha_pravesh',event_id:localStorage.getItem('currentEventId')||'',eventId:localStorage.getItem('currentEventId')||'',event_date:setup.event_date||'',event_person:setup.name||setup.groom_name||'',event_person_2:setup.bride_name||'',timestamp:new Date().toISOString()};
 if(window.SagunStore) await window.SagunStore.addEntry(record); else {const local=JSON.parse(localStorage.getItem('offlineGuests')||'[]');local.push(record);localStorage.setItem('offlineGuests',JSON.stringify(local));}
 if(navigator.onLine){try{const res=await sb.from('guests').insert([record]);}catch(e){}}
 statusEl.textContent=name+' जी की Entry सुरक्षित हो गई।';nameEl.value='';villageEl.value='';nameEl.focus();
}
document.getElementById('saveBtn').onclick=saveGuest;
window.addEventListener('load',()=>document.getElementById('loader').classList.add('hidden'));
