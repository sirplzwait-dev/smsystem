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
        window.location.href = "index.html";
        return;
    }

    const { data, error } = await dbClient.auth.getUser();

    if (error || !data.user) {
        window.location.href = "index.html";
        return;
    }

    // Restrict access strictly to the Admin Email
    if (data.user.email !== "shashi841505@gmail.com") {
        await dbClient.auth.signOut();
        alert("Access Denied!");
        window.location.href = "index.html";
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
