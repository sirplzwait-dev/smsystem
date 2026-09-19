// register.js

const sb = supabase.createClient(
    "https://rdlliurzgwwfjscgwssa.supabase.co",
    "sb_publishable_HX1QmjO0SPyW3rUoihZkkQ_tRTE1bLc"
);


const btn = document.getElementById("registerBtn");

btn.addEventListener("click", registerUser);

const googleBtn = document.getElementById("googleBtn");
if (googleBtn) googleBtn.addEventListener("click", signInWithGoogle);

async function registerUser(){

    btn.disabled = true;
    btn.innerHTML = "Creating Account...";

    const name = document.getElementById("name").value.trim();
    const state = document.getElementById("state").value.trim();
    const mobile = document.getElementById("mobile").value.trim();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;

    if(!name || !state || !mobile || !email || !password){
        alert("Please fill all fields");
        resetButton();
        return;
    }

    if(password.length < 6){
        alert("Password must be at least 6 characters");
        resetButton();
        return;
    } 
// Signup
    const { data, error } = await sb.auth.signUp({

        email,
        password,

        options:{

            emailRedirectTo:
            "https://sgunms.in/verify.html",

            data:{
                name,
                state,
                mobile
            }

        }

    });

    if(error){

        alert(error.message);

        resetButton();

        return;

    }

    if(!data.user){

        alert("Registration Failed");

        resetButton();

        return;

    }
    // The database trigger creates the profile. Upsert is kept as a safe fallback
    // for projects where the trigger has already created the row.
    const { error: profileError } = await sb.from("profiles").upsert({
        id:data.user.id, name, state, mobile, email
    }, { onConflict:"id" });
    if(profileError){ console.warn("Profile fallback:", profileError.message); }
if(profileError){

        alert(profileError.message);

        resetButton();

        return;

    }

try {
    const {data:{session}}=await sb.auth.getSession();
    if(session?.access_token){
      await fetch("https://rdlliurzgwwfjscgwssa.functions.supabase.co/send-welcome",{
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "Authorization":"Bearer "+session.access_token
        },
        body:JSON.stringify({name,email,user_id:data.user.id})
      });
    }
} catch (err) {
    console.error("Welcome email error:",err);
}

    alert("Registration Successful. Please verify your email.");

    location.href =
    "../html/verify.html?email="+encodeURIComponent(email);

}

async function signInWithGoogle(){
    if (!googleBtn) return;
    googleBtn.disabled = true;
    googleBtn.innerHTML = '<span class="google-icon">G</span> Connecting...';

    const redirectTo = new URL("home.html", window.location.href).href;
    const { error } = await sb.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo }
    });

    if (error) {
        alert("Google Sign-In failed: " + error.message);
        googleBtn.disabled = false;
        googleBtn.innerHTML = '<span class="google-icon">G</span> Sign in with Google';
    }
}

function resetButton(){

    btn.disabled = false;

    btn.innerHTML = "📝 Register";

}