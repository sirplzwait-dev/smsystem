if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js');
  });
}



const sb = window.supabase.createClient(
'https://rdlliurzgwwfjscgwssa.supabase.co',
'sb_publishable_HX1QmjO0SPyW3rUoihZkkQ_tRTE1bLc'
);

document.addEventListener("DOMContentLoaded", async () => {
    const {
        data: { session }
    } = await sb.auth.getSession();
});



/* ==========================================
   OFFLINE TEST MODE
   Login/session requirement is disabled.
   ========================================== */
window.OFFLINE_TEST_MODE = true;
window.TEST_USER_ID = localStorage.getItem("test_user_id") || "offline-test-user";



const popup = document.getElementById("upiPopup");

document.getElementById("paymentMode").addEventListener("change", function(){
    if(this.value === "UPI"){
        popup.style.display = "flex";
    }else{
        popup.style.display = "none";
    }
});

document.getElementById("closePopup").onclick = function(){
    popup.style.display = "none";
};

document.addEventListener("keydown", function(e){
    if(e.key === "Escape"){
        popup.style.display = "none";
    }
});



window.onload = async function() {
    await loadSetup();
    updateMsg();

    if(navigator.onLine){
        syncData();
    }
};

window.addEventListener("online", () => {
    syncData();
});

const messages = [
"🙏 आपके शुभ आगमन के लिए हार्दिक धन्यवाद।",
"💐 हमारे शुभ विवाह समारोह में पधारने के लिए आपका बहुत-बहुत आभार।",
"❤️ आपकी उपस्थिति ने हमारे इस खास दिन को और भी खास बना दिया। धन्यवाद!",
"🙏 अपना बहुमूल्य समय निकालकर आने के लिए हृदय से धन्यवाद।",
"🌸 आपके स्नेह और आशीर्वाद के लिए कोटि-कोटि धन्यवाद।",
"💖 आपकी उपस्थिति हमारे लिए सम्मान और खुशी की बात है।",
"🙏 नवविवाहित जोड़े को अपना आशीर्वाद देने के लिए धन्यवाद।",
"🌹 आपके आने से हमारे समारोह की रौनक बढ़ गई। हार्दिक धन्यवाद।",
"✨ इस शुभ अवसर का हिस्सा बनने के लिए आपका हृदय से आभार।",
"🙏 आपके प्यार, स्नेह और आशीर्वाद के लिए धन्यवाद।",
"💐 आपकी मौजूदगी हमारे लिए किसी उपहार से कम नहीं।",
"❤️ शुभ विवाह में आपका स्वागत और आपके आगमन के लिए धन्यवाद।",
"🌸 आपके शुभ कदमों से हमारा समारोह धन्य हुआ। धन्यवाद!",
"🙏 नवदंपति को आशीर्वाद देने के लिए आपका बहुत-बहुत धन्यवाद।",
"💖 आपकी उपस्थिति ने इस यादगार दिन को और यादगार बना दिया।",
"🌹 आपके स्नेह और शुभकामनाओं के लिए दिल से धन्यवाद।",
"🙏 हमारे परिवार की खुशी में शामिल होने के लिए आभार।",
"✨ आपके आने से खुशियों में चार चाँद लग गए। धन्यवाद!",
"💐 इस मंगल अवसर पर आपका हार्दिक स्वागत एवं अभिनंदन।",
"❤️ आपका आना हमारे लिए सौभाग्य की बात है। धन्यवाद।",
"🙏 आपकी शुभकामनाएँ और आशीर्वाद हमारे लिए अमूल्य हैं।",
"🌸 हमारे इस पावन अवसर पर पधारने के लिए हृदय से आभार।",
"💖 आपकी मुस्कान और शुभकामनाओं ने समारोह को खूबसूरत बना दिया।",
"🙏 हमारे सुख-दुःख और खुशी में साथ देने के लिए धन्यवाद।",
"🌹 आपके प्रेम और आशीर्वाद के लिए सादर धन्यवाद।",
"✨ आपकी उपस्थिति हमारे लिए सबसे सुंदर उपहार है।",
"💐 इस नई शुरुआत के साक्षी बनने के लिए धन्यवाद।",
"❤️ नवदंपति के जीवन में खुशियों की कामना करने के लिए आभार।",
"🙏 आपका आगमन हमारे लिए हर्ष और गौरव का विषय है।",
"🌸 शुभ विवाह समारोह में आपका हार्दिक अभिनंदन।",
"💖 आपके आशीर्वाद से यह शुभ अवसर और भी मंगलमय हुआ। धन्यवाद।",
"🙏 आपकी उपस्थिति और शुभकामनाओं के लिए हृदय से आभार।",
"🌹 रिश्तों की इस खूबसूरत खुशी में शामिल होने के लिए धन्यवाद।",
"✨ आपकी मौजूदगी ने हमारी खुशियों को पूरा कर दिया।",
"💐 पधारने के लिए धन्यवाद, आपका स्नेह सदैव याद रहेगा।",
"❤️ आपके प्यार और आशीर्वाद के लिए परिवार की ओर से धन्यवाद।",
"🙏 शुभ अवसर पर अपनी उपस्थिति दर्ज कराने के लिए आभार।",
"🌸 आपका स्वागत है, आपका आना हमारे लिए बेहद खास है।",
"💖 आपके शुभाशीष नवदंपति के जीवन को सदैव सुखमय बनाएं। धन्यवाद।",
"🙏 आपकी उपस्थिति के लिए सादर धन्यवाद एवं आभार।",
"🌹 इस खुशी के अवसर पर हमारे साथ कदम से कदम मिलाने के लिए धन्यवाद।",
"✨ आपकी शुभकामनाएँ इस नए सफर की खूबसूरत शुरुआत हैं।",
"💐 आपके आने से आज का दिन और भी यादगार बन गया।",
"❤️ दिल से स्वागत, दिल से धन्यवाद।",
"🙏 आपके आशीर्वाद से यह शुभ विवाह सफल और मंगलमय हो।",
"🌸 हमारे परिवार की खुशी में शामिल होने के लिए बहुत-बहुत धन्यवाद।",
"💖 आपकी उपस्थिति हमारे लिए अनमोल है।",
"🙏 प्रेम, स्नेह और आशीर्वाद देने के लिए आपका आभार।",
"🌹 शुभ विवाह के इस पावन अवसर पर आपका हार्दिक स्वागत है।",
"🎉 आए, खुशियाँ बाँटीं और यादें बना गए—बहुत-बहुत धन्यवाद!"
];

