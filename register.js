// register.js

const sb = supabase.createClient(
    "https://rdlliurzgwwfjscgwssa.supabase.co",
    "sb_publishable_HX1QmjO0SPyW3rUoihZkkQ_tRTE1bLc"
);


const btn = document.getElementById("registerBtn");

btn.addEventListener("click", registerUser);

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

    // Generate Admin Password
    const adminPass =
        "ADM-" + Math.floor(100000 + Math.random() * 900000);

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
                mobile,
                admin_pass:adminPass
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

    // Save profile
    const { error: profileError } =
    await sb.from("profiles").insert({

        id:data.user.id,

        name,

        state,

        mobile,

        email,

        admin_pass:adminPass

    });

    if(profileError){

        alert(profileError.message);

        resetButton();

        return;

    }

try {

    await fetch(
        "https://rdlliurzgwwfjscgwssa.functions.supabase.co/send-welcome",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name,
                email,
                admin_pass: adminPass
            })
        }
    );

} catch (err) {

    console.error("Welcome email error:", err);

}

    alert("Registration Successful. Please verify your email.");

    location.href =
    "verify.html?email="+encodeURIComponent(email);

}

function resetButton(){

    btn.disabled = false;

    btn.innerHTML = "Create Account";

}