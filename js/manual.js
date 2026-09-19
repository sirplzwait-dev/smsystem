/* Extracted from manual.html - functionality unchanged */

  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-PSQRN0SV09');



function toggleAccordion(header) {
    const group = header.parentElement;
    const isActive = group.classList.contains('active');
    if (!isActive) {
        group.classList.add('active');
    } else {
        group.classList.remove('active');
    }
}

function openSection(id) {
    document.querySelectorAll('.accordion-group').forEach(g => g.classList.remove('active'));
    const target = document.getElementById(id);
    if(target) {
        target.classList.add('active');
        target.scrollIntoView({ behavior: 'smooth' });
    }
}

function toggleTheme() {
    const body = document.body;
    const btn = document.getElementById('themeToggleBtn');
    if(body.getAttribute('data-theme') === 'light') {
        body.setAttribute('data-theme', 'dark');
        localStorage.setItem('manualTheme', 'dark');
        btn.innerHTML = '<i class="fas fa-sun"></i> <span>Light</span>';
    } else {
        body.setAttribute('data-theme', 'light');
        localStorage.setItem('manualTheme', 'light');
        btn.innerHTML = '<i class="fas fa-moon"></i> <span>Dark</span>';
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('manualTheme') || 'light';
    const body = document.body;
    body.setAttribute('data-theme', savedTheme);
    const btn = document.getElementById('themeToggleBtn');
    if(savedTheme === 'dark') {
        btn.innerHTML = '<i class="fas fa-sun"></i> <span>Light</span>';
    } else {
        btn.innerHTML = '<i class="fas fa-moon"></i> <span>Dark</span>';
    }
});

function copyLink(sectionId) {
    const url = window.location.href.split('#')[0] + '#' + sectionId;
    navigator.clipboard.writeText(url).then(() => {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Link Copied!',
            showConfirmButton: false,
            timer: 1200
        });
    });
}

function searchManual() {
    let input = document.getElementById('manualSearch').value.toLowerCase().trim();
    let items = document.querySelectorAll('.searchable-item');
    let groups = document.querySelectorAll('.accordion-group');
    let noResults = document.getElementById('noResults');

    if(input === "") {
        groups.forEach(g => g.classList.remove('active'));
        items.forEach(item => item.style.display = "");
        noResults.style.display = "none";
        return;
    }

    let foundCount = 0;
    items.forEach(item => {
        let text = item.innerText.toLowerCase();
        let group = item.closest('.accordion-group');
        if(text.includes(input)) {
            item.style.display = "";
            group.classList.add('active');
            foundCount++;
        } else {
            item.style.display = "none";
        }
    });

    if(foundCount === 0) {
        noResults.style.display = "block";
        groups.forEach(g => g.classList.remove('active'));
    } else {
        noResults.style.display = "none";
    }
}

function zoomImage(imgElement) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    lightboxImg.src = imgElement.src;
    lightbox.style.display = 'flex';
}

window.addEventListener('scroll', () => {
    let scrollPos = window.scrollY;
    document.querySelectorAll('.accordion-group').forEach(group => {
        let top = group.offsetTop - 120;
        let height = group.offsetHeight;
        let id = group.getAttribute('id');
        let link = document.querySelector(`.sidebar ul li a[href="#${id}"]`);
        
        if(scrollPos >= top && scrollPos < top + height) {
            document.querySelectorAll('.sidebar ul li a').forEach(a => a.classList.remove('active'));
            if(link) link.classList.add('active');
        }
    });
});

