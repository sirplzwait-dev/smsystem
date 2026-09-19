let type="cash";
function getSetup(){try{return JSON.parse(localStorage.getItem("eventSetupData")||localStorage.getItem("sagunSetup")||"{}")}catch(e){return{}}}
function loadSetup(){const d=getSetup();document.getElementById("groomName").textContent=d.groom_name||"लड़के का नाम";document.getElementById("brideName").textContent=d.bride_name||"लड़की का नाम";document.getElementById("eventDate").textContent=d.event_date||"__/__/____";document.getElementById("welcomeName").textContent=d.welcome_name||"____________"}
function openEntry(){document.getElementById("modal").classList.add("show")}
function closeEntry(){document.getElementById("modal").classList.remove("show")}
function setType(t){type=t;cashBtn.classList.toggle("active",t==="cash");giftBtn.classList.toggle("active",t==="gift");cashBox.classList.toggle("hide",t!=="cash");giftBox.classList.toggle("hide",t!=="gift")}
async function saveEntry(){const name=guestName.value.trim(),village=document.getElementById("village").value.trim();if(!name)return alert("कृपया नाम दर्ज करें।");if(!village)return alert("कृपया गाँव दर्ज करें।");let value;if(type==="cash"){value=amount.value;if(!value)return alert("कृपया राशि दर्ज करें।")}else{value=gift.value.trim();if(!value)return alert("कृपया Gift का विवरण दर्ज करें।")}const entry={id:(crypto.randomUUID ? crypto.randomUUID() : String(Date.now())+"-"+Math.random().toString(36).slice(2)),event_id:localStorage.getItem("currentEventId")||"",eventType:"engagement",event_type:"engagement",name,village,type,amount:type==="cash"?value:"",giftDescription:type==="gift"?value:"",event_date:getSetup().event_date||"",event_person:getSetup().groom_name||"",event_person_2:getSetup().bride_name||"",createdAt:new Date().toISOString()}; if(window.SagunStore) await window.SagunStore.addEntry(entry,{cloud:true}); else {const list=JSON.parse(localStorage.getItem("sagunEntries")||"[]");list.push(entry);localStorage.setItem("sagunEntries",JSON.stringify(list));}alert("✅ शगुन प्रविष्टि सेव हो गई।");closeEntry()}
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
