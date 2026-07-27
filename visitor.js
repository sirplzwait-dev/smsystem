// ===============================
// Visitor Tracker v2
// ===============================

const client = window.client;
    "https://rdlliurzgwwfjscgwssa.supabase.co",
    "sb_publishable_HX1QmjO0SPyW3rUoihZkkQ_tRTE1bLc"
);

(async () => {

    try{

        let visitorId = localStorage.getItem("visitor_id");

        if(!visitorId){

            visitorId = crypto.randomUUID();

            localStorage.setItem("visitor_id",visitorId);

        }

        const ua = navigator.userAgent;

        let device = "Desktop";

        if(/Android|iPhone|iPad|Mobile/i.test(ua))
            device="Mobile";

        let browser="Unknown";

        if(ua.includes("Edg"))
            browser="Edge";
        else if(ua.includes("Chrome"))
            browser="Chrome";
        else if(ua.includes("Firefox"))
            browser="Firefox";
        else if(ua.includes("Safari"))
            browser="Safari";

        let os="Unknown";

        if(ua.includes("Windows"))
            os="Windows";
        else if(ua.includes("Android"))
            os="Android";
        else if(ua.includes("iPhone"))
            os="iPhone";
        else if(ua.includes("Mac"))
            os="Mac";

        await client
        .from("visitor_logs")
        .insert({

            visitor_id:visitorId,

            page_name:location.pathname,

            device:device,

            browser:browser,

            os:os,

            language:navigator.language,

            screen_size:
            screen.width+"x"+screen.height,

            referrer:document.referrer

        });

    }
    catch(err){

        console.log("Visitor Log:",err.message);

    }

})();