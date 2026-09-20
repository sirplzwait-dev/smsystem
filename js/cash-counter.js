/* Extracted from cash-counter.html - functionality unchanged */

  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-PSQRN0SV09');



const sb = window.supabase.createClient(
"https://rdlliurzgwwfjscgwssa.supabase.co",
"sb_publishable_HX1QmjO0SPyW3rUoihZkkQ_tRTE1bLc"
);



function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("active");
}

const qtyInputs = document.querySelectorAll(".qty");
const target = document.getElementById("targetAmount");
const totalCash = document.getElementById("totalCash");
const difference = document.getElementById("difference");

function calculate(){
    let total = 0;
    qtyInputs.forEach(input=>{
        const note = Number(input.dataset.note);
        const qty = Number(input.value) || 0;
        const amount = note * qty;
        input.parentElement.nextElementSibling.innerHTML = "₹" + amount.toLocaleString("en-IN");
        total += amount;
    });
    totalCash.innerHTML = "₹" + total.toLocaleString("en-IN");
    const diff = dashboardCash - total;
    difference.innerHTML = "₹" + diff.toLocaleString("en-IN");
    const diffCard = difference.parentElement;
    if(diff == 0){
        difference.style.color = "#198754";
        diffCard.style.background = "#e8f5e9";
    } else if(diff > 0){
        difference.style.color = "#ff9800";
        diffCard.style.background = "#fff3cd";
    } else {
        difference.style.color = "#dc3545";
        diffCard.style.background = "#fdeaea";
    }
}

qtyInputs.forEach(input=>{ input.addEventListener("input", calculate); });
target.addEventListener("input", calculate);

document.querySelectorAll(".plus").forEach(btn=>{
    btn.onclick = function(){
        const input = this.previousElementSibling;
        input.value = Number(input.value || 0) + 1;
        calculate();
    };
});

document.querySelectorAll(".minus").forEach(btn=>{
    btn.onclick = function(){
        const input = this.nextElementSibling;
        let v = Number(input.value || 0);
        if(v > 0){ input.value = v - 1; }
        calculate();
    };
});

document.getElementById("resetBtn").onclick = function(){
    qtyInputs.forEach(input=>{
        input.value = 0;
        input.parentElement.nextElementSibling.innerHTML = "₹0";
    });
    target.value = "";
    calculate();
};

loadCurrentCash();

let dashboardCash = 0;

async function loadCurrentCash(){
    const {data:{user}} = await sb.auth.getUser();
    if(!user) return;

    // Cash Shagun
    const {data:guests=[]} = await sb
    .from("guests")
    .select("amount,payment_mode")
    .eq("user_id",user.id);

    const seen=new Set();
    guests=(guests||[]).filter(g=>{const k=[g.event_id||g.eventId||'',g.name||'',g.amount||0,g.payment_mode||g.paymentMode||''].map(v=>String(v).trim().toLowerCase()).join('|');if(seen.has(k))return false;seen.add(k);return true;});
    let cashShagun = 0;
    guests.forEach(g=>{
        if(g.payment_mode !== "UPI"){
            cashShagun += Number(g.amount);
        }
    });

    // Cash History
    const {data:history=[]} = await sb
    .from("cash_history")
    .select("amount,type")
    .eq("user_id",user.id)
    .eq("status","active");

    let cashIn = 0;
    let cashOut = 0;
    history.forEach(h=>{
        if(h.type === "cash_in") cashIn += Number(h.amount);
        if(h.type === "cash_out") cashOut += Number(h.amount);
    });

    dashboardCash = cashShagun - cashOut + cashIn;
    document.getElementById("targetAmount").value = "₹" + dashboardCash.toLocaleString("en-IN");
    calculate();
}

document.getElementById("logoutBtn").onclick = async () => {
    await sb.auth.signOut();
    if (window.SagunGuest && window.SagunGuest.isGuest()) { window.SagunGuest.logout(); return; }
    localStorage.clear();
    sessionStorage.clear();
    // login disabled
};

