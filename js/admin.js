/* Extracted from admin.html - functionality unchanged */

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

let currentUserId = null;

window.onload = async () => {
    try {
        const { data: { user }, error } = await sb.auth.getUser();
        if (error || !user) {
            window.location.href = '../html/login.html';
            return;
        }

        // Admin password prompt removed. Access is controlled by the existing
        // Supabase authentication/security guard; no separate admin password.
        currentUserId = user.id;
        loadData();
    } catch (err) {
        console.error('Admin authentication error:', err);
        window.location.href = '../html/login.html';
    }
};

async function loadData() {
    if (!currentUserId) return;

    const { data, error } = await sb.from("guests").select("*").eq("user_id", currentUserId).order('created_at', { ascending: false });
    if(error) { console.error("Error:", error); return; }

    let tbody = document.getElementById('tableBody');
    tbody.innerHTML = "";
    let total = 0;

    if(!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #888; padding: 20px;">कोई रिकॉर्ड नहीं मिला।</td></tr>`;
        document.getElementById('totalGuests').innerText = 0;
        document.getElementById('rawAmount').innerText = '₹0';
        return;
    }

    data.forEach(g => {
        total += Number(g.amount || 0);
        let row = document.createElement('tr');
        row.innerHTML = `
            <td><b>${g.name || ''}</b></td>
            <td>${g.state || ''}</td>
            <td>${g.district || ''}</td>
            <td>${g.village || ''}</td>
            <td style="color: #27ae60; font-weight: 600;">₹${Number(g.amount || 0).toLocaleString('en-IN')}</td>
            <td style="text-align: center;"><button class="delete-btn" onclick="deleteEntry('${g.id}')">🗑️ Delete</button></td>
        `;
        tbody.appendChild(row);
    });
    
    document.getElementById('totalGuests').innerText = data.length;
    document.getElementById('rawAmount').innerText = '₹' + total.toLocaleString('en-IN');
}

async function deleteEntry(id) {
    Swal.fire({
        title: 'क्या आप वाकई डिलीट करना चाहते हैं?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'हाँ, डिलीट करें',
        cancelButtonText: 'रद्द करें'
    }).then(async (result) => {
        if (result.isConfirmed) {
            const { error } = await sb.from("guests").delete().eq("id", id);
            if(error) { Swal.fire("त्रुटि", error.message, "error"); }
            else { 
                Swal.fire({ title: 'डिलीट हो गया!', icon: 'success', timer: 1200, showConfirmButton: false });
                loadData(); 
            }
        }
    });
}

async function deleteAllData() {
    if (!currentUserId) return;

    Swal.fire({
        title: 'चेतावनी!',
        text: 'आपका पूरा डेटा डिलीट हो जाएगा!',
        icon: 'error',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'हाँ, सब डिलीट करें',
        cancelButtonText: 'रद्द करें'
    }).then(async (result) => {
        if (result.isConfirmed) {
            const { error } = await sb.from("guests").delete().eq("user_id", currentUserId);
            if(error) { Swal.fire("त्रुटि", error.message, "error"); }
            else { 
                Swal.fire({ title: 'सफल!', text: 'सारा डेटा साफ़ कर दिया गया है।', icon: 'success', timer: 1500, showConfirmButton: false });
                loadData(); 
            }
        }
    });
}

