/* Extracted from new-password.html - functionality unchanged */


const email =
new URLSearchParams(location.search).get("email");

async function resetPassword(){

const password =
document.getElementById("password").value.trim();

const confirm =
document.getElementById("confirm").value.trim();

if(password.length<6){

alert("Password must be at least 6 characters.");

return;

}

if(password!==confirm){

alert("Passwords do not match.");

return;

}

const response =
await fetch(
"https://rdlliurzgwwfjscgwssa.supabase.co/functions/v1/reset-password",
{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

email,
password

})

}

);

const result =
await response.json();

if(!response.ok){

alert(result.error||result.message);

return;

}

alert("Password updated successfully.");

window.location.href="../html/login.html";

}


