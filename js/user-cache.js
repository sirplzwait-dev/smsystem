(function(){
  try{
    const c=JSON.parse(localStorage.getItem('sgunms_user_cache_v1')||'{}');
    const p=JSON.parse(localStorage.getItem('sgunms_profile_v1')||'{}');
    const name=String(c.name||p.name||localStorage.getItem('sagunProfileName')||'').trim();
    if(name){
      const w=document.getElementById('homeWelcomeName'); if(w) w.textContent=name;
      const h=document.getElementById('headerUserName'); if(h) h.textContent='👤 '+name;
    }
  }catch(e){}
})();