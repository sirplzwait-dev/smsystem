/* Extracted from report.html - functionality unchanged */

  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-PSQRN0SV09');



function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("active");
}

const sb = window.supabase.createClient(
"https://rdlliurzgwwfjscgwssa.supabase.co",
"sb_publishable_HX1QmjO0SPyW3rUoihZkkQ_tRTE1bLc"
);

let reportData = [];
let shagunChartInstance = null;
let isChartVisible = false;

function safeLocalArray(key){
    try{
        const value = JSON.parse(localStorage.getItem(key) || "[]");
        return Array.isArray(value) ? value : [];
    }catch(e){ return []; }
}

// Collect every type of Shagun/Guest entry created by the existing Entry pages.
// Nothing is removed from the original entry storage; Report simply reads them all.
function getOfflineGuests(){
    const sources = [
        "offlineGuests",      // main / Barat / generic / Griha Pravesh
        "eventEntries",       // event + Anniversary
        "sagunEntries",       // Tilak / Reception / Engagement
        "birthdayEntries",    // Birthday (newer format)
        "birthdayGuests"      // Birthday (current legacy page)
    ];

    const all = [];
    sources.forEach(key => safeLocalArray(key).forEach(row => {
        const g = {...row};
        g.name = g.name || g.guestName || "";
        g.village = g.village || g.guestVillage || "";
        g.state = g.state || "Bihar";
        g.district = g.district || "";
        g.amount = Number(g.amount || g.cashAmount || 0) || 0;
        g.payment_mode = g.payment_mode || g.paymentMode ||
            (String(g.type || "").toLowerCase()==="cash" ? "CASH" :
             String(g.gift_type || "").toLowerCase()==="cash" ? "CASH" :
             String(g.type || "").toLowerCase()==="upi" ? "UPI" : "GIFT");
        g.event_type = g.event_type || g.eventType || "other";
        g.event_id = g.event_id || g.eventId || g.eventID || "";
        g.event_person = g.event_person || g.eventPerson || g.birthday_name || g.personName || "";
        g.event_date = g.event_date || g.eventDate || "";
        g.created_at = g.created_at || g.createdAt || g.timestamp || new Date().toISOString();
        all.push(g);
    }));

    return all;
}

function reportRecordKey(g){
    // Stable id prevents Anniversary's two local copies from appearing twice.
    if(g.id !== undefined && g.id !== null) return `id:${g.id}`;
    const name = String(g.name || "").trim().toUpperCase();
    const village = String(g.village || "").trim().toUpperCase();
    const amount = Number(g.amount || 0);
    const mode = String(g.payment_mode || "").toUpperCase();
    const event = String(g.event_type || "").toLowerCase();
    const time = String(g.created_at || g.createdAt || g.timestamp || "");
    return `row:${name}|${village}|${amount}|${mode}|${event}|${time}`;
}

function eventLabel(type){
    const map = {
        tilak:"🪔 Tilak",
        barat:"🥁 Barat",
        reception:"🎉 Reception",
        birthday:"🎂 Birthday",
        anniversary:"💐 Anniversary",
        engagement:"💍 Engagement",
        griha_pravesh:"🏠 Griha Pravesh",
        housewarming:"🏠 Griha Pravesh",
        mundan:"👶 Mundan",
        wedding:"💒 Wedding",
        other:"Other"
    };
    return map[String(type || "other").toLowerCase()] || String(type || "Other");
}

async function getOnlineGuests(){
    try{
        const { data:{user} } = await sb.auth.getUser();
        if(!user) return [];

        const {data, error} = await sb
        .from("guests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", {ascending: false});

        if(error){ console.log(error); return []; }
        return data || [];
    }catch(e){
        console.log(e);
        return [];
    }
}

