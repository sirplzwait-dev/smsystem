/* Extracted from forgot-password.html - functionality unchanged */


const SUPABASE_URL="https://rdlliurzgwwfjscgwssa.supabase.co";
const SUPABASE_KEY="sb_publishable_HX1QmjO0SPyW3rUoihZkkQ_tRTE1bLc";

const sb=supabase.createClient(
SUPABASE_URL,
SUPABASE_KEY
);

async function sendResetOtp(){

const email=
document.getElementById("email").value.trim().toLowerCase();

if(!email){

alert("Enter your email.");

return;

}

const response=await fetch(
"https://rdlliurzgwwfjscgwssa.supabase.co/functions/v1/send-otp",
{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

email:email,

name:"User",

resend:true

})

}

);

const result=await response.json();

if(!response.ok){

alert(result.message||result.error);

return;

}

alert("OTP sent successfully.");

window.location.href=
"../html/verify-reset-otp.html?email="+encodeURIComponent(email);

}


