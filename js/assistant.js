(function(){'use strict';
const $=id=>document.getElementById(id);
function arr(key){try{const x=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(x)?x:[]}catch(e){return[]}}
function obj(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(e){return null}}
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function money(n){return '₹'+Number(n||0).toLocaleString('en-IN')}
const labels={tilak:'🪔 Tilak',barat:'🥁 Barat',reception:'🎉 Reception',birthday:'🎂 Birthday',anniversary:'💍 Anniversary',engagement:'💑 Engagement',griha_pravesh:'🏠 Griha Pravesh',housewarming:'🏠 Griha Pravesh',mundan:'👶 Mundan',namkaran:'🍼 Namkaran',marriage:'💒 Marriage'};
function cleanEvent(x){return String(x?.event_type||x?.eventType||x?.event||x?.type||x?.wedding_type||'').toLowerCase().trim().replace(/[- ]/g,'_')}
function cleanMode(x){return String(x?.payment_mode||x?.paymentMode||x?.mode||x?.type||'').toLowerCase()}
function normalize(x){return {raw:x,name:x?.name||x?.guestName||x?.person||x?.guest_name||'',event:cleanEvent(x),mode:cleanMode(x),amount:Number(x?.amount||x?.cashAmount||0)||0,gift:String(x?.gift_description||x?.giftDescription||x?.gift||''),date:x?.date||x?.event_date||x?.eventDate||x?.created_at||x?.createdAt||'',place:x?.village||x?.city||x?.place||''}}
function allIncoming(){return [...arr('offlineGuests'),...arr('eventEntries'),...arr('sagunEntries'),...arr('birthdayEntries')].map(normalize)}
function allGiven(){return arr('sgunms_shagun_given').map(normalize)}
function inferEvent(r){if(r.event)return r.event;const setup=obj('offlineSetupData')||obj('eventSetupData')||obj('currentEventSetup');return cleanEvent(setup)||''}
function enrich(rows){return rows.map(r=>({...r,event:inferEvent(r)}))}
function stats(rows){let cash=0,upi=0,gift=0;rows.forEach(r=>{const m=r.mode;if(m.includes('cash'))cash+=r.amount;if(m.includes('upi'))upi+=r.amount;if(m.includes('gift')||r.gift)gift++});return {cash,upi,gift,total:cash+upi}}
function list(rows){if(!rows.length)return '<p class="muted">कोई matching entry नहीं मिली।</p>';return '<div class="assistant-mini-list">'+rows.slice(0,30).map(r=>'<div><b>'+esc(r.name||'नाम नहीं')+'</b> · '+(r.amount?money(r.amount):(r.gift?'🎁 '+esc(r.gift):'Gift'))+(r.event?' · '+esc(labels[r.event]||r.event):'')+'</div>').join('')+'</div>'}
function render(h){$('answer').innerHTML=h}
function cardStats(s,entries){return '<div class="assistant-stats"><div class="assistant-stat"><b>'+entries+'</b><span>Entries</span></div><div class="assistant-stat"><b>'+money(s.cash)+'</b><span>Cash</span></div><div class="assistant-stat"><b>'+money(s.upi)+'</b><span>UPI</span></div><div class="assistant-stat"><b>'+s.gift+'</b><span>Gift</span></div></div>'}
function answer(q){q=(q||'').trim();if(!q){render('<div class="assistant-empty">अपना सवाल लिखें।</div>');return}const l=q.toLowerCase();const incoming=enrich(allIncoming());
if(/family|परिवार|सदस्य|member|रिश्त/i.test(q)&&!/cash|upi|शगुन|event/i.test(q)){const f=obj('sgunmsFamilyDataV1')||{members:[]};const ms=f.members||[];render('<h3>👨‍👩‍👧 Family</h3><p>कुल सदस्य: <b>'+ms.length+'</b></p>'+ (ms.length?'<div class="assistant-mini-list">'+ms.map(m=>'<div>👤 '+esc(m.name||'नाम नहीं')+(m.city?' · '+esc(m.city):'')+'</div>').join('')+'</div>':'<p>Family में अभी कोई सदस्य नहीं है।'));return}
if(/पिछले\s*3|last\s*3|3\s*events?/i.test(q)&&/दिया|given|शगुन/i.test(q)){const rows=allGiven().sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,3);const s=stats(rows);render('<h3>🎁 पिछले 3 Shagun Diya Entries</h3>'+cardStats(s,rows.length)+list(rows));return}
const ev=[['tilak','tilak'],['barat','barat'],['reception','reception'],['birthday','birthday'],['anniversary','anniversary'],['engagement','engagement'],['griha_pravesh','griha']].find(x=>l.includes(x[0])||l.includes(x[1]));
if(ev){const rows=incoming.filter(r=>r.event===ev[0]||(ev[0]==='griha_pravesh'&&r.event==='housewarming'));const s=stats(rows);render('<h3>'+(labels[ev[0]]||ev[0])+'</h3>'+cardStats(s,rows.length)+list(rows));return}
if(/cash|कैश/i.test(q)&&/upi|यूपीआई/i.test(q)){const s=stats(incoming);render('<h3>💰 Cash और UPI</h3>'+cardStats(s,incoming.length));return}
if(/कितना|कितने|total|कुल|entry|entries|guest|शगुन/i.test(q)&&/दिया|शगुन/i.test(q)){const rows=allGiven();const s=stats(rows);render('<h3>🎁 Shagun Diya</h3>'+cardStats(s,rows.length)+list(rows));return}
render('<h3>🤖 सवाल समझने के लिए उदाहरण</h3><p>“Tilak में Cash और UPI कितना है?”</p><p>“Barat में कितने guest आए?”</p><p>“पिछले 3 events में कितना शगुन दिया?”</p><p>“मेरे family members कौन हैं?”</p>')}
function init(){const form=$('assistantForm');if(!form)return;form.addEventListener('submit',e=>{e.preventDefault();answer($('assistantInput').value)});document.querySelectorAll('.quick-q').forEach(b=>b.addEventListener('click',()=>{$('assistantInput').value=b.dataset.question;answer(b.dataset.question)}));$('clearAnswer').addEventListener('click',()=>{$('assistantInput').value='';render('<div class="assistant-empty">सवाल पूछने के लिए ऊपर लिखें।</div>');$('assistantInput').focus()})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
