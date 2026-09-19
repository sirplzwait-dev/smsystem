function setupData(){
  try{
    return JSON.parse(
      localStorage.getItem("eventSetupData") ||
      localStorage.getItem("sagunSetup") || "{}"
    );
  }catch(e){return {}}
}
function loadSetup(){
  const d=setupData();
  document.getElementById("groomName").textContent=d.groom_name||"";
  document.getElementById("brideName").textContent=d.bride_name||"";
  document.getElementById("eventDate").textContent=d.event_date?"दिनांक : "+d.event_date:"";
  document.getElementById("welcomeText").textContent=d.welcome_name?"- "+d.welcome_name:"";
  function assetUrl(value, fallback){
    if(!value) return fallback;
    if(value.startsWith("data:") || value.startsWith("blob:") || value.startsWith("http://") || value.startsWith("https://")) return value;
    if(value.startsWith("../") || value.startsWith("./")) return value;
    return "../" + value.replace(/^\/+/, "");
  }

  const groom = document.getElementById("groomPhoto");
  const bride = document.getElementById("bridePhoto");
  const qr = document.getElementById("qrImage");

  groom.src = assetUrl(d.groom_photo_url, "../assets/images/groom.jpg");
  bride.src = assetUrl(d.bride_photo_url, "../assets/images/bride.jpg");

  groom.onerror = () => { groom.onerror=null; groom.src="../assets/images/groom.jpg"; };
  bride.onerror = () => { bride.onerror=null; bride.src="../assets/images/bride.jpg"; };

  if(d.qr_url){
    qr.src = assetUrl(d.qr_url, "");
  } else {
    qr.style.display="none";
  }
}
async function saveEntry(){
  const name=document.getElementById("guestName").value.trim();
  const amount=document.getElementById("amount").value;
  if(!name){alert("कृपया नाम दर्ज करें।");return}
  if(!amount){alert("कृपया शगुन की राशि दर्ज करें।");return}
  const entry={
    id:Date.now(),
    eventType:"tilak",
    event_id:localStorage.getItem("currentEventId") || "",
    eventId:localStorage.getItem("currentEventId") || "",
    event_type:"tilak",
    event_date:setupData().event_date || "",
    event_person:setupData().groom_name || "",
    event_person_2:setupData().bride_name || "",
    name,
    state:document.getElementById("state").value.trim(),
    district:document.getElementById("district").value.trim(),
    village:document.getElementById("village").value.trim(),
    amount,
    paymentMode:document.getElementById("paymentMode").value,
    createdAt:new Date().toISOString()
  };
  if(window.SagunStore) await window.SagunStore.addEntry(entry);
  else { const list=JSON.parse(localStorage.getItem("sagunEntries")||"[]"); list.push(entry); localStorage.setItem("sagunEntries",JSON.stringify(list)); }
  alert("✅ Entry सफलतापूर्वक सेव हो गई।");
  resetForm();
}
function resetForm(){
  ["guestName","state","district","village","amount"].forEach(id=>document.getElementById(id).value="");
  document.getElementById("paymentMode").value="Cash";
}
document.addEventListener("DOMContentLoaded",loadSetup);
