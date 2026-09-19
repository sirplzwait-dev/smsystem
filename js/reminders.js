(function(){'use strict';
const KEY='sgunmsRemindersV2'; const FAMILY_KEY='sgunmsFamilyDataV1';
function userScope(){
  const uid=String(localStorage.getItem('sagunActiveUserId')||'').trim();
  return uid || 'guest';
}
function scopedKey(key){return key+'_'+userScope()}
const TYPES=[
 ['birthday','🎂','Birthday','परिवार के सदस्य का जन्मदिन'],['anniversary','💍','Anniversary','शादी की सालगिरह'],['engagement_anniversary','💑','Engagement Anniversary','सगाई की सालगिरह'],['death_anniversary','🕯️','पुण्यतिथि','दिवंगत परिवारजन की पुण्यतिथि'],['birth','👶','Birth','बच्चे के जन्म की याद'],['griha_pravesh','🏠','Griha Pravesh','गृह प्रवेश की सालगिरह'],['wedding','💒','Wedding','शादी की तारीख'],['tilak','🎉','Tilak','तिलक कार्यक्रम की तारीख'],['baraat','🥁','Baraat','बारात की तारीख'],['reception','🍽️','Reception','रिसेप्शन की तारीख'],['sagun','🎁','Sagun','सगुन देने/लेने की याद'],['exam_school','📚','Exam/School','बच्चों की परीक्षा या स्कूल'],['appointment','🏥','Appointment','डॉक्टर/अन्य अपॉइंटमेंट'],['travel','✈️','Travel','यात्रा की तारीख'],['custom','📅','Custom Reminder','अपना कोई भी Reminder']
];
let items=load();
function load(){try{return JSON.parse(localStorage.getItem(scopedKey(KEY)))||[]}catch(e){return[]}}
function save(){localStorage.setItem(scopedKey(KEY),JSON.stringify(items))}
function esc(v){return String(v??'').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[s]))}
function uid(){return 'rem_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7)}
function toast(m){const x=document.getElementById('toast');x.textContent=m;x.classList.add('show');setTimeout(()=>x.classList.remove('show'),2200)}
function family(){try{return JSON.parse(localStorage.getItem(scopedKey(FAMILY_KEY)))||{members:[]}}catch(e){return{members:[]}}}
function typeInfo(t){return TYPES.find(x=>x[0]===t)||TYPES[TYPES.length-1]}
function dateOnly(d){const x=new Date(d);return new Date(x.getFullYear(),x.getMonth(),x.getDate())}
function parseDate(v){if(!v)return null; const s=String(v); if(/^\d{4}-\d{2}-\d{2}$/.test(s)){const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)} return null}
function nextOccurrence(date,yearly){const d0=parseDate(date);if(!d0)return null;if(!yearly)return d0;const now=new Date();let d=new Date(now.getFullYear(),d0.getMonth(),d0.getDate());if(d<dateOnly(now))d=new Date(now.getFullYear()+1,d0.getMonth(),d0.getDate());return d}
function daysFromToday(d){return Math.round((dateOnly(d)-dateOnly(new Date()))/86400000)}
function familyReminders(){const f=family(),out=[];(f.members||[]).forEach(m=>{if(m.birthday)out.push({id:'family-b-'+m.id,type:'birthday',title:(m.name||'सदस्य')+' का जन्मदिन',date:'2000-'+String(m.birthday).replace(/^.*?(\d{2}-\d{2})$/,'$1'),yearly:true,allDay:true,source:'family',sourceId:m.id,memberName:m.name});if(m.anniversary)out.push({id:'family-a-'+m.id,type:'anniversary',title:(m.name||'सदस्य')+' की सालगिरह',date:'2000-'+String(m.anniversary).replace(/^.*?(\d{2}-\d{2})$/,'$1'),yearly:true,allDay:true,source:'family',sourceId:m.id,memberName:m.name});});return out}
function eventHistory(){const keys=['sagunEventHistory','sgunmsEvents','eventHistory','events'];const out=[];keys.forEach(k=>{try{const v=JSON.parse(localStorage.getItem(k));if(!Array.isArray(v))return;v.forEach(e=>{const date=e.date||e.eventDate||e.startDate||e.event_date;if(!date)return;const type=String(e.type||e.eventType||e.event_type||'custom').toLowerCase().replace(/\s+/g,'_');const found=TYPES.some(t=>t[0]===type)?type:'custom';out.push({id:'event-'+k+'-'+(e.id||e.eventId||Math.random()),type:found,title:e.eventName||e.name||e.title||typeInfo(found)[2],date:String(date).slice(0,10),yearly:!!e.yearly,allDay:true,source:'event'});});}catch(e){}});return out}
function merged(){const map=new Map();familyReminders().forEach(x=>map.set(x.id,x));eventHistory().forEach(x=>map.set(x.id,x));items.forEach(x=>map.set(x.id,x));return [...map.values()]}
function sortByNextDate(arr){return arr.sort((a,b)=>{const ad=a.occ?.getTime?.()??Infinity,bd=b.occ?.getTime?.()??Infinity;return ad-bd || String(a.title||'').localeCompare(String(b.title||''),'hi')})}
function renderTypeCards(){const el=document.getElementById('typeGrid');if(!el)return;const all=merged();el.innerHTML=TYPES.map(t=>{const count=all.filter(x=>x.type===t[0]).length;return `<button class="type-card" data-type="${t[0]}"><div class="icon">${t[1]}</div><div class="type-count">${count}</div><h3>${t[2]}</h3><p>${t[3]}</p><span class="click-hint">देखने / जोड़ने के लिए क्लिक करें ›</span></button>`}).join('')}
function renderFamilyGroups(){const box=document.getElementById('familyRemindersList');if(!box)return;const f=familyReminders().map(x=>({...x,occ:nextOccurrence(x.date,true)}));const b=f.filter(x=>x.type==='birthday').sort((a,b)=>(a.occ?.getTime?.()??Infinity)-(b.occ?.getTime?.()??Infinity)),a=f.filter(x=>x.type==='anniversary').sort((a,b)=>(a.occ?.getTime?.()??Infinity)-(b.occ?.getTime?.()??Infinity));const group=(title,icon,arr)=>`<section class="family-group"><div class="group-head"><div><h3>${icon} ${title}</h3><p>Family से automatic</p></div><span class="family-auto-badge">🔗 Family</span></div><div class="group-list">${arr.length?arr.map(x=>{const n=daysFromToday(x.occ);const when=n===0?'आज':n===1?'1 day left':n>1?`${n} days left`:`${Math.abs(n)} दिन पहले`;return `<article class="family-item"><div class="family-avatar">${icon}</div><div class="family-info"><strong>${esc(x.memberName)}</strong><div class="muted">📅 ${x.occ.toLocaleDateString('hi-IN',{day:'2-digit',month:'long'})} • ${when}</div></div><span class="family-view-only">Family Member</span></article>`}).join(''):'<div class="empty">Family में अभी कोई तारीख नहीं है।</div>'}</div></section>`;box.innerHTML=group('Birthday','🎂',b)+group('Anniversary','💍',a)}
function upcoming7(){return merged().map(x=>({...x,occ:nextOccurrence(x.date,x.yearly)})).filter(x=>x.occ&&daysFromToday(x.occ)>=0&&daysFromToday(x.occ)<=7&&!x.done).sort((a,b)=>a.occ-b.occ)}
function renderUpcoming(){const el=document.getElementById('upcomingList');if(!el)return;const arr=upcoming7();document.getElementById('upcomingCount').textContent=arr.length;el.innerHTML=arr.length?arr.map(x=>{const n=daysFromToday(x.occ);const when=n===0?'आज':n===1?'1 day left':`${n} days left`;return `<article class="upcoming-card"><div class="up-icon">${typeInfo(x.type)[1]}</div><div class="up-main"><strong>${esc(x.title)}</strong><span>${typeInfo(x.type)[2]}</span></div><b class="left-badge">${when}</b></article>`}).join(''):'<div class="empty">अगले 7 दिनों में कोई Reminder नहीं है।</div>'}
function renderToday(){const arr=upcoming7();const today=arr.filter(x=>daysFromToday(x.occ)===0);document.getElementById('todayCount').textContent=today.length;document.getElementById('todayList').innerHTML=today.length?today.map(x=>`<article class="today-card">${typeInfo(x.type)[1]} <strong>${esc(x.title)}</strong><div class="today-meta">आज • ${x.allDay?'पूरा दिन':(x.time||'समय नहीं दिया')}</div></article>`).join(''):'<div class="empty">आज कोई Reminder नहीं है।</div>'}
function renderGroup(type){const el=document.getElementById('groupDetail');if(!el)return;document.querySelectorAll('.type-card,.clickable-stat').forEach(x=>x.classList.toggle('selected',x.dataset.type===type||x.dataset.statType===type));const arr=merged().filter(x=>x.type===type).map(x=>({...x,occ:nextOccurrence(x.date,x.yearly)})).filter(x=>x.occ).sort((a,b)=>a.occ-b.occ);const t=typeInfo(type);el.hidden=false;el.innerHTML=`<div class="group-detail-head"><div><h2>${t[1]} ${t[2]}</h2><p>${t[3]}</p></div><button class="primary-btn" id="groupAddBtn">＋ ${t[2]} Reminder जोड़ें</button></div><div class="group-detail-list">${arr.length?arr.map(x=>{const n=daysFromToday(x.occ);const when=n===0?'आज':n===1?'1 day left':n>1?`${n} days left`:`${Math.abs(n)} दिन पहले`;return `<article class="detail-row"><div class="icon">${t[1]}</div><div><strong>${esc(x.title)}</strong><div class="muted">📅 ${x.occ.toLocaleDateString('hi-IN',{day:'2-digit',month:'long',year:'numeric'})} • ${when}${x.source==='family'?' • Family':''}</div></div>${x.source==='family'?'<span class="source-tag family-source">Family</span>':x.source==='event'?'<span class="source-tag">Event</span>':`<div class="actions"><button class="mini" data-edit="${x.id}">✏️ Edit</button><button class="mini" data-del="${x.id}">🗑</button><button class="mini" data-done="${x.id}">✅ Done</button></div>`}</article>`}).join(''):'<div class="empty">इस category में अभी कोई entry नहीं है। नीचे दिए button से जोड़ें।</div>'}</div>`;document.getElementById('groupAddBtn').onclick=()=>openModal(type);requestAnimationFrame(()=>el.scrollIntoView({behavior:'smooth',block:'start'}))}
function renderAll(){renderTypeCards();renderFamilyGroups();renderUpcoming();renderToday();}
function render(){renderAll()}
function openModal(type,id){const modal=document.getElementById('remModal');document.getElementById('remForm').reset();document.getElementById('remId').value='';setupTimeOptions();document.getElementById('modalTitle').textContent='Reminder जोड़ें';document.getElementById('remType').innerHTML=TYPES.map(t=>`<option value="${t[0]}">${t[1]} ${t[2]}</option>`).join('');document.getElementById('remType').value=type||'custom';if(id){const x=items.find(a=>a.id===id);if(!x)return;document.getElementById('modalTitle').textContent='Reminder Edit करें';document.getElementById('remId').value=x.id;document.getElementById('remType').value=x.type;document.getElementById('remTitle').value=x.title||'';document.getElementById('remDate').value=x.date||'';document.getElementById('remTime').value=x.time||'';document.getElementById('remAlert').value=x.alert||'0';document.getElementById('remNotes').value=x.notes||'';document.getElementById('allDay').checked=x.allDay!==false;document.getElementById('repeatYearly').checked=!!x.yearly;
if(x.allDay!==false){document.getElementById('allDay').checked=true;document.getElementById('timeOptions')?.querySelectorAll('.time-option').forEach(b=>b.classList.toggle('active',b.dataset.time==='all'));document.getElementById('remTime').disabled=true;}else{document.getElementById('allDay').checked=false;document.getElementById('remTime').disabled=false;}
document.getElementById('browserNotify').checked=!!x.browserNotify;document.getElementById('whatsappNotify').checked=!!x.whatsappNotify;document.getElementById('customAlert').value=x.customAlert||''}document.getElementById('customAlertBox').hidden=document.getElementById('remAlert').value!=='custom';modal.hidden=false}
function closeModal(){document.getElementById('remModal').hidden=true}
async function requestNotify(){if(!('Notification'in window))return false;try{if(Notification.permission==='granted')return true;return(await Notification.requestPermission())==='granted'}catch(e){return false}}
function setupTimeOptions(){
 const box=document.getElementById('timeOptions'), input=document.getElementById('remTime'), all=document.getElementById('allDay');
 if(!box||!input||!all||box.dataset.ready==='1') return; box.dataset.ready='1';
 const presets={morning:'09:00',afternoon:'14:00',evening:'18:00',night:'21:00'};
 function setMode(mode){
   box.querySelectorAll('.time-option').forEach(b=>b.classList.toggle('active',b.dataset.time===mode));
   if(mode==='all'){all.checked=true; input.value=''; input.disabled=true;}
   else {all.checked=false; input.disabled=false; input.value=presets[mode]||input.value||'09:00';}
 }
 box.addEventListener('click',e=>{const b=e.target.closest('.time-option');if(b)setMode(b.dataset.time);});
 all.addEventListener('change',()=>setMode(all.checked?'all':'morning'));
 input.addEventListener('input',()=>{if(input.value){all.checked=false;box.querySelectorAll('.time-option').forEach(b=>b.classList.remove('active'));}});
 setMode('all');
}

