// =======================================
// Secure Hub Premium Dashboard
// admin-dashboard.js
// =======================================

// =========================
// Live Clock
// =========================
function updateClock() {
    const now = new Date();
    const clockEl = document.getElementById("liveClock");
    if (clockEl) {
        clockEl.innerHTML = now.toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "medium"
        });
    }
}

setInterval(updateClock, 1000);

// ==========================================
// Main DOM Content Loaded Actions
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
    // 1. Check Authentication & Admin Email Access
    const dbClient =
    window.client ||
    window.supabaseClient ||
    window.sb ||
    window.supabase.createClient(
        "https://rdlliurzgwwfjscgwssa.supabase.co",
        "sb_publishable_HX1QmjO0SPyW3rUoihZkkQ_tRTE1bLc"
    );
    
    if (!dbClient) {
        console.error("Supabase client is not initialized.");
        window.location.href = "../index.html";
        return;
    }

    const { data, error } = await dbClient.auth.getUser();

    if (error || !data.user) {
        window.location.href = "../index.html";
        return;
    }

    // Restrict access strictly to the Admin Email
    if (data.user.email !== "shashi841505@gmail.com") {
        await dbClient.auth.signOut();
        alert("Access Denied!");
        window.location.href = "../index.html";
        return;
    }

    // Load initial data
    if (typeof loadDashboard === "function") {
        loadDashboard();
    }

    // 2. Setup Dark Mode Theme Toggle
    setupDarkMode();

    // 3. Setup Navigation Menu Switching
    setupNavigation();

    // 4. Setup Search Box Filtering
    setupSearchBox();

    // 5. Setup Keyboard Shortcuts
    setupKeyboardShortcuts();

    // 6. Setup Logout Button Handler
    setupLogoutHandler(dbClient);
});

// =========================
// Dark Mode Setup
// =========================
function setupDarkMode() {
    const darkBtn = document.getElementById("darkBtn");
    if (!darkBtn) return;

    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark");
        darkBtn.innerHTML = "☀️";
    }

    darkBtn.onclick = function () {
        document.body.classList.toggle("dark");
        if (document.body.classList.contains("dark")) {
            localStorage.setItem("theme", "dark");
            darkBtn.innerHTML = "☀️";
        } else {
            localStorage.setItem("theme", "light");
            darkBtn.innerHTML = "🌙";
        }
    };
}

// =========================
// Navigation Menu Switching
// =========================
function setupNavigation() {
    const menuItems = document.querySelectorAll(".menu-item");
    
    menuItems.forEach(item => {
        item.onclick = function () {
            menuItems.forEach(i => i.classList.remove("active"));
            this.classList.add("active");

            document.querySelectorAll(".page-section").forEach(sec => {
                sec.style.display = "none";
            });

            const targetPage = document.getElementById(this.dataset.page);
            if (targetPage) {
                targetPage.style.display = "block";
            }
        };
    });
}

// =========================
// Search Box Filter
// =========================
function setupSearchBox() {
    const searchBox = document.getElementById("searchBox");
    if (!searchBox) return;

    searchBox.addEventListener("keyup", function () {
        const value = this.value.toLowerCase();
        const rows = document.querySelectorAll("tbody tr");

        rows.forEach(row => {
            row.style.display = row.innerText.toLowerCase().includes(value) ? "" : "none";
        });
    });
}

// =========================
// Keyboard Shortcuts
// =========================
function setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
        const darkBtn = document.getElementById("darkBtn");
        const searchBox = document.getElementById("searchBox");

        // Ctrl + R
        if (e.ctrlKey && e.key.toLowerCase() === "r") {
            e.preventDefault();
            if (typeof loadDashboard === "function") loadDashboard();
            if (typeof loadCharts === "function") loadCharts();
        }

        // Ctrl + D
        if (e.ctrlKey && e.key.toLowerCase() === "d") {
            e.preventDefault();
            if (darkBtn) darkBtn.click();
        }

        // Escape
        if (e.key === "Escape") {
            if (searchBox) searchBox.value = "";
        }
    });
}

// =========================
// Logout Handler
// =========================
function setupLogoutHandler(clientInstance) {
    const logoutBtn = document.getElementById("logoutBtn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            const ok = confirm("Are you sure you want to logout?");
            if (!ok) return;

            const { error } = await clientInstance.auth.signOut();

            if (error) {
                alert(error.message);
                return;
            }

            window.location.replace("index.html");
        });
    }
}

function openAnalytics() {

    window.open(
        "https://analytics.google.com/",
        "_blank"
    );

}


// =======================================
// Complete Data Overview (Super Admin)
// =======================================
function moneyINR(n){ return "₹" + Number(n || 0).toLocaleString("en-IN"); }
function safeText(v){ return String(v ?? "-").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[c])); }

