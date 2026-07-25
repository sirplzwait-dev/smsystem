import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
	if (req.method === "OPTIONS") {
  return new Response("ok", {
    headers: corsHeaders,
  });
}
  try {
  if (req.method !== "POST") {
  return new Response(
    JSON.stringify({
      success: false,
      message: "Only POST requests are allowed."
    }),
    {
      status: 405,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    }
  );
}
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  }
);
    }

    const {
      name,
      email,
      admin_pass
    } = await req.json();

   headers: {
  ...corsHeaders,
  "Content-Type": "application/json"
}

    // Email sending code Part 2 में आएगा
	const emailBody = {
  sender: {
    name: "Sagun Management System",
    email: "welcome@sgunms.in"
  },

  to: [
    {
      email: email,
      name: name
    }
  ],

  subject: "🎉 Welcome to Sagun Management System",

  htmlContent: `
<!DOCTYPE html>
<html>

<head>

<meta charset="UTF-8">

<style>

body{
background:#f5f5f5;
font-family:Arial;
padding:30px;
}

.container{

max-width:650px;

margin:auto;

background:#ffffff;

border-radius:12px;

overflow:hidden;

box-shadow:0 0 20px rgba(0,0,0,.08);

}

.header{

background:#800000;

color:white;

padding:25px;

text-align:center;

}

.content{

padding:30px;

}

table{

width:100%;

border-collapse:collapse;

margin-top:20px;

}

td{

border:1px solid #ddd;

padding:12px;

}

.footer{

background:#fafafa;

padding:20px;

text-align:center;

font-size:13px;

color:#777;

}

.button{

display:inline-block;

padding:14px 28px;

background:#800000;

color:#fff !important;

text-decoration:none;

border-radius:6px;

margin-top:25px;

}

</style>

</head>

<body>

<div class="container">

<div class="header">

<h1>Sagun Management System</h1>

</div>

<div class="content">

<h2>Hello ${name} 👋</h2>

<p>

Your account has been created successfully.

</p>

<table>

<tr>

<td><b>Email</b></td>

<td>${email}</td>

</tr>

<tr>

<td><b>Admin Password</b></td>

<td>${admin_pass}</td>

</tr>

</table>

<a
class="button"
href="https://sgunms.in">

Login Website

</a>

</div>

<div class="footer">

© 2026 Sagun Management System

</div>

</div>

</body>

</html>
`
};

const response = await fetch(
  "https://api.brevo.com/v3/smtp/email",
  {
    method: "POST",
    headers: {
      "accept": "application/json",
      "api-key": BREVO_API_KEY!,
      "content-type": "application/json"
    },
    body: JSON.stringify(emailBody)
  }
);

const result = await response.json();

console.log("Brevo Status:", response.status);
console.log("Brevo Result:", result);

// अगर Brevo ने Email भेज दिया
if (response.ok) {

  return new Response(
    JSON.stringify({
      success: true,
      message: "Welcome email sent successfully.",
      data: result
    }),
    {
      status: 200,
     headers: {
  ...corsHeaders,
  "Content-Type": "application/json"
}
    }
  );

}

// अगर Brevo ने Error दिया
headers: {
  ...corsHeaders,
  "Content-Type": "application/json"
}

  } catch (err) {

    return new Response(
      JSON.stringify({
        success: false,
        error: err.message
      }),
      {
        status: 500,
       headers: {
  ...corsHeaders,
  "Content-Type": "application/json"
}
      }
    );

  }
});