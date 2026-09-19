(function(){
  let setup={};let entryType='cash';
  function parseSetup(){
    for(const key of ['eventSetupData','sagunSetup','offlineSetupData','currentEventSetup']){
      try{const d=JSON.parse(localStorage.getItem(key)||'null');if(d&&(d.event_type==='anniversary'||d.event_group==='anniversary'||d.wedding_type==='anniversary'))return d;}catch(e){}
    }return {};
  }
  function getDate(d){return d.anniversary_date||d.event_date||d.wedding_date||'';}
  function ordinal(n){const x=n%100;return n+((x>=11&&x<=13)?'th':n%10===1?'st':n%10===2?'nd':n%10===3?'rd':'th');}
  function count(date){if(!date)return '1st';const y=Number(String(date).slice(0,4));let n=new Date().getFullYear()-y;const start=new Date(date+'T00:00:00'),now=new Date();if(now<start)n--;return ordinal(Math.max(1,n));}
  function capitalizeWords(value){return String(value||'').replace(/\b([A-Za-z])([A-Za-z]*)\b/g,(_,a,b)=>a.toUpperCase()+b.toLowerCase());}
  function load(){setup=parseSetup();document.getElementById('husbandName').textContent=capitalizeWords(setup.husband_name||setup.groom_name||'पति का नाम');document.getElementById('wifeName').textContent=capitalizeWords(setup.wife_name||setup.bride_name||'पत्नी का नाम');document.getElementById('anniversaryCount').textContent=setup.anniversary_ordinal||count(getDate(setup));}
  window.openGuestEntry=function(){const m=document.getElementById('guestModal');m.classList.add('open');m.setAttribute('aria-hidden','false');setTimeout(()=>document.getElementById('guestName').focus(),80)};
  window.closeGuestEntry=function(){const m=document.getElementById('guestModal');m.classList.remove('open');m.setAttribute('aria-hidden','true')};
  window.setEntryType=function(type){entryType=type;document.getElementById('cashType').classList.toggle('active',type==='cash');document.getElementById('giftType').classList.toggle('active',type==='gift');document.getElementById('cashFields').classList.toggle('hidden',type!=='cash');document.getElementById('giftFields').classList.toggle('hidden',type!=='gift')};
  window.saveGuestEntry=async function(){
    const name=document.getElementById('guestName').value.trim();const village=document.getElementById('guestVillage').value.trim();const amount=Number(document.getElementById('cashAmount').value||0);const gift=document.getElementById('giftDescription').value.trim();const msg=document.getElementById('entryMessage');
    if(!name){msg.textContent='कृपया नाम दर्ज करें।';msg.style.color='#b21b2a';return}if(!village){msg.textContent='कृपया गाँव / शहर दर्ज करें।';msg.style.color='#b21b2a';return}if(entryType==='cash'&&amount<=0){msg.textContent='कृपया Cash राशि दर्ज करें।';msg.style.color='#b21b2a';return}if(entryType==='gift'&&!gift){msg.textContent='कृपया Gift का विवरण लिखें।';msg.style.color='#b21b2a';return}
    const record={id:(crypto.randomUUID ? crypto.randomUUID() : String(Date.now())+"-"+Math.random().toString(36).slice(2)),name,village,gift_type:entryType==='cash'?'Cash':'Gift',amount:entryType==='cash'?amount:0,gift_description:entryType==='gift'?gift:'',payment_mode:entryType==='cash'?'Cash':'Gift',event_type:'anniversary',event_person:setup.husband_name||setup.groom_name||'',event_person_2:setup.wife_name||setup.bride_name||'',event_date:getDate(setup),event_id:localStorage.getItem('currentEventId')||'',created_at:new Date().toISOString()};
    if(window.SagunStore) await window.SagunStore.addEntry(record,{cloud:true}); else { const list=JSON.parse(localStorage.getItem('eventEntries')||'[]'); list.unshift(record); localStorage.setItem('eventEntries',JSON.stringify(list)); }
    msg.textContent='✓ अतिथि की Entry सुरक्षित हो गई।';msg.style.color='#18733a';setTimeout(()=>{['guestName','guestVillage','cashAmount','giftDescription'].forEach(id=>document.getElementById(id).value='');msg.textContent='';closeGuestEntry()},800)
  };
  document.addEventListener('click',e=>{if(e.target.id==='guestModal')closeGuestEntry()});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeGuestEntry()});window.addEventListener('DOMContentLoaded',load);
})();
