let type="cash";

async function getSetup(){
  let d={};
  try{ d=JSON.parse(localStorage.getItem("eventSetupData")||localStorage.getItem("sagunSetup")||"{}")||{} }catch(e){}
  const eventId=String(new URLSearchParams(location.search).get("event_id")||localStorage.getItem("currentEventId")||"").trim();
  if(eventId && window.SagunStore?.getEvents){
    try{
      const events=await window.SagunStore.getEvents();
      const ev=(events||[]).find(x=>String(x?.id||x?.eventId||"")===eventId);
      if(ev) d={...d,...ev};
    }catch(e){ console.warn("Engagement setup:",e); }
  }
  return d;
}

async function loadSetup(){
  const d=await getSetup();
  const groom=d.groom_name||d.groomName||d.person1||d.first_name||d.firstName||"लड़के का नाम";
  const bride=d.bride_name||d.brideName||d.person2||d.second_name||d.secondName||"लड़की का नाम";
  const date=d.event_date||d.eventDate||"__/__/____";
  const host=d.welcome_name||d.welcomeName||d.host||"____________";
  document.getElementById("groomName").textContent=groom;
  document.getElementById("brideName").textContent=bride;
  document.getElementById("eventDate").textContent=date;
  document.getElementById("welcomeName").textContent=host;
}

function openEntry(){document.getElementById("modal").classList.add("show")}
function closeEntry(){document.getElementById("modal").classList.remove("show")}
function setType(t){type=t;cashBtn.classList.toggle("active",t==="cash");giftBtn.classList.toggle("active",t==="gift");cashBox.classList.toggle("hide",t!=="cash");giftBox.classList.toggle("hide",t!=="gift")}

async function saveEntry(){
  const name=guestName.value.trim(),village=document.getElementById("village").value.trim();
  if(!name)return alert("कृपया नाम दर्ज करें।");
  if(!village)return alert("कृपया गाँव दर्ज करें।");
  let value;
  if(type==="cash"){value=amount.value;if(!value)return alert("कृपया राशि दर्ज करें।")}
  else{value=gift.value.trim();if(!value)return alert("कृपया Gift का विवरण दर्ज करें।")}

  const d=await getSetup();
  const eventId=String(localStorage.getItem("currentEventId")||new URLSearchParams(location.search).get("event_id")||"").trim();
  const entry={
    id:(crypto.randomUUID ? crypto.randomUUID() : String(Date.now())+"-"+Math.random().toString(36).slice(2)),
    event_id:eventId,eventId,
    eventType:"engagement",event_type:"engagement",
    name,village,type,amount:type==="cash"?Number(value):0,
    giftDescription:type==="gift"?value:"",gift_description:type==="gift"?value:"",
    paymentMode:type==="cash"?"CASH":"GIFT",payment_mode:type==="cash"?"CASH":"GIFT",
    event_date:d.event_date||d.eventDate||"",
    event_person:d.groom_name||d.groomName||d.person1||d.first_name||"",
    event_person_2:d.bride_name||d.brideName||d.person2||d.second_name||"",
    createdAt:new Date().toISOString(),created_at:new Date().toISOString()
  };

  try{
    if(window.SagunStore) await window.SagunStore.addEntry(entry,{cloud:true});
    else{
      const list=JSON.parse(localStorage.getItem("sagunEntries")||"[]");
      list.push(entry);localStorage.setItem("sagunEntries",JSON.stringify(list));
    }
    closeEntry();
    guestName.value=""; village.value=""; amount.value=""; gift.value="";
    showEntrySuccess(name,value,type,d);
  }catch(e){
    console.error(e);
    alert("Entry save नहीं हो सकी। कृपया फिर कोशिश करें।");
  }
}

function showEntrySuccess(name,value,entryType,d){
  const old=document.getElementById("engagementSuccess");
  if(old)old.remove();
  const box=document.createElement("div");
  box.id="engagementSuccess";
  box.className="engagement-success";
  box.innerHTML=`
    <div class="success-icon">✓</div>
    <h3>शगुन प्रविष्टि सफल रही 🎉</h3>
    <p><strong>${String(name).replace(/[<>&"]/g,"")}</strong> की entry सुरक्षित हो गई।</p>
    <p>${entryType==="cash" ? "राशि" : "उपहार"}: <strong>${entryType==="cash" ? "₹"+Number(value).toLocaleString("en-IN") : String(value).replace(/[<>&"]/g,"")}</strong></p>
    <small>यह entry अभी इस device में सुरक्षित है और internet मिलने पर background में sync होगी।</small>
    <button type="button" onclick="this.closest('#engagementSuccess').remove()">ठीक है</button>`;
  document.body.appendChild(box);
  setTimeout(()=>box.remove(),4500);
}

document.addEventListener("DOMContentLoaded",loadSetup);

// Engagement background slideshow: changes every 30 seconds with a soft fade.
document.addEventListener("DOMContentLoaded", () => {
  const page = document.querySelector(".page");
  if (!page) return;
  const bg2 = new Image();
  bg2.src = "../assets/sagai-engagement-background-2.png";
  setInterval(() => {
    page.classList.toggle("bg-two");
  }, 30000);
});

// ===== Romantic photo background slideshow =====
// Six supplied engagement photos rotate automatically every 30 seconds.
document.addEventListener("DOMContentLoaded", () => {
  const page = document.querySelector(".page");
  if (!page) return;

  const backgrounds = [
    "../assets/engagement-photo-01.png",
    "../assets/engagement-photo-02.png",
    "../assets/engagement-photo-03.png",
    "../assets/engagement-photo-04.png",
    "../assets/engagement-photo-05.png",
    "../assets/engagement-photo-06.png"
  ];

  backgrounds.forEach(src => { const img = new Image(); img.src = src; });

  let index = 0;
  page.style.setProperty("--engagement-bg", `url("${backgrounds[index]}")`);

  setInterval(() => {
    index = (index + 1) % backgrounds.length;
    page.style.setProperty("--engagement-bg", `url("${backgrounds[index]}")`);
  }, 30000);
});
