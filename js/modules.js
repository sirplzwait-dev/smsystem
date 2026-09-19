(function(){
  const $=s=>document.querySelector(s);
  const KEY='sgunmsEvents';
  function getEvents(){try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){return[]}}
  function saveEvents(a){localStorage.setItem(KEY,JSON.stringify(a))}
  function uid(){return 'evt_'+Date.now()+'_'+Math.random().toString(36).slice(2,7)}
  function renderEvents(){const box=$('#eventList');if(!box)return;const a=getEvents();box.innerHTML=a.length?a.map(e=>`<div class="sg-list-item"><b>${e.name||e.type}</b><div class="muted">${e.type} · ${e.date||'तारीख नहीं'} ${e.venue?'· '+e.venue:''}</div></div>`).join(''):'<div class="empty">अभी कोई Event नहीं है।</div>'}
  function setupEventForm(){const f=$('#eventForm');if(!f)return;f.addEventListener('submit',e=>{e.preventDefault();const fd=new FormData(f);const row={id:uid(),type:fd.get('type'),name:fd.get('name'),date:fd.get('date'),venue:fd.get('venue'),host:fd.get('host'),notes:fd.get('notes'),createdAt:new Date().toISOString()};const a=getEvents();a.unshift(row);saveEvents(a);f.reset();renderEvents();alert('Event सफलतापूर्वक जोड़ दिया गया।')})}
  function init(){setupEventForm();renderEvents();const today=$('#eventDate');if(today&&!today.value)today.value=new Date().toISOString().slice(0,10)}
  window.SGUNMSModules={getEvents,saveEvents,renderEvents};document.addEventListener('DOMContentLoaded',init)
})();
