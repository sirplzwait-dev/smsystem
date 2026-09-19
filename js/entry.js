/* Extracted from entry.html - functionality unchanged */


const sb = (window.supabase && typeof window.supabase.createClient === 'function') ? window.supabase.createClient('https://rdlliurzgwwfjscgwssa.supabase.co','sb_publishable_HX1QmjO0SPyW3rUoihZkkQ_tRTE1bLc') : null;

document.addEventListener("DOMContentLoaded", async () => {
    if (sb) { try { await sb.auth.getSession(); } catch(e) {} }
});



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

    if(navigator.onLine && sb){
        syncData();
    }
};

window.addEventListener("online", () => {
    syncData();
});

const messages = ["हमारे विशेष अवसर पर पधारने हेतु आपका हार्दिक स्वागत है।", "आपकी गरिमामयी उपस्थिति हमारे लिए सौभाग्य का विषय है।", "आपके स्नेह और आशीर्वाद के लिए हम हृदय से आभारी हैं।"]; 
let i = 0;
function updateMsg() {
    const msgDisplay = document.getElementById('msgDisplay');
    msgDisplay.classList.remove('animate__fadeIn');
    msgDisplay.classList.add('animate__fadeOut');
    setTimeout(() => {
        msgDisplay.innerText = messages[i];
        i = (i + 1) % messages.length;
        msgDisplay.classList.remove('animate__fadeOut');
        msgDisplay.classList.add('animate__fadeIn');
    }, 500);
}
setInterval(updateMsg, 5000);

async function saveGuest() {
    let userId = "offline-user";
    try {
        const { data:{ user } } = sb ? await sb.auth.getUser() : {data:{user:null}};
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
        
    let guests = window.SagunStore ? [] : JSON.parse(localStorage.getItem("offlineGuests") || "[]");

    const entryRecord={
       id:crypto.randomUUID ? crypto.randomUUID() : String(Date.now())+'-'+Math.random().toString(36).slice(2),
       user_id:userId,
       name:name,
       amount:Number(amount),
       state:state,
       district:dist,
       village:village,
       payment_mode:mode,
       event_id:localStorage.getItem("currentEventId")||"",
       event_type:localStorage.getItem("currentMarriageEvent")||"barat"
    };
    if(window.SagunStore){ await window.SagunStore.addEntry(entryRecord); }
    else { guests.push(entryRecord); localStorage.setItem("offlineGuests", JSON.stringify(guests)); }

    if(navigator.onLine && sb){
        await syncData();
    }

    const thankYouDiv = document.getElementById('thankYouMsg');
    thankYouDiv.style.display = "block";
    thankYouDiv.innerHTML = `${name} जी, आपका ${mode} से ₹${amount} शगुन सफलतापूर्वक जमा हुआ।`;

    setTimeout(() => {
        thankYouDiv.style.display = "none";
    }, 5000);

    document.getElementById('guestName').value = "";
    document.getElementById('guestAmount').value = "";
    document.getElementById('guestVillage').value = "";
    document.getElementById('guestName').focus();
}

async function loadSetup(){
    let data=null;
    try{ data=JSON.parse(localStorage.getItem("offlineSetupData")||"null"); }catch(e){}
    if(!data){
      try{ data=JSON.parse(localStorage.getItem("eventSetupData")||"null"); }catch(e){}
    }
    if(!data){
      if(document.getElementById("pageLoader")) document.getElementById("pageLoader").style.display="none";
      return;
    }
    const type=data.event_type||data.wedding_type||"tilak";
    const titleMap={tilak:"शुभ तिलक",barat:"शुभ बरात",reception:"शुभ Reception",birthday:"🎂 Happy Birthday",anniversary:"❤️ Happy Anniversary",engagement:"💑 शुभ सगाई",griha_pravesh:"🏠 शुभ गृह प्रवेश",mundan:"👶 शुभ मुंडन",namkaran:"🍼 शुभ नामकरण",puja:"🪔 शुभ पूजा",retirement:"🎓 शुभ विदाई",other:"🎉 शुभ समारोह"};
    const labelMap={tilak:["चिरंजीवी","आयुष्मती"],barat:["आयुष्मती","चिरंजीवी"],reception:["चिरंजीवी","आयुष्मती"],birthday:["Birthday Boy / Girl",""]};
    const firstName=data.first_name || data.groom_name || "";
    const secondName=data.second_name || data.bride_name || "";
    document.getElementById("dateDisplay").innerHTML="दिनांक : "+(data.event_date||"");
    const title=document.getElementById("mainTitleText"); if(title) title.innerHTML=titleMap[type]||"शुभ समारोह";
    const sig=document.querySelector(".signature"); if(sig) sig.innerHTML="";
    const fp=document.getElementById("firstPhoto"), sp=document.getElementById("secondPhoto");
    const fn=document.getElementById("firstName"), sn=document.getElementById("secondName");
    const fl=document.getElementById("firstLabel"), sl=document.getElementById("secondLabel");
    if(fn) fn.innerHTML=firstName; if(sn) sn.innerHTML=secondName;
    if(fl) fl.innerHTML=(labelMap[type]||["मुख्य व्यक्ति","दूसरा पक्ष"])[0]; if(sl) sl.innerHTML=(labelMap[type]||["मुख्य व्यक्ति","दूसरा पक्ष"])[1];
    if(fp){fp.src=data.first_photo_url||""; fp.style.display=data.first_photo_url?"block":"none";}
    if(sp){sp.src=data.second_photo_url||""; sp.style.display=data.second_photo_url?"block":"none"; if(type==='birthday') sp.parentElement.style.display='none';}
    if(type==='birthday' && sp){const sang=sp.closest('.sang-elegant');if(sang)sang.style.display='none';}
    if(data.qr_url && document.getElementById("upiQrImage")) document.getElementById("upiQrImage").src=data.qr_url;
    const loader=document.getElementById("pageLoader");if(loader){loader.style.opacity="0";setTimeout(()=>loader.style.display="none",300);}
}

async function syncData(){
    if(!navigator.onLine || !sb){
       return;
    }

    if(window.SagunStore) return;
    let guests = JSON.parse(localStorage.getItem("offlineGuests") || "[]");

    for(let g of guests){
        const result = sb ? await sb.auth.getUser() : {data:{user:null}};

        if(result.data && result.data.user){
           g.user_id = result.data.user.id;
        }
        if(!g.user_id || g.user_id === "offline-user"){
           continue;
        }
          
        const guestData = {
          user_id: g.user_id,
          name: g.name,
          amount: g.amount,
          state: g.state,
          district: g.district,
          village: g.village,
          payment_mode: g.payment_mode
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
    if(sb) await sb.auth.signOut();
    if (window.SagunGuest && window.SagunGuest.isGuest()) { window.SagunGuest.logout(); return; }
    localStorage.clear();
    sessionStorage.clear();
    // login disabled
};

