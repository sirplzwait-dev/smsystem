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

      // Record each new successful auth session once. The marker is tied to
      // Supabase's last_sign_in_at, so refreshing pages does not create duplicates.
      try {
        const loginMarker = `sgunms-login:${user.id}:${user.last_sign_in_at || user.updated_at || "session"}`;
        if (localStorage.getItem("sgunms-last-login-marker") !== loginMarker) {
          let profileName = "";
          try {
            const { data: profile } = await sb.from("profiles").select("name").eq("id", user.id).maybeSingle();
            profileName = profile?.name || "";
          } catch (_) {}

          const ua = navigator.userAgent || "";
          const device = /Android|iPhone|iPad|Mobile/i.test(ua) ? "Mobile" : "Desktop";
          let browser = "Unknown";
          if (/Edg\//i.test(ua)) browser = "Edge";
          else if (/Chrome\//i.test(ua)) browser = "Chrome";
          else if (/Firefox\//i.test(ua)) browser = "Firefox";
          else if (/Safari\//i.test(ua)) browser = "Safari";
          let os = "Unknown";
          if (/Windows/i.test(ua)) os = "Windows";
          else if (/Android/i.test(ua)) os = "Android";
          else if (/iPhone/i.test(ua)) os = "iPhone";
          else if (/iPad/i.test(ua)) os = "iPad";
          else if (/Mac OS/i.test(ua)) os = "macOS";

          const { error: logError } = await sb.from("login_logs").insert({
            user_id: user.id,
            email: user.email || "",
            name: profileName,
            login_at: new Date().toISOString(),
            device,
            browser,
            os,
            screen_size: `${screen.width}x${screen.height}`,
            user_agent: ua.slice(0, 500)
          });
          if (!logError) localStorage.setItem("sgunms-last-login-marker", loginMarker);
        }
      } catch (loginLogError) {
        // Login history must never block the application.
        console.warn("Login history unavailable:", loginLogError?.message || loginLogError);
      }

      if(window.SagunStore?.prepareUserContext) window.SagunStore.prepareUserContext(user.id);
      else {
        const previous=String(localStorage.getItem('sagunLastAuthUserId')||'').trim();
        if(previous && previous!==String(user.id)){
          ['currentEventId','sgunmsActiveEvent','currentEventType','selectedEventType','pendingEventType','currentMarriageEvent','eventSetupData','sagunSetup','offlineSetupData','currentEventSetup','birthdaySetup','birthdayPhoto','birthdayPhotoPending','profileData','sagunProfile','userName'].forEach(k=>localStorage.removeItem(k));
        }
        localStorage.setItem('sagunLastAuthUserId',String(user.id));
        localStorage.setItem('sagunActiveUserId',String(user.id));
        localStorage.setItem('sagunActiveAccountType','registered');
        localStorage.removeItem('sagunUserMode');
        localStorage.removeItem('sagunGuestSession');
      }

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