let i = 0;
function updateMsg() {
    const msgDisplay = document.getElementById("msgDisplay");
    if (!msgDisplay) return;

    msgDisplay.classList.remove("animate__fadeIn");
    msgDisplay.classList.add("animate__fadeOut");

    setTimeout(() => {
        msgDisplay.innerText = messages[i];
        i = (i + 1) % messages.length;
        msgDisplay.classList.remove("animate__fadeOut");
        msgDisplay.classList.add("animate__fadeIn");
    }, 350);
}
setInterval(updateMsg, 5000);

async function saveGuest() {
    let userId = "offline-user";
    try {
        const { data:{ user } } = await sb.auth.getUser();
        if(user){
            userId = user.id;
        }
    } catch(e){
        console.log("Offline Mode");
    }

    const name = document.getElementById('guestName').value.toUpperCase();
    const amount = document.getElementById('guestAmount').value;
    const state = document.getElementById('guestState').value || "Bihar";
    const dist = document.getElementById('guestDist').value || "Gopalganj";
    const village = document.getElementById('guestVillage').value.toUpperCase();
    const mode = document.getElementById('paymentMode').value;
    
    if(name === ""){
        alert("कृपया नाम दर्ज करें!");
        return;
    }

    if(amount === "" || amount <= 0){
        alert("कृपया शगुन राशि दर्ज करें!");
        return;
    }
        
    const entryId=crypto.randomUUID ? crypto.randomUUID() : String(Date.now())+'-'+Math.random().toString(36).slice(2);
    const setup=(()=>{try{return JSON.parse(localStorage.getItem("eventSetupData") || localStorage.getItem("sagunSetup") || "{}")}catch(_){return {}}})();
    const canonicalRecord={
       id:entryId,user_id:userId,name,amount:Number(amount),state,district:dist,village,payment_mode:mode,
       event_type:(localStorage.getItem("currentMarriageEvent") || "barat"),
       event_id:localStorage.getItem("currentEventId") || "",eventId:localStorage.getItem("currentEventId") || "",
       event_date:setup.event_date||"",event_person:setup.groom_name||"",event_person_2:setup.bride_name||""
    };
    if(window.SagunStore) await window.SagunStore.addEntry(canonicalRecord);
    else {
      const guests=JSON.parse(localStorage.getItem("offlineGuests") || "[]");
      guests.push(canonicalRecord); localStorage.setItem("offlineGuests",JSON.stringify(guests));
    }

    if(navigator.onLine){
        await syncData();
    }

    const thankYouDiv = document.getElementById('thankYouMsg');
    thankYouDiv.style.display = "block";
    thankYouDiv.innerHTML = `🙏 ${name} जी, आपका ₹${amount} शगुन सफलतापूर्वक जमा हुआ। धन्यवाद आपका!`;

    setTimeout(() => {
        thankYouDiv.style.display = "none";
    }, 5000);

    document.getElementById('guestName').value = "";
    document.getElementById('guestAmount').value = "";
    document.getElementById('guestVillage').value = "";
    document.getElementById('guestName').focus();
}

