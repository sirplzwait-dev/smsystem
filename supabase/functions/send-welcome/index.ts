import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL=Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY=Deno.env.get("SERVICE_ROLE_KEY")!;
const BREVO_API_KEY=Deno.env.get("BREVO_API_KEY")!;
const admin=createClient(SUPABASE_URL,SERVICE_ROLE_KEY);
const allowedOrigins=new Set(["https://sgunms.in","https://www.sgunms.in","http://127.0.0.1:5500","http://localhost:5500"]);

function cors(req:Request){
  const origin=req.headers.get("origin")||"";
  return {
    "Access-Control-Allow-Origin":allowedOrigins.has(origin)?origin:"https://sgunms.in",
    "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods":"POST, OPTIONS",
    "Vary":"Origin"
  };
}
async function authUser(req:Request){
  const token=req.headers.get("Authorization")?.replace(/^Bearer\s+/i,"");
  if(!token) return null;
  const {data,error}=await admin.auth.getUser(token);
  return error?null:data.user;
}
serve(async(req)=>{
  const headers=cors(req);
  if(req.method==="OPTIONS") return new Response("ok",{headers});
  if(req.method!=="POST") return new Response(JSON.stringify({success:false,message:"Only POST is allowed."}),{status:405,headers:{...headers,"Content-Type":"application/json"}});
  try{
    const user=await authUser(req);
    if(!user) return new Response(JSON.stringify({success:false,message:"Unauthorized"}),{status:401,headers:{...headers,"Content-Type":"application/json"}});
    const body=await req.json();
    const email=String(body.email||"").trim().toLowerCase();
    const name=String(body.name||user.user_metadata?.name||"User").trim();
    if(!email || email!==String(user.email||"").toLowerCase()) return new Response(JSON.stringify({success:false,message:"Unauthorized"}),{status:403,headers:{...headers,"Content-Type":"application/json"}});

    await admin.from("email_otps").update({used:true}).eq("user_id",user.id).eq("used",false);
    const otp=Math.floor(100000+Math.random()*900000).toString();
    const expiresAt=new Date(Date.now()+30*60*1000).toISOString();
    const {error:otpError}=await admin.from("email_otps").insert({email,otp,expires_at:expiresAt,used:false,user_id:user.id});
    if(otpError) throw otpError;
    const {error:profileError}=await admin.from("profiles").update({otp_verified:false}).eq("id",user.id);
    if(profileError) throw profileError;

    const emailBody={
      sender:{name:"Sagun Management System",email:"welcome@sgunms.in"},
      to:[{email,name}],
      subject:"🎉 Welcome to Sagun Management System",
      htmlContent:`<html><body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:30px"><div style="max-width:620px;margin:auto;background:#fff;padding:28px;border-radius:12px"><h2 style="color:#800000">Welcome ${name}</h2><p>Your account has been created successfully.</p><p><b>Verification OTP:</b></p><div style="font-size:30px;font-weight:bold;color:#006400;letter-spacing:6px">${otp}</div><p>OTP valid for 30 minutes.</p><p style="color:#777;font-size:13px">Never share your OTP with anyone.</p></div></body></html>`
    };
    const mail=await fetch("https://api.brevo.com/v3/smtp/email",{method:"POST",headers:{accept:"application/json","content-type":"application/json","api-key":BREVO_API_KEY},body:JSON.stringify(emailBody)});
    if(!mail.ok) return new Response(JSON.stringify({success:false,message:"Failed to send welcome email."}),{status:502,headers:{...headers,"Content-Type":"application/json"}});
    return new Response(JSON.stringify({success:true,message:"Verification OTP sent."}),{status:200,headers:{...headers,"Content-Type":"application/json"}});
  }catch(err){
    console.error(err);
    return new Response(JSON.stringify({success:false,error:err instanceof Error?err.message:String(err)}),{status:500,headers:{...headers,"Content-Type":"application/json"}});
  }
});