async function loadReport(){
    const tbody = document.getElementById("tableBody");
    tbody.innerHTML = "";

    const online = await getOnlineGuests();
    const offline = getOfflineGuests();
    const map = new Map();

    // Online Supabase records + all local entry-page records.
    [...online, ...offline].forEach(raw=>{
        const g = {...raw};
        g.name = g.name || g.guestName || "";
        g.village = g.village || g.guestVillage || "";
        g.state = g.state || "Bihar";
        g.district = g.district || "";
        g.amount = Number(g.amount || g.cashAmount || 0) || 0;
        g.payment_mode = g.payment_mode || g.paymentMode ||
            (String(g.type || "").toLowerCase()==="cash" ? "CASH" :
             String(g.type || "").toLowerCase()==="upi" ? "UPI" :
             String(g.gift_type || "").toLowerCase()==="cash" ? "CASH" : "GIFT");
        g.event_type = g.event_type || g.eventType || "other";
        g.event_id = g.event_id || g.eventId || g.eventID || "";
        g.event_person = g.event_person || g.eventPerson || g.birthday_name || g.personName || "";
        g.event_date = g.event_date || g.eventDate || "";
        g.created_at = g.created_at || g.createdAt || g.timestamp || new Date().toISOString();
        const key = reportRecordKey(g);
        if(!map.has(key)) map.set(key, g);
    });

    reportData = [...map.values()];

    // Event Report mode: when opened from a specific Event card, show only
    // entries belonging to that Event. Birthday has its own local storage,
    // so older Birthday entries are also matched by person/date as fallback.
    const qs = new URLSearchParams(location.search);
    const eventIdParam = qs.get("eventId") || qs.get("event_id") || localStorage.getItem("currentEventId") || "";
    if(eventIdParam){
        let selectedEvent = null;
        const eid = String(eventIdParam);
        const normalizeType = (value) => {
            const raw = String(value || "").toLowerCase();
            if(raw.includes("tilak") || raw.includes("तिलक")) return "tilak";
            if(raw.includes("barat") || raw.includes("baraat") || raw.includes("बरात")) return "barat";
            if(raw.includes("reception") || raw.includes("रिसेप्शन")) return "reception";
            if(raw.includes("birthday") || raw.includes("जन्मदिन")) return "birthday";
            if(raw.includes("anniversary") || raw.includes("वर्षगांठ")) return "anniversary";
            if(raw.includes("engagement") || raw.includes("सगाई")) return "engagement";
            if(raw.includes("griha") || raw.includes("pravesh") || raw.includes("गृह प्रवेश")) return "griha_pravesh";
            if(raw.includes("mundan") || raw.includes("मुंडन")) return "mundan";
            if(raw.includes("marriage") || raw.includes("wedding") || raw.includes("शादी") || raw.includes("विवाह")) return "marriage";
            return raw.trim();
        };
        const norm = v => String(v ?? "").trim().toLowerCase().replace(/\s+/g," ");
        const dateKey = v => { const x=norm(v); const m=x.match(/^(\d{2})[-\/.](\d{2})[-\/.](\d{4})$/); return m ? `${m[3]}-${m[2]}-${m[1]}` : x; };
        const eventIdOf = e => String(e?.id || e?.eventId || e?.event_id || e?.key || "");
        const eventTypeOf = e => normalizeType([e?.sub_event_type,e?.subEventType,e?.event_type,e?.eventType,e?.type,e?.event_name,e?.eventName,e?.name,e?.title].filter(Boolean).join(" "));
        const peopleOf = e => [e?.person1,e?.person2,e?.groom_name,e?.bride_name,e?.event_person,e?.event_person_2,e?.birthday_name,e?.name,e?.personName].filter(Boolean).map(norm);

        // First use the event already cached locally.
        try {
            for(const key of ["sagunEventHistory","sagunEvents","sagunEventsData","sgunmsEvents","events"]){
                const raw=JSON.parse(localStorage.getItem(key)||"null");
                const list=Array.isArray(raw)?raw:(raw&&Array.isArray(raw.events)?raw.events:(raw&&Array.isArray(raw.data)?raw.data:[]));
                const hit=list.find(e=>eventIdOf(e)===eid);
                if(hit){selectedEvent=hit;break;}
            }
        } catch(e) {}

        // If Home got the Event from Supabase, retrieve that same Event here too.
        if(!selectedEvent){
            try{
                const {data:{user}}=await sb.auth.getUser();
                if(user){
                    const r=await sb.from("events").select("*").eq("user_id",user.id).eq("id",eid).maybeSingle();
                    if(!r.error && r.data) selectedEvent=r.data;
                }
            }catch(e){}
        }

        // Last fallback: the active event metadata saved when Home opened the card.
        if(!selectedEvent){
            try{
                const a=JSON.parse(localStorage.getItem("sgunmsActiveEvent")||"null");
                if(a && String(a.id||"")===eid) selectedEvent=a;
            }catch(e){}
        }

        if(selectedEvent){
            const wantedRaw=[selectedEvent.sub_event_type,selectedEvent.subEventType,selectedEvent.event_type,selectedEvent.eventType,selectedEvent.type,selectedEvent.event_name,selectedEvent.eventName,selectedEvent.name,selectedEvent.title].filter(Boolean).join(" ");
            const wantedType=eventTypeOf(selectedEvent) || normalizeType(wantedRaw);
            const wantedDate=dateKey(selectedEvent.event_date||selectedEvent.eventDate||selectedEvent.date||selectedEvent.startDate);
            const wantedPeople=peopleOf(selectedEvent);
            reportData=reportData.filter(g=>{
                const gid=String(g.event_id||g.eventId||g.eventID||g.event||"");
                if(gid && gid===eid) return true;
                const gt=eventTypeOf(g);
                const marriagePart=t=>["tilak","barat","reception"].includes(t);
                if(gt!==wantedType && !(marriagePart(gt)&&["marriage","wedding"].includes(wantedType)) && !(marriagePart(wantedType)&&["marriage","wedding"].includes(gt))) return false;
                const gd=dateKey(g.event_date||g.eventDate||g.date);
                if(wantedDate && gd && wantedDate!==gd) return false;
                const gp=peopleOf(g);
                if(wantedPeople.length && gp.length && !wantedPeople.some(a=>gp.some(b=>a===b||a.includes(b)||b.includes(a)))) return false;
                return true;
            });
        }else{
            // No event metadata: exact ID is the only safe match.
            reportData=reportData.filter(g=>String(g.event_id||g.eventId||g.eventID||"")===eid);
        }
    }

    reportData.sort((a,b)=>{
        return new Date(b.created_at) - new Date(a.created_at);
    });

    let search = document.getElementById("villageFilter").value.toUpperCase();

    let total = 0;
    let cash = 0;
    let upi = 0;
    let count = 0;

    if(reportData.length === 0){
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #888; padding: 20px;">कोई रिकॉर्ड नहीं मिला।</td></tr>`;
    }

    reportData.forEach(g=>{
        let txt = `${g.name||""} ${g.state||""} ${g.district||""} ${g.village||""}`.toUpperCase();

        if(search && !txt.includes(search)){ return; }

        let amt = Number(g.amount) || 0;
        count++;
        total += amt;

        if(g.payment_mode === "UPI"){
            upi += amt;
        } else {
            cash += amt;
        }

        tbody.innerHTML += `
        <tr>
            <td><b style="color: #800000;">${g.name || ""}</b></td>
            <td>${g.state || ""}</td>
            <td>${g.district || ""}</td>
            <td>${g.village || ""}</td>
            <td><span style="font-weight:700;color:#7b1020;">${eventLabel(g.event_type)}</span></td>
            <td><span style="background: ${g.payment_mode==='UPI'?'#e3f2fd':'#e8f5e9'}; color: ${g.payment_mode==='UPI'?'#0d6efd':'#198754'}; padding: 3px 8px; border-radius: 6px; font-size: 12px; font-weight: 600;">${g.payment_mode || "Cash"}</span></td>
            <td><b style="color:#198754;">₹${amt.toLocaleString("en-IN")}</b></td>
        </tr>
        `;
    });

    document.getElementById("totalGuests").innerText = count;
    document.getElementById("cashShagun").innerText = "₹" + cash.toLocaleString("en-IN");
    document.getElementById("upiShagun").innerText = "₹" + upi.toLocaleString("en-IN");
    document.getElementById("totalShagun").innerText = "₹" + total.toLocaleString("en-IN");

    if(isChartVisible){
        renderSelectedChart();
    }
}

