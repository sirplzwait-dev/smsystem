const sb = window.supabase.createClient(
  "https://rdlliurzgwwfjscgwssa.supabase.co",
  "sb_publishable_HX1QmjO0SPyW3rUoihZkkQ_tRTE1bLc"
);

let birthdaySetup = null;

async function loadBirthday() {
  try {
    const local = localStorage.getItem("birthdaySetup");
    if (local) birthdaySetup = JSON.parse(local);
  } catch (_) {}

  try {
    const {data:{user}} = await sb.auth.getUser();
    if (user) {
      const {data} = await sb.from("setup").select("*")
        .eq("user_id",user.id).eq("wedding_type","birthday").maybeSingle();
      if (data) {
        birthdaySetup = {
          name:data.groom_name || birthdaySetup?.name || "",
          gender:birthdaySetup?.gender || "boy",
          photo_url:data.groom_photo_url || birthdaySetup?.photo_url || "",
          event_date:data.event_date || birthdaySetup?.event_date || "",
          welcome_name:data.welcome_name || birthdaySetup?.welcome_name || ""
        };
        localStorage.setItem("birthdaySetup",JSON.stringify(birthdaySetup));
      }
    }
  } catch(e) {}

  if (!birthdaySetup?.name) {
    alert("Birthday setup नहीं मिला। पहले Birthday Setup करें।");
    location.replace("birthday-setup.html");
    return;
  }

  document.getElementById("birthdayPersonName").textContent = birthdaySetup.name;
  document.getElementById("birthdayPersonPhoto").src =
    birthdaySetup.photo_url || "../assets/images/groom.jpg";
  document.getElementById("birthdayWish").textContent =
    birthdaySetup.event_date
      ? `दिनांक: ${birthdaySetup.event_date} • जन्मदिन की ढेरों शुभकामनाएँ 🎂❤️`
      : "जन्मदिन की ढेरों शुभकामनाएँ 🎂❤️";
}

document.getElementById("birthdaySubmit").addEventListener("click", saveBirthdayEntry);

async function saveBirthdayEntry() {
  const name = document.getElementById("guestName").value.trim();
  const village = document.getElementById("guestVillage").value.trim();
  const giftType = document.getElementById("giftType").value;
  const description = document.getElementById("giftDescription").value.trim();
  const amount = Number(document.getElementById("giftAmount").value || 0);

  if (!name) return showMsg("कृपया नाम दर्ज करें।", true);
  if (!village) return showMsg("कृपया गाँव दर्ज करें।", true);
  if (giftType === "Gift" && !description) return showMsg("Gift का विवरण लिखें।", true);
  if (giftType === "Cash Gift" && amount <= 0) return showMsg("Cash Gift की राशि दर्ज करें।", true);

  const activeEvent = (()=>{
    try { return JSON.parse(localStorage.getItem("sgunmsActiveEvent") || "null"); } catch(e){ return null; }
  })();
  const eventId = (activeEvent && activeEvent.id) || localStorage.getItem("currentEventId") || "";

  const entry = {
    id: Date.now(), name, village, gift_type:giftType,
    gift_description:description, amount,
    payment_mode:giftType === "Cash Gift" ? "Cash" : "Gift",
    event_type:"birthday", event_person:birthdaySetup.name,
    event_date:birthdaySetup.event_date || "", event_id:eventId,
    eventId:eventId, created_at:new Date().toISOString()
  };

  if(window.SagunStore) await window.SagunStore.addEntry(entry);
  else { const local = JSON.parse(localStorage.getItem("birthdayEntries") || "[]"); local.unshift(entry); localStorage.setItem("birthdayEntries",JSON.stringify(local)); }

  try {
    const {data:{user}} = await sb.auth.getUser();
    if (user) {
      await sb.from("guests").insert([{
        id:entry.id, user_id:user.id, name, amount, state:"Bihar",
        district:"", village,
        payment_mode:giftType === "Cash Gift" ? "Cash" : "Gift",
        event_id:eventId || null, event_type:"birthday",
        event_person:birthdaySetup.name || null, event_date:birthdaySetup.event_date || null,
        gift_type:giftType, gift_description:description || null
      }]);
    }
  } catch(e) {}

  showMsg(`✅ ${name} की ${giftType} entry दर्ज हो गई।`,false);
  document.getElementById("guestName").value="";
  document.getElementById("guestVillage").value="";
  document.getElementById("giftDescription").value="";
  document.getElementById("giftAmount").value="";

  setTimeout(() => location.replace("home.html"),900);
}

function showMsg(msg,error) {
  const el=document.getElementById("birthdayMessage");
  el.style.display="block";
  el.textContent=msg;
  el.style.background=error ? "#fff0f0" : "#eaf8ee";
  el.style.color=error ? "#a22" : "#18733a";
}

document.getElementById("birthdayLogout").onclick=async()=>{
  if(window.SagunGuest && window.SagunGuest.isGuest()){ window.SagunGuest.logout(); return; }
  await sb.auth.signOut();
  location.href="login.html";
};

window.addEventListener("DOMContentLoaded",loadBirthday);
