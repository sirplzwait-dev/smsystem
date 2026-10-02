// ===============================
// Visitor Tracker v2
// ===============================
// Safe version: uses an existing global Supabase client if the site
// provides one. If no client is configured, visitor logging is skipped
// silently instead of producing "client is not defined" in the console.

(async () => {
    try {
        const visitorClient =
            (typeof window !== "undefined" && window.client) ? window.client : null;

        if (!visitorClient || typeof visitorClient.from !== "function") {
            return;
        }

        let visitorId = localStorage.getItem("visitor_id");

        if (!visitorId) {
            visitorId = (window.crypto && typeof window.crypto.randomUUID === "function")
                ? window.crypto.randomUUID()
                : "visitor-" + Date.now() + "-" + Math.random().toString(36).slice(2);

            localStorage.setItem("visitor_id", visitorId);
        }

        const ua = navigator.userAgent || "";

        let device = "Desktop";
        if (/Android|iPhone|iPad|Mobile/i.test(ua)) {
            device = "Mobile";
        }

        let browser = "Unknown";
        if (ua.includes("Edg")) browser = "Edge";
        else if (ua.includes("Chrome")) browser = "Chrome";
        else if (ua.includes("Firefox")) browser = "Firefox";
        else if (ua.includes("Safari")) browser = "Safari";

        let os = "Unknown";
        if (ua.includes("Windows")) os = "Windows";
        else if (ua.includes("Android")) os = "Android";
        else if (ua.includes("iPhone")) os = "iPhone";
        else if (ua.includes("Mac")) os = "Mac";

        await visitorClient.from("visitor_logs").insert({
            visitor_id: visitorId,
            page_name: location.pathname,
            device: device,
            browser: browser,
            os: os,
            language: navigator.language,
            screen_size: screen.width + "x" + screen.height,
            referrer: document.referrer
        });
    } catch (err) {
        // Visitor logging must never break the website.
        // Keep failures silent in production.
    }
})();