function toggleChartBox() {
    const box = document.getElementById("chartBox");
    const breakdownBox = document.getElementById("numericBreakdownBox");
    const select = document.getElementById("chartTypeSelect");
    const btn = document.getElementById("toggleChartBtn");

    if(isChartVisible) {
        box.style.display = "none";
        breakdownBox.style.display = "none";
        select.style.display = "none";
        btn.innerText = "📈 ग्राफ एवं विवरण देखें (Open Chart)";
        isChartVisible = false;
    } else {
        box.style.display = "block";
        breakdownBox.style.display = "block";
        select.style.display = "inline-block";
        btn.innerText = "📉 ग्राफ बंद करें (Hide Chart)";
        isChartVisible = true;
        renderSelectedChart();
    }
}

function renderSelectedChart() {
    const type = document.getElementById("chartTypeSelect").value;
    const ctx = document.getElementById('shagunChart').getContext('2d');
    const breakdownBody = document.getElementById('breakdownBody');
    const breakdownHead = document.getElementById('breakdownHead');
    
    if (shagunChartInstance) {
        shagunChartInstance.destroy();
    }

    let labels = [];
    let dataValues = [];
    let chartTitle = '';
    let backgroundColors = [];
    let breakdownHtml = '';
    let categoryHeader = '';

    if(type === 'mode') {
        let cash = 0, upi = 0;
        reportData.forEach(g => {
            let amt = Number(g.amount) || 0;
            if(g.payment_mode === 'UPI') upi += amt;
            else cash += amt;
        });
        labels = ['Cash (कैश)', 'UPI (यूपीआई)'];
        dataValues = [cash, upi];
        chartTitle = 'भुगतान माध्यम अनुसार शगुन (Cash vs UPI)';
        backgroundColors = ['#198754', '#0d6efd'];
        
        categoryHeader = 'भुगतान माध्यम (Mode)';
        breakdownHtml = `
            <tr><td>Cash (कैश)</td><td><b>₹${cash.toLocaleString("en-IN")}</b></td></tr>
            <tr><td>UPI (यूपीआई)</td><td><b>₹${upi.toLocaleString("en-IN")}</b></td></tr>
        `;
    } 
    else if(type === 'district') {
        let distMap = {};
        reportData.forEach(g => {
            let dist = g.district ? g.district.trim() : "अन्य";
            distMap[dist] = (distMap[dist] || 0) + (Number(g.amount) || 0);
        });
        labels = Object.keys(distMap);
        dataValues = Object.values(distMap);
        chartTitle = 'जिला वार शगुन वितरण (District Wise)';
        backgroundColors = ['#800000', '#d4af37', '#2980b9', '#27ae60', '#e67e22', '#9b59b6'];

        categoryHeader = 'जिला (District)';
        for(let key in distMap) {
            breakdownHtml += `<tr><td>${key}</td><td><b>₹${distMap[key].toLocaleString("en-IN")}</b></td></tr>`;
        }
    } 
    else if(type === 'village') {
        let villMap = {};
        reportData.forEach(g => {
            let vill = g.village ? g.village.trim() : "अन्य";
            villMap[vill] = (villMap[vill] || 0) + (Number(g.amount) || 0);
        });
        labels = Object.keys(villMap);
        dataValues = Object.values(villMap);
        chartTitle = 'गाँव वार शगुन वितरण (Village Wise)';
        backgroundColors = ['#d35400', '#16a085', '#2c3e50', '#c0392b', '#2980b9', '#f39c12'];

        categoryHeader = 'गाँव (Village)';
        for(let key in villMap) {
            breakdownHtml += `<tr><td>${key}</td><td><b>₹${villMap[key].toLocaleString("en-IN")}</b></td></tr>`;
        }
    }

    breakdownHead.innerHTML = `<th>${categoryHeader}</th><th>शगुन राशि (Amount)</th>`;
    breakdownBody.innerHTML = breakdownHtml;

    shagunChartInstance = new Chart(ctx, {
        type: type === 'mode' ? 'doughnut' : 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'शगुन राशि (₹)',
                data: dataValues,
                backgroundColor: backgroundColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: type === 'mode' ? 'bottom' : 'none',
                    labels: { font: { family: 'Poppins', size: 11 } }
                },
                title: {
                    display: true,
                    text: chartTitle,
                    font: { family: 'Poppins', size: 13, weight: '700' },
                    color: '#800000'
                }
            }
        }
    });
}

