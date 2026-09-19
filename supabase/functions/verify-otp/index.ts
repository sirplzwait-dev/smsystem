import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const SUPABASE_URL=Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY=Deno.env.get("SERVICE_ROLE_KEY")!;
const admin=createClient(SUPABASE_URL,SERVICE_ROLE_KEY);
const allowedOrigins=new Set(["https://sgunms.in","https://www.sgunms.in","http://127.0.0.1:5500","http://localhost:5500"]);
function cors(req:Request){const origin=req.headers.get("origin")||"";return {"Access-Control-Allow-Origin":allowedOrigins.has(origin)?origin:"https://sgunms.in","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin"}}
async function authUser(req:Request){const token=req.headers.get("Authorization")?.replace(/^Bearer\s+/i,"");if(!token)return null;const {data,error}=await admin.auth.getUser(token);return error?null:data.user}
serve(async(req)=>{
 const headers=cors(req);
 if(req.method==="OPTIONS")return new Response("ok",{headers});
 if(req.method!=="POST")return new Response(JSON.stringify({success:false,message:"Only POST is allowed."}),{status:405,headers:{...headers,"Content-Type":"application/json"}});
 try{
  const user=await authUser(req);
  if(!user)return new Response(JSON.stringify({success:false,message:"Unauthorized"}),{status:401,headers:{...headers,"Content-Type":"application/json"}});
  const {email,otp}=await req.json();
  if(String(email||"").toLowerCase()!==String(user.email||"").toLowerCase() || !/^\d{6}$/.test(String(otp||"")))return new Response(JSON.stringify({success:false,message:"Invalid verification request."}),{status:400,headers:{...headers,"Content-Type":"application/json"}});
  const {data:otpRow,error}=await admin.from("email_otps").select("id,expires_at").eq("user_id",user.id).eq("email",email).eq("otp",otp).eq("used",false).order("created_at",{ascending:false}).limit(1).maybeSingle();
  if(error)throw error;
  if(!otpRow)return new Response(JSON.stringify({success:false,message:"Invalid OTP."}),{status:400,headers:{...headers,"Content-Type":"application/json"}});
  if(new Date(otpRow.expires_at)<new Date())return new Response(JSON.stringify({success:false,message:"OTP has expired."}),{status:400,headers:{...headers,"Content-Type":"application/json"}});
  const {error:usedError}=await admin.from("email_otps").update({used:true}).eq("id",otpRow.id);
  if(usedError)throw usedError;
  const {error:profileError}=await admin.from("profiles").update({otp_verified:true}).eq("id",user.id);
  if(profileError)throw profileError;
  return new Response(JSON.stringify({success:true,message:"OTP verified successfully."}),{status:200,headers:{...headers,"Content-Type":"application/json"}});
 }catch(err){console.error(err);return new Response(JSON.stringify({success:false,error:err instanceof Error?err.message:String(err)}),{status:500,headers:{...headers,"Content-Type":"application/json"}})}
});