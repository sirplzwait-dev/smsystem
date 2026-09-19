/* Additive event history layer. Existing Event Details fields/functions are not removed or replaced. */
(function(){
  const KEY='sagunEventHistory';
  const names={
    marriage:'💍 Marriage / शादी', engagement:'💖 Engagement / सगाई',
    griha_pravesh:'🏠 गृह प्रवेश', birthday:'🎂 Birthday', anniversary:'💐 Anniversary'
  };
  function uuid(){try{return crypto.randomUUID()}catch(e){return 'evt_'+Date.now()+'_'+Math.random().toString(36).slice(2)}}
  function userKey(uid){return uid ? KEY+'_'+uid : KEY+'__guest'}
  function getList(uid){try{return JSON.parse(localStorage.getItem(userKey(uid))||'[]')}catch(e){return []}}
  function saveList(list,uid){const clean=list.slice(0,100); localStorage.setItem(userKey(uid),JSON.stringify(clean));}
  async function getUser(){
    try{ if(window.SagunGuest && window.SagunGuest.isGuest()) return null; const r=await window.supabase.createClient('https://rdlliurzgwwfjscgwssa.supabase.co','sb_publishable_HX1QmjO0SPyW3rUoihZkkQ_tRTE1bLc').auth.getUser(); return r.data&&r.data.user?r.data.user:null; }catch(e){return null}
  }
  async function add(type,data){
    const user=await getUser();
    const uid=user ? user.id : 'guest';
    const id=uuid(); const rec=Object.assign({id,user_id:uid,event_type:type,event_name:names[type]||data.name||type,event_date:data.event_date||'',person1:data.person1||'',person2:data.person2||'',welcome_name:data.welcome_name||'',created_at:new Date().toISOString()},data);
    const list=getList(uid); list.unshift(rec); saveList(list,uid); localStorage.setItem('currentEventId',id); localStorage.setItem('sagunActiveUserId',uid); try{window.dispatchEvent(new CustomEvent('sagun:event-saved',{detail:rec}));}catch(e){}

    if(user && window.supabase){
      try{
        const sb=window.supabase.createClient('https://rdlliurzgwwfjscgwssa.supabase.co','sb_publishable_HX1QmjO0SPyW3rUoihZkkQ_tRTE1bLc');
        const row={id,user_id:user.id,event_name:rec.event_name,event_type:type,event_date:rec.event_date||null,welcome_name:rec.welcome_name||null,person1:rec.person1||null,person2:rec.person2||null,photo1_url:null,photo2_url:null,qr_url:null};
        const r=await sb.from('events').insert(row); if(r.error) console.warn('Event history cloud save:',r.error.message);
      }catch(e){console.warn('Event history cloud save:',e)}
    }
    return rec;
  }
  window.SagunEventStore={add,getList};
})();