async function backupData(){
    const blob = new Blob([JSON.stringify(reportData, null, 2)], {type: "application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "Sagun_Backup.json";
    a.click();
}

function exportExcel(){
    const rows = reportData.map(g => ({
        Name: g.name || "",
        State: g.state || "",
        District: g.district || "",
        Village: g.village || "",
        Event: eventLabel(g.event_type),
        Mode: g.payment_mode || "Cash",
        Amount: g.amount || 0
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, "Shagun_Report.xlsx");
}

function exportPDF(){
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "mm", "a4");

    let total = 0;
    let cash = 0;
    let upi = 0;

    reportData.forEach(g => {
        let amt = Number(g.amount) || 0;
        total += amt;
        if(g.payment_mode === "UPI") upi += amt;
        else cash += amt;
    });

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("SHAGUN REPORT", 105, 15, {align: "center"});

    doc.setFontSize(9);
    doc.text(`Total Guests: ${reportData.length} | Cash: Rs.${cash.toLocaleString("en-IN")} | UPI: Rs.${upi.toLocaleString("en-IN")} | Total: Rs.${total.toLocaleString("en-IN")}`, 105, 22, {align: "center"});

    const rows = reportData.map((g, i) => [
        i + 1,
        g.name || "",
        g.state || "",
        g.district || "",
        g.village || "",
        eventLabel(g.event_type),
        g.payment_mode || "Cash",
        g.amount || 0
    ]);

    doc.autoTable({
        startY: 28,
        head: [["SL", "NAME", "STATE", "DISTRICT", "VILLAGE", "EVENT", "MODE", "AMOUNT"]],
        body: rows,
        theme: "grid",
        headStyles: { fillColor: [128, 0, 0], textColor: [255, 255, 255], halign: "center" },
        styles: { fontSize: 8, cellPadding: 2, valign: "middle" },
        columnStyles: {
            0: { cellWidth: 10, halign: "center" },
            1: { cellWidth: 45 },
            2: { cellWidth: 25 },
            3: { cellWidth: 30 },
            4: { cellWidth: 25 },
            5: { cellWidth: 28 },
            6: { cellWidth: 18, halign: "center" },
            7: { cellWidth: 22, halign: "right" }
        }
    });

    doc.save("Shagun_Report.pdf");
}

window.onload = function(){
    loadReport();
    document.getElementById("villageFilter").addEventListener("keyup", loadReport);
};

document.getElementById("logoutBtn").onclick = async () => {
    await sb.auth.signOut();
    if (window.SagunGuest && window.SagunGuest.isGuest()) { window.SagunGuest.logout(); return; }
    localStorage.clear();
    sessionStorage.clear();
    // login disabled
};

