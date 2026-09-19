const sb = window.supabase.createClient(
  "https://rdlliurzgwwfjscgwssa.supabase.co",
  "sb_publishable_HX1QmjO0SPyW3rUoihZkkQ_tRTE1bLc"
);

let setup = null;

const META = {
  birthday: {icon:"🎂", title:"जन्मदिन समारोह", wish:"जन्मदिन की ढेरों शुभकामनाएँ 🎂❤️"},
  anniversary: {icon:"❤️", title:"शादी की सालगिरह", wish:"आप दोनों को वैवाहिक वर्षगाँठ की हार्दिक शुभकामनाएँ ❤️"},
  engagement: {icon:"💍", title:"सगाई समारोह", wish:"नई शुरुआत के लिए ढेरों शुभकामनाएँ 💍❤️"},
  housewarming: {icon:"🏠", title:"गृह प्रवेश समारोह", wish:"नए घर में सुख, शांति और समृद्धि बनी रहे 🏠✨"},
  mundan: {icon:"👶", title:"मुंडन / छठी समारोह", wish:"नन्हे बच्चे को ढेरों आशीर्वाद 👶❤️"},
  naming: {icon:"🍼", title:"नामकरण समारोह", wish:"नन्हे बच्चे को ढेरों आशीर्वाद 🍼❤️"},
  puja: {icon:"🪔", title:"पूजा / हवन समारोह", wish:"पूजा के शुभ अवसर पर आपका हार्दिक स्वागत है। 🪔"},
  retirement: {icon:"🎓", title:"सेवानिवृत्ति समारोह", wish:"सेवानिवृत्ति के इस विशेष अवसर पर हार्दिक शुभकामनाएँ। 🎓"},
  other: {icon:"🎉", title:"विशेष समारोह", wish:"आपकी गरिमामयी उपस्थिति हमारे लिए सौभाग्य है।"}
};

async function loadSetup(){
  try {
    const local = localStorage.getItem("currentEventSetup") || localStorage.getItem("offlineSetupData");
    if(local) setup = JSON.parse(local);
  } catch(_) {}

  try {
    const {data:{user}} = await sb.auth.getUser();
    if(user){
      const {data} = await sb.from("setup").select("*").eq("user_id",user.id).maybeSingle();
      if(data && ["birthday","anniversary","housewarming","mundan","other"].includes(data.event_type || data.wedding_type)){
        setup = {
          event_type:data.event_type || data.wedding_type,
          event_date:data.event_date || "",
          groom_name:data.groom_name || "",
          bride_name:data.bride_name || "",
          groom_photo_url:data.groom_photo_url || "",
          bride_photo_url:data.bride_photo_url || "",
          qr_url:data.qr_url || "",
          welcome_name:data.welcome_name || "",
          event_person:data.event_person || data.groom_name || "",
          event_person_2:data.event_person_2 || data.bride_name || ""
        };
        localStorage.setItem("currentEventSetup",JSON.stringify(setup));
      }
    }
  } catch(_) {}

  if(!setup || !META[setup.event_type]){
    alert("Event setup नहीं मिला। पहले समारोह Setup करें।");
    location.replace("setup.html");
    return;
  }

  const meta = META[setup.event_type];
  document.getElementById("eventIcon").textContent = meta.icon;
  document.getElementById("eventTitle").textContent = meta.title;
  document.getElementById("eventDate").textContent = setup.event_date ? `दिनांक: ${setup.event_date}` : "";
  document.getElementById("personName").textContent = setup.event_person || setup.groom_name || "";

  const second = setup.event_person_2 || setup.bride_name || "";
  document.getElementById("personSecond").textContent =
    ["anniversary","engagement"].includes(setup.event_type) && second ? `❤️ ${second}` : "";

  const photo = setup.groom_photo_url || setup.bride_photo_url;
  if(photo) document.getElementById("personPhoto").src = photo;

  document.getElementById("welcomeText").textContent =
    setup.welcome_name ? `${setup.welcome_name} की ओर से आपका हार्दिक स्वागत है।` : meta.wish;

  if(setup.qr_url) document.getElementById("upiQrImage").src = setup.qr_url;
  else document.getElementById("upiQrImage").style.display = "none";
}

const giftType = document.getElementById("giftType");
const paymentMode = document.getElementById("paymentMode");
const amount = document.getElementById("giftAmount");
const desc = document.getElementById("giftDescription");
const popup = document.getElementById("upiPopup");

giftType.addEventListener("change", () => {
  const cash = giftType.value === "Cash Gift";
  paymentMode.style.display = cash ? "" : "none";
  amount.style.display = cash ? "" : "none";
  if(!cash) paymentMode.value = "Cash";
});
paymentMode.addEventListener("change", () => {
  if(paymentMode.value === "UPI" && setup?.qr_url){
    popup.style.display = "flex";
  }
});
document.getElementById("closePopup").onclick = () => popup.style.display = "none";
document.addEventListener("keydown", e => { if(e.key === "Escape") popup.style.display = "none"; });

function showMessage(text, error=false){
  const el=document.getElementById("message");
  el.style.display="block";
  el.style.background=error?"#fff0f0":"#eaf8ee";
  el.style.color=error?"#a22":"#18733a";
  el.textContent=text;
  setTimeout(()=>el.style.display="none",3500);
}

