// Anniversary has its own dedicated entry screen with the custom anniversary background.
// Never show the generic event entry page for an Anniversary event.
(function(){
  try {
    const d = JSON.parse(localStorage.getItem("eventSetupData") || localStorage.getItem("offlineSetupData") || "null");
    const t = localStorage.getItem("currentEventType") || d?.event_type || d?.event_group || d?.wedding_type || "";
    if (t === "anniversary") {
      location.replace("anniversary-entry.html");
      return;
    }
  } catch(e) {}
})();

const sb = window.supabase.createClient(
  "https://rdlliurzgwwfjscgwssa.supabase.co",
  "sb_publishable_HX1QmjO0SPyW3rUoihZkkQ_tRTE1bLc"
);

const CONFIG = {
  anniversary:["❤️","शादी की सालगिरह"], engagement:["💍","सगाई समारोह"], griha_pravesh:["🏠","गृह प्रवेश"],
  mundan:["👶","मुंडन / छठी"], namkaran:["🍼","नामकरण समारोह"], puja:["🪔","पूजा / हवन"],
  retirement:["🎓","विदाई / Retirement"], other:["🎉","अन्य समारोह"]
};

let setupData = null;

function esc(v){return String(v??"").replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[s]));}

async function loadSetup(){
  try{
    const {data:{user}}=await sb.auth.getUser();
    if(user){
      const res=await sb.from("setup").select("*").eq("user_id",user.id).single();
      if(res.data){setupData=res.data;localStorage.setItem("offlineSetupData",JSON.stringify(setupData));}
    }
  }catch(e){console.log("Offline mode",e);}
  if(!setupData){
    try{setupData=JSON.parse(localStorage.getItem("offlineSetupData")||"null");}catch(e){}
  }
  if(!setupData){location.href="setup.html";return;}

  const [icon,title]=CONFIG[setupData.wedding_type]||CONFIG.other;
  document.getElementById("eventIcon").textContent=icon;
  document.getElementById("eventTitle").textContent=title;
  document.getElementById("eventDate").textContent="📅 "+(setupData.event_date||"");
  document.title="Sagun Entry - "+title;

  const people=[
    {name:setupData.groom_name,label:"मुख्य व्यक्ति / पक्ष",photo:setupData.groom_photo_url},
    {name:setupData.bride_name,label:"परिवार / दूसरा पक्ष",photo:setupData.bride_photo_url}
  ].filter(p=>p.name);
  document.getElementById("people").innerHTML=people.map(p=>`<div class="person"><img src="${esc(p.photo||'https://placehold.co/110x110?text=Photo')}" alt=""><h3>${esc(p.name)}</h3><p>${esc(p.label)}</p></div>`).join("");
  if(setupData.qr_url){document.getElementById("qrImage").src=setupData.qr_url;document.getElementById("qrCard").style.display="block";}
  document.getElementById("pageLoader").style.display="none";
}

document.getElementById("paymentMode").addEventListener("change",e=>{
  document.getElementById("qrCard").style.display=e.target.value==="UPI"&&setupData?.qr_url?"block":"none";
  if(e.target.value==="UPI"&&!setupData?.qr_url) Swal.fire("QR उपलब्ध नहीं","Setup में UPI QR upload नहीं किया गया है।","info");
});

async function saveGuest(){
  const name=document.getElementById("guestName").value.trim().toUpperCase();
  const amount=document.getElementById("guestAmount").value;
  const state=document.getElementById("guestState").value.trim()||"Bihar";
  const dist=document.getElementById("guestDist").value.trim()||"Gopalganj";
  const village=document.getElementById("guestVillage").value.trim().toUpperCase();
  const mode=document.getElementById("paymentMode").value;
  const gift=document.getElementById("giftDescription").value.trim();
  if(!name)return Swal.fire("त्रुटि","कृपया नाम दर्ज करें।","error");
  if(mode!=="Gift"&&(!amount||Number(amount)<=0))return Swal.fire("त्रुटि","कृपया राशि दर्ज करें।","error");

  let userId="offline-user";
  try{const {data:{user}}=await sb.auth.getUser();if(user)userId=user.id;}catch(e){}
  const record={user_id:userId,name,amount:Number(amount||0),state,district:dist,village,payment_mode:mode,gift_description:gift,event_type:setupData?.wedding_type||"other",event_date:setupData?.event_date||"",event_id:localStorage.getItem("currentEventId")||"",eventId:localStorage.getItem("currentEventId")||"",event_person:setupData?.groom_name||setupData?.name||"",event_person_2:setupData?.bride_name||"",timestamp:new Date().toISOString()};
  if(window.SagunStore) await window.SagunStore.addEntry(record); else {const local=JSON.parse(localStorage.getItem("offlineGuests")||"[]");local.push(record);localStorage.setItem("offlineGuests",JSON.stringify(local));}
  document.getElementById("status").textContent=`${name} जी की Entry सुरक्षित हो गई।`;
  ["guestName","guestAmount","guestVillage","giftDescription"].forEach(id=>document.getElementById(id).value="");
  document.getElementById("guestName").focus();
}

window.saveGuest=saveGuest;
window.addEventListener("load",loadSetup);