async function loadCompleteData(){
    const c = window.client || window.supabaseClient || window.sb || window.supabase.createClient(
        "https://rdlliurzgwwfjscgwssa.supabase.co",
        "sb_publishable_HX1QmjO0SPyW3rUoihZkkQ_tRTE1bLc"
    );
    const getCount = async (table) => { try { const r=await c.from(table).select("id",{count:"exact",head:true}); return r.error?0:(r.count||0); } catch(e){return 0;} };
    const getRows = async (table, columns, order="created_at") => { try { const r=await c.from(table).select(columns).order(order,{ascending:false}).limit(100); return r.error?[]:(r.data||[]); } catch(e){return [];} };
    const getAmounts = async () => {
        try{
            const r=await c.from("guests").select("amount,payment_mode,paymentMode").limit(10000);
            if(r.error) return {total:0,cash:0,upi:0,gift:0,giftCount:0};
            let total=0,cash=0,upi=0,gift=0,giftCount=0;
            (r.data||[]).forEach(x=>{const a=Number(x.amount||0); const p=String(x.payment_mode||x.paymentMode||"").toLowerCase(); total+=a; if(p.includes("cash"))cash+=a; else if(p.includes("upi"))upi+=a; else if(p.includes("gift")){gift+=a;giftCount++;}});
            return {total,cash,upi,gift,giftCount};
        }catch(e){return {total:0,cash:0,upi:0,gift:0,giftCount:0};}
    };
    const [users,events,guests,gifts,families,members,transactions,reminders,activity,logins,visitors,amounts] = await Promise.all([
        getCount("profiles"),getCount("events"),getCount("guests"),getCount("gifts"),getCount("families"),getCount("family_members"),getCount("cash_transactions"),getCount("reminders"),getCount("activity_logs"),getCount("login_logs"),getCount("visitor_logs"),getAmounts()
    ]);
    const values={dataUsers:users,dataEvents:events,dataGuests:guests,dataCollection:moneyINR(amounts.total),dataCash:moneyINR(amounts.cash),dataUpi:moneyINR(amounts.upi),dataGift:amounts.giftCount,dataFamilies:families,dataMembers:members,dataTransactions:transactions,dataReminders:reminders,dataActivity:activity,dataLogins:logins,dataVisitors:visitors};
    Object.entries(values).forEach(([id,v])=>{const el=document.getElementById(id);if(el)el.textContent=v;});
    const summary=[
      ["Registered Users",users,"Profiles / registrations"],["Events",events,"All created events"],["Guest Entries",guests,"All guest records"],["Collection",moneyINR(amounts.total),"Cash + UPI + other amounts"],["Cash Collection",moneyINR(amounts.cash),"Payment mode: Cash"],["UPI Collection",moneyINR(amounts.upi),"Payment mode: UPI"],["Gift Records",gifts,"Gift table records"],["Families",families,"Family records"],["Family Members",members,"Family member records"],["Cash Transactions",transactions,"Cash IN / OUT records"],["Reminders",reminders,"Reminder records"],["Activity Logs",activity,"System activity records"],["Login Records",logins,"Successful login records"],["Website Visitors",visitors,"Visitor log records"]
    ];
    const st=document.getElementById("dataSummaryTable"); if(st) st.innerHTML=summary.map(x=>`<tr><td>${safeText(x[0])}</td><td><b>${safeText(x[1])}</b></td><td>${safeText(x[2])}</td></tr>`).join("");
    const u=await getRows("profiles","id,name,email,created_at"); const ut=document.getElementById("allUsersTable"); if(ut)ut.innerHTML=u.length?u.map((x,i)=>`<tr><td>${i+1}</td><td>${safeText(x.name)}</td><td>${safeText(x.email)}</td><td>${x.created_at?new Date(x.created_at).toLocaleString("en-IN"):"-"}</td></tr>`).join(""):"<tr><td colspan=4>No users found</td></tr>";
    try {
      const ur=await c.rpc("sgunms_admin_user_stats");
      const rows=ur.error?[]:(ur.data||[]); const ud=document.getElementById("userDataTable");
      if(ud) ud.innerHTML=rows.length?rows.map((x,i)=>`<tr><td>${i+1}</td><td>${safeText(x.name)}</td><td>${safeText(x.email)}</td><td>${x.events||0}</td><td>${x.guests||0}</td><td>${moneyINR(x.collection||0)}</td><td>${x.last_login?new Date(x.last_login).toLocaleString("en-IN"):"-"}</td></tr>`).join(""):"<tr><td colspan=7>No user data found</td></tr>";
    } catch(e) { const ud=document.getElementById("userDataTable"); if(ud)ud.innerHTML="<tr><td colspan=7>Run ADMIN_COMPLETE_DATA.sql in Supabase</td></tr>"; }

    const e=await getRows("events","event_name,event_type,event_date,created_at"); const et=document.getElementById("allEventsTable"); if(et)et.innerHTML=e.length?e.map((x,i)=>`<tr><td>${i+1}</td><td>${safeText(x.event_name)}</td><td>${safeText(x.event_type)}</td><td>${safeText(x.event_date)}</td><td>${x.created_at?new Date(x.created_at).toLocaleString("en-IN"):"-"}</td></tr>`).join(""):"<tr><td colspan=5>No events found</td></tr>";
}

document.addEventListener("DOMContentLoaded",()=>{
    const b=document.getElementById("dataRefreshBtn"); if(b)b.addEventListener("click",loadCompleteData);
    setTimeout(loadCompleteData,700);
});
