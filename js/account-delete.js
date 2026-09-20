(function(){
'use strict';
const SUPA_URL='https://rdlliurzgwwfjscgwssa.supabase.co',SUPA_KEY='sb_publishable_HX1QmjO0SPyW3rUoihZkkQ_tRTE1bLc';
let sb=null;try{sb=window.supabase?.createClient(SUPA_URL,SUPA_KEY)}catch(e){}
const $=id=>document.getElementById(id);
async function user(){try{const r=await sb.auth.getUser();return r?.data?.user||null}catch(e){return null}}
async function rows(uid){
 const tables=['guests','shagun_entries','gifts','cash_transactions','cash_history','events','setup','families','family_members','relationships','event_members','reminders','activity_logs'];
 const errors=[];
 for(const t of tables){try{const r=await sb.from(t).delete().eq('user_id',uid);if(r.error&&!/does not exist|relation .* does not exist|Could not find the table/i.test(r.error.message||''))errors.push(t)}catch(e){}}
 try{const r=await sb.from('profiles').delete().eq('id',uid);if(r.error)errors.push('profiles')}catch(e){}
 return errors;
}
async function run(){
 const guest=localStorage.getItem('guestMode')==='true'||localStorage.getItem('guestAuth')==='true';
 if(guest){$('accountDeleteStatus').textContent='Guest के लिए Delete Guest Details इस्तेमाल करें।';return}
 const u=await user();if(!u){$('accountDeleteStatus').textContent='Active account session नहीं मिला।';return}
 $('deleteAccount').onclick=async()=>{
  if(!confirm('⚠️ DELETE ACCOUNT\\n\\nAccount और application data permanently delete होगा।\\n\\nक्या आगे बढ़ना है?'))return;
  if(!confirm('🚨 FINAL CONFIRMATION\\n\\nक्या सच में Delete Account करना है?'))return;
  const b=$('deleteAccount');b.disabled=true;b.textContent='Deleting…';
  try{
   const errors=await rows(u.id);try{localStorage.clear();sessionStorage.clear()}catch(e){}try{await sb.auth.signOut({scope:'local'})}catch(e){}
   alert(errors.length?'⚠️ कुछ cloud records delete नहीं हो सके।':'✅ Account और application data delete process पूरा हो गया।');
   location.href='login.html';
  }catch(e){b.disabled=false;b.textContent='🗑️ Delete Account';$('accountDeleteStatus').textContent='✕ Delete failed'}
 }
}
document.addEventListener('DOMContentLoaded',run);
})();