// ==========================================
// Sagun Management System
// Premium Admin Dashboard v2
// Part 1 / 4
// ==========================================

const client = window.supabase.createClient(
    "https://rdlliurzgwwfjscgwssa.supabase.co",
    "sb_publishable_HX1QmjO0SPyW3rUoihZkkQ_tRTE1bLc"
);

window.client = client;

document.addEventListener("DOMContentLoaded", async () => {

    try {

        const { data, error } = await client.auth.getUser();

        if (error || !data.user) {
            window.location.href = "index.html";
            return;
        }

        if (data.user.email !== "shashi841505@gmail.com") {

            await client.auth.signOut();

            alert("Access Denied");

            window.location.href = "index.html";

            return;

        }

        await loadDashboard();

    } catch (err) {

        console.error(err);

        alert(err.message);

    }

});

async function loadDashboard() {

try{

// -------------------------------
// Total Registration
// -------------------------------

const {count:totalRegistration,error:regError}=await client
.from("profiles")
.select("*",{count:"exact",head:true});

if(regError) throw regError;

document.getElementById("totalRegistration").innerHTML=
totalRegistration||0;

// -------------------------------
// Total Guest
// -------------------------------

const {count:totalGuest,error:guestError}=await client
.from("guests")
.select("*",{count:"exact",head:true});

if(guestError) throw guestError;

document.getElementById("totalGuest").innerHTML=
totalGuest||0;

// -------------------------------
// Total Collection
// -------------------------------

const {data:amountData,error:amountError}=await client
.from("guests")
.select("amount");

if(amountError) throw amountError;

let totalAmount=0;

amountData.forEach(item=>{

totalAmount+=Number(item.amount||0);

});

document.getElementById("totalAmount").innerHTML=
"₹"+totalAmount.toLocaleString("en-IN");

// -------------------------------
// Today's Date
// -------------------------------

const today=new Date();

today.setHours(0,0,0,0);

const todayISO=today.toISOString();

// -------------------------------
// Today's Registration
// -------------------------------

const {data:todayReg}=await client
.from("profiles")
.select("id")
.gte("created_at",todayISO);
console.log("Today Registration", todayReg);

document.getElementById("todayRegistration").innerHTML=
todayReg.length;

// -------------------------------
// Today's Guest
// -------------------------------

const {data:todayGuest}=await client
.from("guests")
.select("id")
.gte("created_at",todayISO);
console.log("Today Guest", todayGuest);

document.getElementById("todayEntry").innerHTML=
todayGuest.length;

// -------------------------------
// Visitor Analytics
// -------------------------------

const { data: visitors, error: visitorError } = await client
.from("visitor_logs")
.select("device,browser,visited_at");

if(visitorError) throw visitorError;

let mobile=0;
let desktop=0;
let todayVisitors=0;

const browserCount={};

visitors.forEach(v=>{

    if(v.device==="Mobile")
        mobile++;
    else
        desktop++;

    const visitDate=new Date(v.visited_at);

    if(
        visitDate.toDateString()===today.toDateString()
    ){
        todayVisitors++;
    }

    browserCount[v.browser]=(browserCount[v.browser]||0)+1;

});

document.getElementById("totalVisitors").innerHTML=
visitors.length;

document.getElementById("mobileVisitors").innerHTML=
mobile;

document.getElementById("desktopVisitors").innerHTML=
desktop;

document.getElementById("todayVisitors").innerHTML=
todayVisitors;

// Analytics Page

const analyticsVisitors=document.getElementById("analyticsVisitors");
const analyticsMobile=document.getElementById("analyticsMobile");
const analyticsDesktop=document.getElementById("analyticsDesktop");
const analyticsToday=document.getElementById("analyticsToday");

if(analyticsVisitors) analyticsVisitors.innerHTML=visitors.length;
if(analyticsMobile) analyticsMobile.innerHTML=mobile;
if(analyticsDesktop) analyticsDesktop.innerHTML=desktop;
if(analyticsToday) analyticsToday.innerHTML=todayVisitors;

// Browser Report

const browserTable=document.getElementById("browserTable");

if(browserTable){

browserTable.innerHTML="";

Object.keys(browserCount).forEach(browser=>{

browserTable.innerHTML+=`

<tr>

<td>${browser}</td>

<td>${browserCount[browser]}</td>

</tr>

`;

});

}
// -------------------------------
// Latest Registration
// -------------------------------

const { data: latestUsers, error: latestUserError } = await client
.from("profiles")
.select("name,email,created_at")
.order("created_at",{ascending:false})
.limit(10);

if(latestUserError) throw latestUserError;

const userTable=document.getElementById("registrationTable");

if(userTable){

userTable.innerHTML="";

latestUsers.forEach((u,index)=>{

userTable.innerHTML+=`

<tr>

<td>${index+1}</td>

<td>${u.name||"-"}</td>

<td>${u.email||"-"}</td>

<td>${new Date(u.created_at).toLocaleString()}</td>

</tr>

`;

});

}

// -------------------------------
// Latest Guest Entry
// -------------------------------

const { data: latestGuests, error: latestGuestError } = await client
.from("guests")
.select("*")
.order("created_at",{ascending:false})
.limit(20);

if(latestGuestError) throw latestGuestError;
let cash = 0;
let upi = 0;

const states = new Set();
const districts = new Set();

latestGuests.forEach(g => {

    if ((g.payment_mode || "").toLowerCase() === "cash") {
        cash++;
    }

    if ((g.payment_mode || "").toLowerCase() === "upi") {
        upi++;
    }

    if (g.state) {
        states.add(g.state);
    }

    if (g.district) {
        districts.add(g.district);
    }

});

document.getElementById("cashCount").textContent = cash;
document.getElementById("upiCount").textContent = upi;
document.getElementById("stateCount").textContent = states.size;
document.getElementById("districtCount").textContent = districts.size;

const guestTable=document.getElementById("guestTable");

if(guestTable){

guestTable.innerHTML="";

latestGuests.forEach((g,index)=>{


guestTable.innerHTML += `

<tr>

<td>${g.name || "-"}</td>

<td>${g.village || "-"}</td>

<td>₹${g.amount || 0}</td>

<td>${g.payment_mode || "-"}</td>

<td>${new Date(g.created_at).toLocaleString()}</td>

</tr>

`;


});

}

// -------------------------------
// Today's Summary
// -------------------------------

const todayAmount=latestGuests
.filter(g=>{

const d=new Date(g.created_at);

return d.toDateString()===today.toDateString();

})
.reduce((sum,g)=>sum+Number(g.amount||0),0);

const todayAmountBox=document.getElementById("todayAmount");
document.getElementById("summaryRegistration").textContent = todayReg.length;
document.getElementById("summaryGuest").textContent = todayGuest.length;
document.getElementById("summaryAmount").textContent =
    "₹" + todayAmount.toLocaleString("en-IN");

if(todayAmountBox){

todayAmountBox.innerHTML="₹"+todayAmount.toLocaleString("en-IN");

}

// -------------------------------
// Refresh Button
// -------------------------------

const refreshBtn = document.getElementById("refreshBtn");

if (refreshBtn) {
    refreshBtn.onclick = async () => {
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = "⏳";

        await loadDashboard();

        refreshBtn.innerHTML = "🔄";
        refreshBtn.disabled = false;
    };
}

// -------------------------------
// Load Charts
// -------------------------------

if (typeof loadCharts === "function") {
    loadCharts();
}

// -------------------------------
// Dashboard Loaded
// -------------------------------

console.log("Dashboard Loaded Successfully");

}catch(err){

console.error(err);

alert("Dashboard Error : " + err.message);

}

}

// -------------------------------
// Auto Refresh Every 60 Seconds
// -------------------------------

setInterval(() => {

if(document.visibilityState==="visible"){

loadDashboard();

}

},60000);