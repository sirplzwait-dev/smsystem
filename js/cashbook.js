/* Extracted from cashbook.html - functionality unchanged */

  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-PSQRN0SV09');



function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("active");
}

const sb = window.supabase.createClient(
'https://rdlliurzgwwfjscgwssa.supabase.co',
'sb_publishable_HX1QmjO0SPyW3rUoihZkkQ_tRTE1bLc'
);

let currentUserId = null;

window.onload = async () => {
    const { data: { user } } = await sb.auth.getUser();
    if (false && !user) {
        // login disabled
        return;
    }
    currentUserId = user.id;
    loadSummary();
    loadHistory();
};

async function loadSummary(){
    if (!currentUserId) return;

    const {data:cashIn=[]} = await sb.from("cash_history")
        .select("amount")
        .eq("user_id", currentUserId)
        .eq("type","cash_in")
        .eq("status","active");
    let totalIn = 0;
    cashIn.forEach(x => { totalIn += Number(x.amount); });

    const {data:cashOut=[]} = await sb.from("cash_history")
        .select("amount")
        .eq("user_id", currentUserId)
        .eq("type","cash_out")
        .eq("status","active");
    let totalOut = 0;
    cashOut.forEach(x => { totalOut += Number(x.amount); });

    document.getElementById("cashInTotal").innerHTML = "₹" + totalIn.toLocaleString("en-IN");
    document.getElementById("cashOutTotal").innerHTML = "₹" + totalOut.toLocaleString("en-IN");
    document.getElementById("cashBalance").innerHTML = "₹" + (totalIn - totalOut).toLocaleString("en-IN");
}

document.getElementById("saveCashIn").onclick = async () => {
    if (!currentUserId) return;
    const person = document.getElementById("inPerson").value.trim();
    const purpose = document.getElementById("inPurpose").value.trim();
    const amount = Number(document.getElementById("inAmount").value);

    if(person == "" || amount <= 0){
        alert("Please enter Person Name and Amount.");
        return;
    }

    const {error} = await sb.from("cash_history").insert([{
        user_id: currentUserId,
        person,
        purpose,
        amount,
        type: "cash_in",
        status: "active"
    }]);

    if(error){ alert(error.message); return; }

    document.getElementById("inPerson").value = "";
    document.getElementById("inPurpose").value = "";
    document.getElementById("inAmount").value = "";
    loadSummary();
    loadHistory();
};

document.getElementById("saveCashOut").onclick = async () => {
    if (!currentUserId) return;
    const person = document.getElementById("outPerson").value.trim();
    const purpose = document.getElementById("outPurpose").value.trim();
    const amount = Number(document.getElementById("outAmount").value);

    if(person == "" || amount <= 0){
        alert("Please enter Person Name and Amount.");
        return;
    }

    const {error} = await sb.from("cash_history").insert([{
        user_id: currentUserId,
        person,
        purpose,
        amount,
        type: "cash_out",
        status: "active"
    }]);

    if(error){ alert(error.message); return; }

    document.getElementById("outPerson").value = "";
    document.getElementById("outPurpose").value = "";
    document.getElementById("outAmount").value = "";
    loadSummary();
    loadHistory();
};

async function loadHistory(){
    if (!currentUserId) return;

    const {data=[]} = await sb.from("cash_history")
        .select("*")
        .eq("user_id", currentUserId)
        .eq("status","active")
        .order("created_at",{ascending:false})
        .limit(100);
        
    const box = document.getElementById("historyList");
    box.innerHTML = "";

    if(data.length == 0){
        box.innerHTML = "No Record Found";
        return;
    }

    data.forEach(x => {
        box.innerHTML += `
        <div class="historyItem">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                <span><b>${x.type=="cash_in"?"🟢 Cash In":"🔴 Cash Out"}</b></span>
                <b style="font-size:13px;">₹${Number(x.amount).toLocaleString("en-IN")}</b>
            </div>
            <div><b>Person :</b> ${x.person}</div>
            ${x.purpose ? `<div><b>Purpose :</b> ${x.purpose}</div>` : ""}
            <div style="font-size:10px;color:#666;margin-top:3px;">${new Date(x.created_at).toLocaleString()}</div>
        </div>
        `;
    });
}

document.getElementById("logoutBtn").onclick = async () => {
    await sb.auth.signOut();
    if (window.SagunGuest && window.SagunGuest.isGuest()) { window.SagunGuest.logout(); return; }
    localStorage.clear();
    sessionStorage.clear();
    // login disabled
};

