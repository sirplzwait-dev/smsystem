(function(){
'use strict';
const KEY='sgunmsFamilyDataV1';
function userScopeKey(){
  const uid=String(localStorage.getItem('sagunActiveUserId')||'').trim();
  return uid ? KEY+'_'+uid : KEY+'_guest';
}
let state=load();
const relationNames={father:'पिता',mother:'माता',son:'बेटा',daughter:'बेटी',brother:'भाई',sister:'बहन',husband:'पति',wife:'पत्नी',chacha:'चाचा',chachi:'चाची',bua:'बुआ',fufa:'फूफा',mama:'मामा',mami:'मामी',mausi:'मौसी',other:'अन्य'};
function load(){try{return JSON.parse(localStorage.getItem(userScopeKey()))||{members:[],relations:[]}}catch(e){return{members:[],relations:[]}}}
function save(){localStorage.setItem(userScopeKey(),JSON.stringify(state));render()}
function id(){return 'fm_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7)}
function esc(v){return String(v??'').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[s]))}
function member(id){return state.members.find(x=>x.id===id)}
function headMember(){return state.members.find(x=>x.isHead===true)}
function toast(msg){const el=document.getElementById('familyToast');el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2200)}
function open(id){document.getElementById(id).hidden=false}
function close(id){document.getElementById(id).hidden=true}
function render(){
 document.getElementById('memberCount').textContent=state.members.length;
 const q=(document.getElementById('familySearch').value||'').toLowerCase().trim();
 const ms=state.members.filter(m=>[m.name,m.mobile,m.address].join(' ').toLowerCase().includes(q));
 document.getElementById('membersList').innerHTML=ms.length?ms.map(m=>`<article class="member-card"><div class="member-top"><div class="avatar">${esc((m.name||'?').trim().charAt(0).toUpperCase())}</div><div><div class="member-name">${esc(m.name)} ${m.isHead?'<span class="head-badge">👑 Head</span>':''}</div><div class="member-meta">${esc(m.address||'पता नहीं दिया')}</div></div></div><div class="member-details"><div class="detail"><b>📱 Mobile</b>${esc(m.mobile||'—')}</div><div class="detail"><b>🎂 Birthday</b>${esc(formatDate(m.birthday)||'—')}</div><div class="detail"><b>💍 Anniversary</b>${esc(formatDate(m.anniversary)||'—')}</div><div class="detail"><b>🏠 Address</b>${esc(m.address||'—')}</div></div>${m.notes?`<div class="detail" style="margin-top:7px"><b>📝 Notes</b>${esc(m.notes)}</div>`:''}<div class="card-actions"><button class="mini-btn" data-edit="${m.id}">✏️ Edit</button><button class="mini-btn danger" data-delete="${m.id}">🗑 Delete</button></div></article>`).join(''):`<div class="empty">अभी कोई family member नहीं है। <b>＋ सदस्य जोड़ें</b> से पहला सदस्य जोड़ें।</div>`;
 renderRelations(); renderTree(); populatePeople();
}
function formatDate(v){if(!v)return '';const d=new Date(v+'T00:00:00');return isNaN(d)?v:d.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
function renderRelations(){
 const h=headMember();
 let rows=[];
 if(h){
   rows=state.members.filter(m=>m.id!==h.id).map(m=>`<div class="relation-item"><div class="relation-flow"><span class="person-pill">👑 ${esc(h.name)}</span><span>→</span><span class="relation-badge">${esc(relationNames[m.relationToHead]||m.relationToHead||'संबंध नहीं दिया')}</span><span>→</span><span class="person-pill">${esc(m.name)}</span><button class="mini-btn" data-rel-edit="${m.id}">✏️ Edit</button></div></div>`).join('');
 }
 document.getElementById('relationsList').innerHTML=h?(rows||'<div class="empty">Head के अलावा अभी कोई member नहीं है।</div>'):'<div class="empty">पहले एक member को Head of Family बनाइए।</div>';
 document.getElementById('relativesList').innerHTML=document.getElementById('relationsList').innerHTML;
}

function renderTree(){
 const root=document.getElementById('treeRoot');
 const h=headMember();
 if(!h){root.innerHTML=state.members.length?'<div class="empty">Family Tree के लिए पहले एक member को 👑 Head of Family बनाइए।</div>':'<div class="empty">Family Tree बनाने के लिए पहले members जोड़ें।</div>';return}
 const others=state.members.filter(m=>m.id!==h.id);
 let html='<div class="tree-level">'+treeCard(h,'Head of Family')+'</div>';
 if(others.length){html+='<div class="tree-connector"></div><div class="tree-level">'+others.map(m=>treeCard(m,relationNames[m.relationToHead]||m.relationToHead||'संबंध नहीं दिया')).join('')+'</div>'}
 root.innerHTML=html;
}

function treeCard(m,rel){return `<div class="tree-person"><b>👤 ${esc(m.name)}</b><small>${esc(rel||'परिवार')}</small></div>`}
function populatePeople(){const h=headMember();const a=document.getElementById('personA'),b=document.getElementById('personB');if(a){a.innerHTML=h?`<option value="${h.id}">${esc(h.name)}</option>`:'<option value="">Head नहीं है</option>';a.value=h?.id||''}if(b){b.innerHTML='<option value="">सदस्य चुनें</option>'+state.members.filter(m=>!h||m.id!==h.id).map(m=>`<option value="${m.id}">${esc(m.name)}</option>`).join('');}}


function editHeadRelation(mid){
 const h=headMember(), m=member(mid);
 if(!h||!m)return;
 populatePeople();
 document.getElementById('relationForm').reset();
 document.getElementById('personB').value=m.id;
 document.getElementById('relationCode').value=m.relationToHead||'other';
 const existing=state.relations.find(r=>r.a===h.id&&r.b===m.id);
 document.getElementById('relationRemark').value=existing?.remark||'';
 document.getElementById('headRelationInfo').textContent=`👑 ${h.name} — ${m.name} का relationship edit करें।`;
 open('relationModal');
}

function resetMember(){document.getElementById('memberForm').reset();document.getElementById('memberId').value='';document.getElementById('mHead').checked=false;document.getElementById('mRelationToHead').value='';document.getElementById('memberModalTitle').textContent='सदस्य जोड़ें'}
function editMember(mid){const m=member(mid);if(!m)return;document.getElementById('memberId').value=m.id;document.getElementById('mName').value=m.name||'';document.getElementById('mMobile').value=m.mobile||'';document.getElementById('mHead').checked=!!m.isHead;document.getElementById('mRelationToHead').value=m.relationToHead||'';document.getElementById('mAddress').value=m.address||'';document.getElementById('mBirthday').value=m.birthday||'';document.getElementById('mAnniversary').value=m.anniversary||'';document.getElementById('mNotes').value=m.notes||'';document.getElementById('memberModalTitle').textContent='सदस्य Edit करें';open('memberModal')}
function deleteMember(mid){if(!confirm('इस family member को हटाना है?'))return;state.members=state.members.filter(m=>m.id!==mid);state.relations=state.relations.filter(r=>r.a!==mid&&r.b!==mid);save();toast('Member हटाया गया')}
document.addEventListener('DOMContentLoaded',()=>{
 document.querySelectorAll('.family-tab').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.family-tab').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.family-tab-content').forEach(x=>x.classList.remove('active'));btn.classList.add('active');document.getElementById('tab-'+btn.dataset.tab).classList.add('active')}));
 document.getElementById('familySearch').addEventListener('input',render);
 document.getElementById('openMemberBtn').onclick=()=>{resetMember();open('memberModal')};
 ['openRelationBtn','openRelationBtn2'].forEach(x=>document.getElementById(x).onclick=()=>{populatePeople();document.getElementById('relationForm').reset();const h=headMember();document.getElementById('headRelationInfo').textContent=h?`👑 ${h.name} — सभी संबंध इसी Head के आधार पर होंगे।`:'पहले एक Head of Family चुनें।';open('relationModal')});
 document.querySelectorAll('[data-close]').forEach(x=>x.addEventListener('click',()=>close(x.dataset.close)));
 document.getElementById('memberForm').addEventListener('submit',e=>{e.preventDefault();const mid=document.getElementById('memberId').value;const isHead=document.getElementById('mHead').checked;const relationToHead=isHead?'':document.getElementById('mRelationToHead').value;const data={id:mid||id(),name:document.getElementById('mName').value.trim(),mobile:document.getElementById('mMobile').value.trim(),address:document.getElementById('mAddress').value.trim(),birthday:document.getElementById('mBirthday').value,anniversary:document.getElementById('mAnniversary').value,notes:document.getElementById('mNotes').value.trim(),isHead,relationToHead,updatedAt:new Date().toISOString()};if(!data.name)return;const otherHead=state.members.find(m=>m.isHead&&m.id!==data.id);if(!isHead&&!otherHead&&state.members.length){alert('पहले एक member को Head of Family बनाइए।');return}if(!isHead&&!relationToHead){alert('Head से संबंध चुनें।');return}if(isHead){state.members.forEach(m=>m.isHead=false);data.relationToHead=''}if(mid){const i=state.members.findIndex(m=>m.id===mid);state.members[i]={...state.members[i],...data}}else state.members.unshift({...data,createdAt:new Date().toISOString()});save();close('memberModal');toast(mid?'Member updated':'Member added')});
 document.getElementById('relationForm').addEventListener('submit',e=>{e.preventDefault();const h=headMember(),b=document.getElementById('personB').value,rel=document.getElementById('relationCode').value;if(!h){alert('पहले एक Head of Family चुनें।');return}if(!b||b===h.id){alert('Head के अलावा कोई member चुनें।');return}const bm=member(b);if(bm){bm.relationToHead=rel}state.relations=state.relations.filter(r=>r.a!==h.id||r.b!==b);state.relations.push({id:id(),a:h.id,b,rel,remark:document.getElementById('relationRemark').value.trim(),createdAt:new Date().toISOString()});save();close('relationModal');toast('Head से relationship saved')});
 document.addEventListener('click',e=>{const ed=e.target.closest('[data-edit]');if(ed)editMember(ed.dataset.edit);const re=e.target.closest('[data-rel-edit]');if(re)editHeadRelation(re.dataset.relEdit);const del=e.target.closest('[data-delete]');if(del)deleteMember(del.dataset.delete);const rd=e.target.closest('[data-rel-delete]');if(rd){if(confirm('यह relationship हटाना है?')){state.relations=state.relations.filter(r=>r.id!==rd.dataset.relDelete);save();toast('Relationship हटाया गया')}}});
 render();
});
})();
