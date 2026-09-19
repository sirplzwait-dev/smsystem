/* Extracted from login.html - functionality unchanged */

  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-PSQRN0SV09');



// Registered users use a persistent Supabase session.
// This is separate from Guest Mode and survives page/browser restarts.
const client = window.supabase.createClient(
  "https://rdlliurzgwwfjscgwssa.supabase.co",
  "sb_publishable_HX1QmjO0SPyW3rUoihZkkQ_tRTE1bLc",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "sgunms-auth-session"
    }
  }
);

// Toggle Password Visibility
document.getElementById("togglePass").onclick = function () {
  const pass = document.getElementById("pass");
  if (pass.type === "password") { pass.type = "text"; this.innerHTML = "🙈"; }
  else { pass.type = "password"; this.innerHTML = "👁️"; }
};

// Enter key support for login
document.getElementById("pass").addEventListener("keypress", function(e){ 
  if(e.key === "Enter"){ checkLogin(); } 
});

document.getElementById("loginBtn").addEventListener("click", checkLogin); 
const googleLoginBtn = document.getElementById("googleLoginBtn");
if (googleLoginBtn) googleLoginBtn.addEventListener("click", loginWithGoogle);

async function loginWithGoogle(){
  const btn = document.getElementById("googleLoginBtn");
  if (btn) { btn.disabled = true; btn.innerHTML = "🌐 Connecting..."; }

  try {
    // Register page ki tarah current page ke relative home.html par redirect karega.
    // Isse hard-coded /html/home.html path ki problem nahi hogi.
    const redirectTo = new URL("home.html", window.location.href).href;

    const { error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo }
    });

    if (error) throw error;
  } catch (e) {
    alert(e.message || "Google Login failed");
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = "🌐 Continue with Google";
    }
  }
}
 

async function redirectRegisteredUser(user){
  if(window.SagunStore?.prepareUserContext) window.SagunStore.prepareUserContext(user.id);
  else {
    localStorage.setItem('sagunLastAuthUserId', String(user.id));
    localStorage.setItem('sagunActiveUserId', String(user.id));
    localStorage.setItem('sagunActiveAccountType', 'registered');
    localStorage.removeItem('sagunUserMode');
  }
  // Google/Email users are permanent registered accounts.
  // If a valid session already exists, do not send them to Guest Mode.
  const email = (user?.email || "").toLowerCase();

  if (email === "shashi841505@gmail.com") {
    window.location.href = "../html/admin-dashboard.html";
    return;
  }

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("otp_verified")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Profile check error:", profileError);
  }

  if (profile && profile.otp_verified === false) {
    window.location.href = "../html/verify.html?email=" + encodeURIComponent(user.email || "");
    return;
  }

  // Login ke baad hamesha Dashboard/Home par जाएँ.
  // Cloud data isi user ke user_id se Home par load hoga.
  try{ await window.SagunStore?.syncNow?.(); }catch(_){}
  window.location.href = "../html/home.html";
}

async function checkLogin(){
  const btn = document.getElementById("loginBtn");
  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("pass").value;

  if(!email || !password){
    alert("Please Enter Email & Password");
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Logging in...';

  // Supabase stores this session persistently because persistSession=true.
  const { data, error } = await client.auth.signInWithPassword({ email, password });

  if(error || !data?.user){
    alert(error?.message || "Login failed");
    btn.disabled = false;
    btn.innerHTML = "🔐 Login";
    return;
  }

  await redirectRegisteredUser(data.user);
}

// If the registered user already has a valid persistent session, continue automatically.
window.addEventListener("load", async () => {
  try {
    const { data: { session } } = await client.auth.getSession();
    if (session?.user && !window.location.search.includes("loggedOut")) {
      // Do not auto-redirect if the user explicitly opened Login to enter another account.
      // The existing session is still retained until Logout is pressed.
    }
  } catch (e) {
    console.error("Session check failed:", e);
  }
});

function forgotPassword(){
    window.location.href = "../html/forgot-password.html";
}

