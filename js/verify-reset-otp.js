/* Extracted from verify-reset-otp.html - functionality unchanged */


const email=new URLSearchParams(location.search).get("email");

let countdown=60;

const resendBtn=document.getElementById("resend");

startTimer();

function startTimer(){

resendBtn.disabled=true;

resendBtn.innerText="Resend OTP ("+countdown+")";

const timer=setInterval(()=>{

countdown--;

resendBtn.innerText="Resend OTP ("+countdown+")";

if(countdown<=0){

clearInterval(timer);

resendBtn.disabled=false;

resendBtn.innerText="Resend OTP";

}

},1000);

}

async function verifyOtp(){

const otp=document.getElementById("otp").value.trim();

if(otp.length!==6){

alert("Enter valid OTP");

return;

}

const response=await fetch(
"https://rdlliurzgwwfjscgwssa.supabase.co/functions/v1/verify-otp",
{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
email,
otp
})
}
);

const result=await response.json();

if(!response.ok||!result.success){

alert(result.message||result.error||"Invalid OTP");

return;

}

alert("OTP Verified Successfully");

window.location.href=
"../html/new-password.html?email="+encodeURIComponent(email);

}

async function resendOtp(){

countdown=60;

startTimer();

const response=await fetch(
"https://rdlliurzgwwfjscgwssa.supabase.co/functions/v1/send-otp",
{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
email,
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

alert("OTP Sent Again");

}


