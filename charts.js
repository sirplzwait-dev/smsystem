// ======================================
// Secure Hub Premium Charts
// ======================================

let registrationChart;
let collectionChart;
let paymentChart;

async function loadCharts() {
    // सुरक्षित रूप से Supabase client की पहचान करें (client या sb)
   const dbClient = window.client;

    if (!dbClient) {
        console.error("Supabase client is not initialized or defined!");
        return;
    }

    try {
        // -----------------------------
        // Registration Data
        // -----------------------------
        const { data: profileData, error: profileError } = await dbClient
            .from("profiles")
            .select("created_at");

        if (profileError) {
            console.error("Error fetching profiles:", profileError.message);
        }

        // -----------------------------
        // Guest Data
        // -----------------------------
        const { data: guestData, error: guestError } = await dbClient
            .from("guests")
            .select("created_at, amount, payment_mode");

        if (guestError) {
            console.error("Error fetching guests:", guestError.message);
        }

        // =============================
        // Monthly Registration
        // =============================
        const regMonth = Array(12).fill(0);

        profileData?.forEach(item => {
            if (item.created_at) {
                const m = new Date(item.created_at).getMonth();
                if (m >= 0 && m < 12) regMonth[m]++;
            }
        });

        // =============================
        // Monthly Collection
        // =============================
        const collection = Array(12).fill(0);

        guestData?.forEach(item => {
            if (item.created_at) {
                const m = new Date(item.created_at).getMonth();
                if (m >= 0 && m < 12) {
                    collection[m] += Number(item.amount || 0);
                }
            }
        });

        // =============================
        // Cash / UPI
        // =============================
        let cash = 0;
        let upi = 0;

        guestData?.forEach(item => {
            const mode = (item.payment_mode || "").trim();
            if (mode === "Cash" || mode === "CASH") {
                cash++;
            } else if (mode === "UPI" || mode === "upi") {
                upi++;
            }
        });

        // ===================================
        // Registration Chart
        // ===================================
        const regElement = document.getElementById("registrationChart");
        if (regElement) {
            if (registrationChart) {
                registrationChart.destroy();
            }

            registrationChart = new Chart(
                regElement,
                {
                    type: "bar",
                    data: {
                        labels: [
                            "Jan","Feb","Mar","Apr","May","Jun",
                            "Jul","Aug","Sep","Oct","Nov","Dec"
                        ],
                        datasets: [{
                            label: "Registrations",
                            data: regMonth,
                            backgroundColor: "#8B0000",
                            borderRadius: 8
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            }
                        }
                    }
                }
            );
        }

        // ===================================
        // Collection Chart
        // ===================================
        const colElement = document.getElementById("collectionChart");
        if (colElement) {
            if (collectionChart) {
                collectionChart.destroy();
            }

            collectionChart = new Chart(
                colElement,
                {
                    type: "line",
                    data: {
                        labels: [
                            "Jan","Feb","Mar","Apr","May","Jun",
                            "Jul","Aug","Sep","Oct","Nov","Dec"
                        ],
                        datasets: [{
                            label: "Collection",
                            data: collection,
                            borderColor: "#B8860B",
                            backgroundColor: "rgba(184,134,11,.20)",
                            fill: true,
                            tension: .35
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false
                    }
                }
            );
        }

        // ===================================
        // Payment Chart
        // ===================================
        const payElement = document.getElementById("paymentChart");
        if (payElement) {
            if (paymentChart) {
                paymentChart.destroy();
            }

            paymentChart = new Chart(
                payElement,
                {
                    type: "doughnut",
                    data: {
                        labels: ["Cash", "UPI"],
                        datasets: [{
                            data: [cash, upi],
                            backgroundColor: [
                                "#8B0000",
                                "#B8860B"
                            ]
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false
                    }
                }
            );
        }

    } catch (err) {
        console.error("Error loading charts execution:", err);
    }
}

// ===================================
// Start Charts
// ===================================
document.addEventListener("DOMContentLoaded", () => {
    loadCharts();
});

// ===================================
// Auto Refresh Every 30 Seconds
// ===================================
setInterval(() => {
    loadCharts();
}, 30000);