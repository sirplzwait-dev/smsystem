(function(){
  const KEY='sgunms_shagun_given';
  const userScope=()=>String(localStorage.getItem('sagunActiveUserId')||'').trim()||'guest';
  const scopedKey=()=>KEY+'_'+userScope();
  const $=id=>document.getElementById(id);
  const get=()=>{try{return JSON.parse(localStorage.getItem(scopedKey())||'[]')}catch(e){return[]}};
  const put=a=>localStorage.setItem(scopedKey(),JSON.stringify(a));
  function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
  function fmtDate(v){if(!v)return 'दिनांक नहीं';const p=v.split('-');return p.length===3?`${p[2]}-${p[1]}-${p[0]}`:v}
  function render(){const a=get().sort((x,y)=>new Date(y.date||0)-new Date(x.date||0));$('count').textContent=`${a.length} ${a.length===1?'entry':'entries'}`;$('list').innerHTML=a.length?a.map((x,i)=>`<article class="entry"><div class="entry-top"><span class="entry-name">${esc(x.person)}</span><span class="entry-amount">${x.amount?`₹${Number(x.amount).toLocaleString('en-IN')}`:(x.gift?'🎁 Gift':'—')}</span></div><div class="entry-meta">📅 ${fmtDate(x.date)} · 🎉 ${esc(x.occasion||'समारोह')} · 🤝 ${esc(x.relation||'रिश्ता नहीं')}<br>📍 ${esc(x.place||'स्थान नहीं')} · ${esc(x.type)}${x.gift?` · 🎁 ${esc(x.gift)}`:''}${x.remark?`<br>📝 ${esc(x.remark)}`:''}</div><div class="entry-actions"><button onclick="removeEntry(${i})">🗑️ हटाएँ</button></div></article>`).join(''):'<div class="empty">अभी “शगुन दिया” की कोई Entry नहीं है।</div>';}
  function updateTypeFields(){
    const type=$('type').value;
    const cash=type==='Cash'||type==='Cash+Gift';
    const gift=type==='Gift'||type==='Cash+Gift';
    $('amountField').classList.toggle('hidden-field',!cash);
    $('giftField').classList.toggle('hidden-field',!gift);
    $('amount').disabled=!cash;
    $('gift').disabled=!gift;
    if(!cash) $('amount').value='';
    if(!gift) $('gift').value='';
  }
  $('type').addEventListener('change',updateTypeFields);
  $('todayBtn').onclick=function(){
    const d=new Date(); const m=String(d.getMonth()+1).padStart(2,'0'); const day=String(d.getDate()).padStart(2,'0');
    $('date').value=`${d.getFullYear()}-${m}-${day}`;
    if($('date').showPicker) try{$('date').showPicker()}catch(e){}
  };
  $('date').addEventListener('click',function(){if(this.showPicker) try{this.showPicker()}catch(e){}});
  $('save').onclick=function(){const person=$('person').value.trim();if(!person){$('msg').textContent='⚠️ कृपया नाम भरें।';$('person').focus();return}const type=$('type').value;if((type==='Cash'||type==='Cash+Gift')&&!$('amount').value){$('msg').textContent='⚠️ Cash चुना है, कृपया राशि भरें।';$('amount').focus();return}if((type==='Gift'||type==='Cash+Gift')&&!$('gift').value.trim()){$('msg').textContent='⚠️ Gift चुना है, कृपया Gift का विवरण लिखें।';$('gift').focus();return}const x={id:Date.now(),person,occasion:$('occasion').value.trim(),date:$('date').value,relation:$('relation').value.trim(),place:$('place').value.trim(),type:$('type').value,amount:$('amount').value,gift:$('gift').value.trim(),remark:$('remark').value.trim(),createdAt:new Date().toISOString()};const a=get();a.push(x);put(a);$('msg').textContent='✅ शगुन की Entry save हो गई।';$('person').value='';$('occasion').value='';$('date').value='';$('relation').value='';$('place').value='';$('amount').value='';$('gift').value='';$('remark').value='';render();};
  $('clear').onclick=function(){$('person').value='';$('occasion').value='';$('date').value='';$('relation').value='';$('place').value='';$('amount').value='';$('gift').value='';$('remark').value='';$('msg').textContent='';};
  window.removeEntry=function(index){const a=get().sort((x,y)=>new Date(y.date||0)-new Date(x.date||0));a.splice(index,1);put(a);render()};
  window.clearAll=function(){if(!get().length)return;if(confirm('क्या आप शगुन दिया की सभी Entries हटाना चाहते हैं?')){put([]);render()}};
  updateTypeFields();
  render();
})();
