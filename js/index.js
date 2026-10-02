/* Sagun Management System - index.js
   Mobile/desktop safe version.
*/
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-PSQRN0SV09');

function toggleMenu(){
    const nav = document.getElementById("navMenu");
    if (nav) nav.classList.toggle("show");
}

function openNoticeModal() {
    const el = document.getElementById("websiteNoticeModal");
    if (el) el.style.display = 'flex';
}

function closeNoticeModal() {
    const el = document.getElementById("websiteNoticeModal");
    if (el) el.style.display = 'none';
}

function openLegalModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.style.display = 'flex';
}

function closeLegalModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.style.display = 'none';
}

window.addEventListener('click', function(event) {
    const target = event.target;
    if (target && target.classList &&
        (target.classList.contains('legal-modal') ||
         target.classList.contains('notice-modal'))) {
        target.style.display = 'none';
    }
});

// Language Switcher Logic (English / हिंदी)
function setLanguage(lang) {
    const enBtn = document.getElementById("langEnBtn");
    const hiBtn = document.getElementById("langHiBtn");

    if (!enBtn || !hiBtn) return;

    if(lang === 'hi') {
        hiBtn.style.background = "#FFD700";
        hiBtn.style.color = "#800000";
        enBtn.style.background = "transparent";
        enBtn.style.color = "#fff";
        localStorage.setItem("selectedLang", "hi");
    } else {
        enBtn.style.background = "#FFD700";
        enBtn.style.color = "#800000";
        hiBtn.style.background = "transparent";
        hiBtn.style.color = "#fff";
        localStorage.setItem("selectedLang", "en");
    }

    const elements = document.querySelectorAll("[data-en][data-hi]");
    elements.forEach(el => {
        if(lang === 'hi') {
            if(el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = el.getAttribute('data-hi');
            } else {
                el.innerHTML = el.getAttribute('data-hi');
            }
        } else {
            if(el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = el.getAttribute('data-en');
            } else {
                el.innerHTML = el.getAttribute('data-en');
            }
        }
    });
}

window.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem("selectedLang") || "en";
    setLanguage(savedLang);

    // Preview/lightbox handlers are attached only after the DOM exists.
    const images = document.querySelectorAll(".preview-card img");
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightboxImg");

    if (lightbox && lightboxImg) {
        images.forEach(function(img){
            img.addEventListener("click", function(){
                lightboxImg.src = this.src;
                lightbox.classList.add("active");
                lightbox.style.display = "flex";
            });
        });

        lightbox.addEventListener("click", function(){
            lightbox.classList.remove("active");
            lightbox.style.display = "none";
        });
    }

    if (window.AOS && typeof window.AOS.init === "function") {
        AOS.init({ duration: 1000, once: true });
    }
});

// The old #scrollTopBtn is intentionally removed by the page's newer
// top/bottom button code. Keep this handler only if that element exists.
window.addEventListener('scroll', function() {
    const btn = document.getElementById("scrollTopBtn");
    if (!btn) return;

    const y = window.pageYOffset ||
              document.documentElement.scrollTop ||
              document.body.scrollTop || 0;

    btn.style.display = y > 300 ? "flex" : "none";
});

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
