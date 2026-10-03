(function(){
  const supabaseUrl="https://rdlliurzgwwfjscgwssa.supabase.co";
  const supabaseKey="sb_publishable_HX1QmjO0SPyW3rUoihZkkQ_tRTE1bLc";
  const sb=window.supabase.createClient(supabaseUrl,supabaseKey,{auth:{persistSession:true,autoRefreshToken:true}});
  const form=document.getElementById('setPasswordForm');
  const pass=document.getElementById('newPassword');
  const confirm=document.getElementById('confirmNewPassword');
  const btn=document.getElementById('setPasswordBtn');
  const status=document.getElementById('passwordStatus');
  if(!form) return;
  form.addEventListener('submit',async function(e){
    e.preventDefault();
    const p=pass.value;
    const c=confirm.value;
    status.textContent='';
    if(p.length<6){status.textContent='Password कम से कम 6 characters का होना चाहिए.';return;}
    if(p!==c){status.textContent='दोनों password समान नहीं हैं.';return;}
    btn.disabled=true;
    try{
      const {data:{session}}=await sb.auth.getSession();
      if(!session?.user){throw new Error('पहले login करें.');}
      const {error}=await sb.auth.updateUser({password:p});
      if(error) throw error;
      status.textContent='Password successfully set. अब इसी email + password से login कर सकते हैं.';
      form.reset();
    }catch(err){status.textContent=err?.message||'Password update failed.';}
    finally{btn.disabled=false;}
  });
})();