async function loadSetup(){
    let data = null;

    try {
        const result = await sb.auth.getUser();
        const user = result.data.user;

        if (user) {
            const res = await sb.from("setup").select("*").eq("user_id", user.id).single();
            if (res.data) {
                data = res.data;
                localStorage.setItem("offlineSetupData", JSON.stringify(data));
            }
        }
    } catch (e) {
        console.log("Network error or offline, loading from local storage.");
    }

    if (!data) {
        const localData = localStorage.getItem("offlineSetupData");
        if (localData) {
            data = JSON.parse(localData);
        }
    }

    if (!data) {
        console.log("No setup data found offline or online.");
        document.getElementById("pageLoader").style.display = "none";
        return;
    }

    document.getElementById("dateDisplay").innerHTML = "दिनांक : " + (data.event_date || "");

    const titleDisplay = document.getElementById("mainTitleText");
    const firstPhoto = document.getElementById("firstPhoto");
    const firstLabel = document.getElementById("firstLabel");
    const firstName = document.getElementById("firstName");
    
    const secondPhoto = document.getElementById("secondPhoto");
    const secondLabel = document.getElementById("secondLabel");
    const secondName = document.getElementById("secondName");
    // एक ही Entry Page: Tilak / Barat / Reception dynamic
    const eventType = String(data.event_type || data.wedding_type || "").toLowerCase();

    const eventConfig = {
        sagai:     {title:"💍 शुभ सगाई / रोका", first:"groom", firstLabel:"चिरंजीवी", second:"bride", secondLabel:"आयुष्मती"},
        haldi:     {title:"🌼 शुभ हल्दी समारोह", first:"groom", firstLabel:"चिरंजीवी", second:"bride", secondLabel:"आयुष्मती"},
        mehndi:    {title:"🌿 शुभ मेहंदी समारोह", first:"bride", firstLabel:"आयुष्मती", second:"groom", secondLabel:"चिरंजीवी"},
        sangeet:   {title:"🎶 शुभ संगीत समारोह", first:"groom", firstLabel:"चिरंजीवी", second:"bride", secondLabel:"आयुष्मती"},
        tilak:     {title:"🪔 शुभ तिलक", first:"groom", firstLabel:"चिरंजीवी", second:"bride", secondLabel:"आयुष्मती"},
        barat:     {title:"🥁 शुभ बरात", first:"bride", firstLabel:"आयुष्मती", second:"groom", secondLabel:"चिरंजीवी"},
        reception: {title:"🎉 शुभ Reception", first:"groom", firstLabel:"चिरंजीवी", second:"bride", secondLabel:"आयुष्मती"},
        vidaai:    {title:"🚗 शुभ विदाई समारोह", first:"bride", firstLabel:"आयुष्मती", second:"groom", secondLabel:"चिरंजीवी"}
    };

    const cfg = eventConfig[eventType] || eventConfig.tilak;
    titleDisplay.innerHTML = cfg.title;
    document.title = cfg.title.replace(/<[^>]*>/g, "") + " | Sagun Management System";

    const people = {
        groom:{photo:data.groom_photo_url || "../assets/images/groom.jpg",name:data.groom_name || ""},
        bride:{photo:data.bride_photo_url || "../assets/images/bride.jpg",name:data.bride_name || ""}
    };
    firstPhoto.src = people[cfg.first].photo;
    firstLabel.innerHTML = cfg.firstLabel;
    firstName.innerHTML = people[cfg.first].name;
    secondPhoto.src = people[cfg.second].photo;
    secondLabel.innerHTML = cfg.secondLabel;
    secondName.innerHTML = people[cfg.second].name;

    localStorage.setItem("currentMarriageEvent", eventType);

    // Setup से स्वागतकर्ता का नाम।
    const welcomeBy = document.getElementById("welcomeByDisplay");
    if(welcomeBy){
        welcomeBy.innerText = data.welcome_name ? "— स्वागतकर्ता : " + data.welcome_name : "";
    }

    if(data.qr_url){
        document.getElementById("upiQrImage").src = data.qr_url;
    }

    const loader = document.getElementById("pageLoader");
    if(loader) {
        loader.style.opacity = "0";
        setTimeout(() => {
            loader.style.display = "none";
        }, 500);
    }
}
    
async function syncData(){
    if(window.SagunStore) return;
    if(!navigator.onLine){
       return;
    }

    let guests = JSON.parse(localStorage.getItem("offlineGuests") || "[]");

    for(let g of guests){
        const result = await sb.auth.getUser();

        if(result.data && result.data.user){
           g.user_id = result.data.user.id;
        }
        if(!g.user_id || g.user_id === "offline-user"){
           continue;
        }
          
        const guestData = {
          id: g.id || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())+'-'+Math.random().toString(36).slice(2)),
          user_id: g.user_id,
          name: g.name,
          amount: g.amount,
          state: g.state,
          district: g.district,
          village: g.village,
          payment_mode: g.payment_mode,
          event_type: g.event_type || localStorage.getItem("currentMarriageEvent") || "barat",
          event_id: g.event_id || localStorage.getItem("currentEventId") || null,
          event_date: g.event_date || null,
          event_person: g.event_person || null,
          event_person_2: g.event_person_2 || null
        };

        const { error } = await sb.from("guests").insert([guestData]);

        if(error){
           console.log("FULL ERROR =", error);
           return;
        }
    }

    localStorage.removeItem("offlineGuests");
}

document.getElementById("logoutBtn").onclick = async () => {
    await sb.auth.signOut();
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace("login.html");
};
