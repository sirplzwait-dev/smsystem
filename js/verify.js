/* Extracted from verify.html - functionality unchanged */




const SUPABASE_URL = "https://rdlliurzgwwfjscgwssa.supabase.co";
const SUPABASE_KEY = "sb_publishable_HX1QmjO0SPyW3rUoihZkkQ_tRTE1bLc";

const sb = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const params = new URLSearchParams(location.search);

const email = params.get("email");

let countdown = 60;

const resendBtn = document.getElementById("resend");

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
async function verifyOtp() {

    const otp = document.getElementById("otp").value.trim();

    if (otp.length !== 6) {
        alert("Please enter a valid 6 digit OTP.");
        return;
    }

    const response = await fetch(
        "https://rdlliurzgwwfjscgwssa.supabase.co/functions/v1/verify-otp",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                otp: otp
            })
        }
    );

    const result = await response.json();

    console.log(result);

    if (!response.ok || !result.success) {
        alert(result.message || result.error || "Invalid OTP");
        return;
    }

    alert("Email verified successfully. Please complete your setup.");

    window.location.href =
        "../html/setup.html?email=" + encodeURIComponent(email);
}

async function resendOtp() {

    resendBtn.disabled = true;

    countdown = 60;
    startTimer();

    const response = await fetch(
        "https://rdlliurzgwwfjscgwssa.supabase.co/functions/v1/send-otp",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                name: "User"
            })
        }
    );

    const result = await response.json();

    if (!response.ok) {
        alert(result.message || result.error || "Failed to resend OTP");
        return;
    }

    alert("A new OTP has been sent to your email.");
}

