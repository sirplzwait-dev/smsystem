/* SGUNMS production auth guard.
   Protected pages require a real Supabase Auth session.
   Guest mode is intentionally not accepted for app access.
*/
(function(){
  const SUPABASE_URL="https://rdlliurzgwwfjscgwssa.supabase.co";
  const SUPABASE_KEY="sb_publishable_HX1QmjO0SPyW3rUoihZkkQ_tRTE1bLc";
  const file=(location.pathname.split("/").pop()||"").toLowerCase();
  const adminPages=new Set(["admin.html","admin-dashboard.html"]);
  const publicPages=new Set([
    "","index.html","login.html","register.html","forgot-password.html",
    "verify.html","verify-reset-otp.html","new-password.html"
  ]);
  const loginUrl="login.html";

  function goLogin(){
    try{
      localStorage.removeItem("sagunUserMode");
      localStorage.removeItem("sagunActiveUserId");
      localStorage.removeItem("sagunActiveAccountType");
      localStorage.removeItem("sagunGuestSession");
    }catch(_){}
    const next=encodeURIComponent(location.pathname+location.search+location.hash);
    location.replace(loginUrl+"?return="+next);
  }

  async function loadSupabase(){
    if(window.supabase?.createClient) return window.supabase;
    await new Promise((resolve,reject)=>{
      const sc=document.createElement("script");
      sc.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
      sc.onload=resolve; sc.onerror=reject;
      document.head.appendChild(sc);
    });
    return window.supabase;
  }

  async function run(){
    if(publicPages.has(file)) return;
    document.documentElement.classList.add("sagun-auth-pending");
    try{
      const api=await loadSupabase();
      const sb=api.createClient(SUPABASE_URL,SUPABASE_KEY,{
        auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:"sgunms-auth-session"}
      });
      const {data,error}=await sb.auth.getUser();
      const user=data?.user;
      if(error || !user?.id){ goLogin(); return; }

      localStorage.setItem("sagunActiveUserId",String(user.id));
      localStorage.setItem("sagunActiveAccountType","registered");
      localStorage.removeItem("sagunUserMode");
      localStorage.removeItem("sagunGuestSession");

      if(adminPages.has(file) && String(user.email||"").toLowerCase()!=="shashi841505@gmail.com"){
        location.replace("home.html");
        return;
      }
      document.documentElement.classList.remove("sagun-auth-pending");
      window.SGUNMS_AUTH={user,sb};
    }catch(e){
      console.error("Authentication check failed",e);
      goLogin();
    }
  }

  // Avoid exposing protected UI while the session is being checked.
  const style=document.createElement("style");
  style.textContent=".sagun-auth-pending body{visibility:hidden!important}.sagun-auth-pending{background:#fff!important}";
  document.head.appendChild(style);
  run();
})();