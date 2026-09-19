/* Extracted from index.html - functionality unchanged */

window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-PSQRN0SV09');



function toggleMenu(){
    document.getElementById("navMenu").classList.toggle("show");
}

function openNoticeModal() {
    document.getElementById("websiteNoticeModal").style.display = 'flex';
}

function closeNoticeModal() {
    document.getElementById("websiteNoticeModal").style.display = 'none';
}

function openLegalModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function closeLegalModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

window.onclick = function(event) {
    if (event.target.classList.contains('legal-modal') || event.target.classList.contains('notice-modal')) {
        event.target.style.display = 'none';
    }
}

// Language Switcher Logic (English / हिंदी)
function setLanguage(lang) {
    const enBtn = document.getElementById("langEnBtn");
    const hiBtn = document.getElementById("langHiBtn");

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
});

window.onscroll = function() {
    let btn = document.getElementById("scrollTopBtn");
    if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
        btn.style.display = "flex";
    } else {
        btn.style.display = "none";
    }
};

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

const images = document.querySelectorAll(".preview-card img");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");

images.forEach(function(img){
    img.addEventListener("click", function(){
        lightbox.style.display = "flex";
        lightboxImg.src = this.src;
    });
});

lightbox.addEventListener("click", function(){
    lightbox.style.display = "none";
});



AOS.init({ duration: 1000, once: true });