document.addEventListener('DOMContentLoaded',()=>{setupTimeOptions();render();document.getElementById('addReminderBtn').onclick=()=>openModal();document.getElementById('typeGrid').onclick=e=>{const b=e.target.closest('[data-type]');if(b){renderGroup(b.dataset.type);}};document.querySelector('.stats-grid').onclick=e=>{const b=e.target.closest('[data-stat-type]');if(b){renderGroup(b.dataset.statType);}};document.querySelectorAll('[data-close]').forEach(b=>b.onclick=closeModal);document.getElementById('remAlert').onchange=e=>document.getElementById('customAlertBox').hidden=e.target.value!=='custom';document.getElementById('remForm').onsubmit=async e=>{e.preventDefault();const rid=document.getElementById('remId').value;const data={id:rid||uid(),type:document.getElementById('remType').value,title:document.getElementById('remTitle').value.trim(),date:document.getElementById('remDate').value,time:document.getElementById('remTime').value,allDay:document.getElementById('allDay').checked,alert:document.getElementById('remAlert').value,customAlert:document.getElementById('customAlert').value,yearly:document.getElementById('repeatYearly').checked,notes:document.getElementById('remNotes').value.trim(),browserNotify:document.getElementById('browserNotify').checked,whatsappNotify:document.getElementById('whatsappNotify').checked,done:false,createdAt:new Date().toISOString()};if(rid){const old=items.find(x=>x.id===rid);data.done=old?.done||false;items=items.map(x=>x.id===rid?data:x)}else items.push(data);save();if(data.browserNotify)await requestNotify();closeModal();render();toast(rid?'Reminder updated':'Reminder saved')};const allList=document.getElementById('allList');if(allList)allList.onclick=e=>handleActions(e);const groupDetail=document.getElementById('groupDetail');if(groupDetail)groupDetail.onclick=e=>handleActions(e)});
function handleActions(e){const ed=e.target.closest('[data-edit]');if(ed)openModal(null,ed.dataset.edit);const del=e.target.closest('[data-del]');if(del&&confirm('यह reminder हटाना है?')){items=items.filter(x=>x.id!==del.dataset.del);save();render()}const done=e.target.closest('[data-done]');if(done){const x=items.find(a=>a.id===done.dataset.done);if(x){x.done=!x.done;save();render()}}}
})();