async function insertGuest(userId, entry){
  const full = {
    user_id:userId,
    name:entry.name,
    amount:entry.amount,
    state:"Bihar",
    district:"",
    village:entry.village,
    payment_mode:entry.payment_mode,
    event_type:entry.event_type,
    event_person:entry.event_person,
    event_date:entry.event_date,
    event_id:entry.event_id || localStorage.getItem("currentEventId") || null,
    gift_type:entry.gift_type,
    gift_description:entry.gift_description
  };

  let result = await sb.from("guests").insert([full]);
  if(result.error){
    // Backward compatibility with older guests table.
    result = await sb.from("guests").insert([{
      user_id:userId,name:entry.name,amount:entry.amount,
      state:"Bihar",district:"",village:entry.village,
      payment_mode:entry.payment_mode
    }]);
  }
  if(result.error) throw result.error;
}

document.getElementById("submitBtn").addEventListener("click", async () => {
  const name=document.getElementById("guestName").value.trim();
  const village=document.getElementById("guestVillage").value.trim();
  const type=giftType.value;
  const description=desc.value.trim();
  const money=Number(amount.value||0);
  const pay=paymentMode.value;

  if(!name) return showMessage("कृपया नाम दर्ज करें।",true);
  if(!village) return showMessage("कृपया गाँव दर्ज करें।",true);
  if(type==="Gift" && !description) return showMessage("Gift का विवरण लिखें।",true);
  if(type==="Cash Gift" && money<=0) return showMessage("Cash Gift की राशि दर्ज करें।",true);

  const entry={
    id:Date.now(),name,village,gift_type:type,
    gift_description:description,amount:type==="Gift"?0:money,
    payment_mode:type==="Gift"?"Gift":pay,
    event_type:setup.event_type,event_id:localStorage.getItem("currentEventId")||"",event_person:setup.event_person || setup.groom_name,
    event_date:setup.event_date || "",created_at:new Date().toISOString()
  };

  const local=JSON.parse(localStorage.getItem("eventEntries")||"[]");
  local.unshift(entry);
  localStorage.setItem("eventEntries",JSON.stringify(local));

  try{
    const {data:{user}}=await sb.auth.getUser();
    if(user) await insertGuest(user.id,entry);
  }catch(e){ console.log("Entry saved locally:",e); }

  showMessage(`✅ ${name} की ${type} entry दर्ज हो गई।`);
  document.getElementById("guestName").value="";
  document.getElementById("guestVillage").value="";
  desc.value="";
  amount.value="";
});

document.getElementById("logoutBtn").onclick=async()=>{
  await sb.auth.signOut();
  if (window.SagunGuest && window.SagunGuest.isGuest()) { window.SagunGuest.logout(); return; }
  localStorage.clear();
  sessionStorage.clear();
  // login disabled
};

window.addEventListener("DOMContentLoaded",()=>{
  loadSetup();
  giftType.dispatchEvent(new Event("change"));
});


// Dedicated marriage event page loader
(function(){
  function readSetup(){
    try { return JSON.parse(localStorage.getItem("eventSetupData") || localStorage.getItem("offlineSetupData") || "null"); }
    catch(e){ return null; }
  }
  function applyDualSetup(){
    const d=readSetup();
    if(!d) return;
    const event=window.SAGUN_EVENT || d.event_type || d.wedding_type || "tilak";
    const first=document.getElementById("firstPersonName");
    const second=document.getElementById("secondPersonName");
    const fp=document.getElementById("firstPersonPhoto");
    const sp=document.getElementById("secondPersonPhoto");
    const date=document.getElementById("eventDate");
    const welcome=document.getElementById("welcomeText");

    let n1=d.first_name || d.bride_name || "";
    let n2=d.second_name || d.groom_name || "";
    let p1=d.first_photo_url || d.bride_photo_url || "";
    let p2=d.second_photo_url || d.groom_photo_url || "";

    if(event==="tilak"){
      // तिलक: लड़का पहले, फिर "संग", फिर लड़की
      n1=d.groom_name || d.first_name || "";
      n2=d.bride_name || d.second_name || "";
      p1=d.groom_photo_url || d.first_photo_url || "";
      p2=d.bride_photo_url || d.second_photo_url || "";
    }
    if(event==="barat"){
      // बरात: लड़की पहले, फिर "संग", फिर लड़का
      n1=d.bride_name || d.first_name || "";
      n2=d.groom_name || d.second_name || "";
      p1=d.bride_photo_url || d.first_photo_url || "";
      p2=d.groom_photo_url || d.second_photo_url || "";
    }
    if(event==="reception"){
      // Reception: लड़का पहले, फिर "संग", फिर लड़की
      n1=d.groom_name || d.first_name || "";
      n2=d.bride_name || d.second_name || "";
      p1=d.groom_photo_url || d.first_photo_url || "";
      p2=d.bride_photo_url || d.second_photo_url || "";
    }

    if(first) first.textContent=n1;
    if(second) second.textContent=n2;
    if(fp){
      fp.src = p1 || "../assets/images/groom.jpg";
      fp.onerror = ()=>{ fp.onerror=null; fp.src="../assets/images/groom.jpg"; };
      fp.classList.toggle("has-photo",true);
    }
    if(sp){
      sp.src = p2 || "../assets/images/bride.jpg";
      sp.onerror = ()=>{ sp.onerror=null; sp.src="../assets/images/bride.jpg"; };
      sp.classList.toggle("has-photo",true);
    }
    if(date) date.textContent="दिनांक : "+(d.event_date||"");
    if(welcome) welcome.textContent=d.welcome_name ? "🙏 स्वागतकर्ता : "+d.welcome_name : "";
    const qr=document.getElementById("upiQrImage");
    if(qr && d.qr_url) qr.src=d.qr_url;
  }
  document.addEventListener("DOMContentLoaded", applyDualSetup);
})();