/* ===== Beautiful custom date picker with quick Year selection ===== */
(function setupBeautifulDatePicker(){
  function init(){
    const input=document.getElementById('remDate');
    if(!input || input.dataset.prettyCalendar==='1') return;
    input.dataset.prettyCalendar='1';
    input.setAttribute('placeholder','DD / MM / YYYY');
    input.title='Calendar खोलने के लिए click करें';

    const wrap=document.createElement('div');
    wrap.className='pretty-date-wrap';
    input.parentNode.insertBefore(wrap,input);
    wrap.appendChild(input);

    const pop=document.createElement('div');
    pop.className='pretty-calendar';
    pop.hidden=true;
    pop.innerHTML=`
      <div class="pc-head">
        <button type="button" class="pc-nav" data-pc="prev">‹</button>
        <div class="pc-title">
          <select class="pc-month" aria-label="Month"></select>
          <select class="pc-year" aria-label="Year"></select>
        </div>
        <button type="button" class="pc-nav" data-pc="next">›</button>
      </div>
      <div class="pc-week">${['रवि','सोम','मंगल','बुध','गुरु','शुक्र','शनि'].map(x=>`<span>${x}</span>`).join('')}</div>
      <div class="pc-days"></div>
      <div class="pc-foot"><button type="button" class="pc-today">आज</button><button type="button" class="pc-close">बंद करें</button></div>`;
    wrap.appendChild(pop);

    const monthSel=pop.querySelector('.pc-month'), yearSel=pop.querySelector('.pc-year'), days=pop.querySelector('.pc-days');
    const months=['जनवरी','फरवरी','मार्च','अप्रैल','मई','जून','जुलाई','अगस्त','सितंबर','अक्टूबर','नवंबर','दिसंबर'];
    monthSel.innerHTML=months.map((m,i)=>`<option value="${i}">${m}</option>`).join('');
    const now=new Date();
    for(let y=1950;y<=2100;y++) yearSel.insertAdjacentHTML('beforeend',`<option value="${y}">${y}</option>`);
    let view=new Date();

    function syncViewFromInput(){
      if(/^\d{4}-\d{2}-\d{2}$/.test(input.value)){
        const [y,m,d]=input.value.split('-').map(Number); view=new Date(y,m-1,d);
      } else view=new Date();
      monthSel.value=view.getMonth(); yearSel.value=view.getFullYear(); draw();
    }
    function iso(y,m,d){return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`}
    function draw(){
      const y=Number(yearSel.value), m=Number(monthSel.value); view=new Date(y,m,1);
      const first=view.getDay(), total=new Date(y,m+1,0).getDate(), prevTotal=new Date(y,m,0).getDate();
      let html='';
      for(let i=0;i<42;i++){
        const n=i-first+1;
        if(n<1){html+=`<button type="button" class="pc-day muted-day" disabled>${prevTotal+n}</button>`;continue}
        if(n>total){html+=`<button type="button" class="pc-day muted-day" disabled>${n-total}</button>`;continue}
        const value=iso(y,m,n), today=iso(now.getFullYear(),now.getMonth(),now.getDate());
        const sel=input.value===value?' selected':'';
        const tod=value===today?' today':'';
        html+=`<button type="button" class="pc-day${sel}${tod}" data-date="${value}">${n}</button>`;
      }
      days.innerHTML=html;
    }
    function open(){syncViewFromInput();pop.hidden=false;setTimeout(()=>document.addEventListener('mousedown',outside,{once:true}),0)}
    function outside(e){if(!wrap.contains(e.target)){pop.hidden=true}else setTimeout(()=>document.addEventListener('mousedown',outside,{once:true}),0)}
    input.addEventListener('click',e=>{e.preventDefault();open()});
    input.addEventListener('focus',()=>{ if(pop.hidden) open(); });
    input.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){e.preventDefault();open()} });
    pop.addEventListener('click',e=>{
      const b=e.target.closest('[data-pc]');
      if(b){const delta=b.dataset.pc==='prev'?-1:1; view=new Date(Number(yearSel.value),Number(monthSel.value)+delta,1);monthSel.value=view.getMonth();yearSel.value=view.getFullYear();draw();return;}
      const day=e.target.closest('[data-date]');
      if(day){input.value=day.dataset.date; input.dispatchEvent(new Event('input',{bubbles:true})); input.dispatchEvent(new Event('change',{bubbles:true})); pop.hidden=true;}
      if(e.target.closest('.pc-today')){const d=new Date();input.value=iso(d.getFullYear(),d.getMonth(),d.getDate());input.dispatchEvent(new Event('change',{bubbles:true}));pop.hidden=true;}
      if(e.target.closest('.pc-close'))pop.hidden=true;
    });
    monthSel.addEventListener('change',draw); yearSel.addEventListener('change',draw);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
