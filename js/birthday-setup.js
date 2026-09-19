const sb = window.supabase.createClient(
  "https://rdlliurzgwwfjscgwssa.supabase.co",
  "sb_publishable_HX1QmjO0SPyW3rUoihZkkQ_tRTE1bLc"
);

let selectedPhoto = null;
let selectedPhotoData = "";

document.getElementById("birthdayPhoto").addEventListener("change", e => {
  selectedPhoto = e.target.files[0] || null;
  if (!selectedPhoto) return;
  const reader = new FileReader();
  reader.onload = ev => {
    selectedPhotoData = ev.target.result;
    document.getElementById("photoPreview").src = selectedPhotoData;
  };
  reader.readAsDataURL(selectedPhoto);
});

document.getElementById("saveBirthdayBtn").addEventListener("click", saveBirthdaySetup);

async function saveBirthdaySetup(){
  const name = document.getElementById("birthdayName")?.value.trim() || "";
  const date = document.getElementById("birthdayDate")?.value || "";
  const photoInput = document.getElementById("birthdayPhoto");
  if(!name) return alert("Birthday Boy / Girl का नाम दर्ज करें।");
  if(!date) return alert("Date चुनें।");

  let photo_url = "";
  if(photoInput && photoInput.files && photoInput.files[0]){
    photo_url = await new Promise(resolve=>{
      const r=new FileReader();
      r.onload=()=>resolve(r.result);
      r.onerror=()=>resolve("");
      r.readAsDataURL(photoInput.files[0]);
    });
  }

  const data={name,gender:"boy",photo_url,event_date:date,welcome_name:""};
  localStorage.setItem("birthdaySetup",JSON.stringify(data));
  localStorage.setItem("birthdayPhoto",photo_url);
  localStorage.setItem("eventSetupData",JSON.stringify({
    event_type:"birthday",wedding_type:"birthday",
    first_name:name,second_name:"",
    event_date:date,welcome_name:"",
    first_photo_url:photo_url,second_photo_url:"",
    groom_name:name,bride_name:null,
    groom_photo_url:photo_url,bride_photo_url:null,
    saved_at:new Date().toISOString()
  }));
  localStorage.setItem("offlineSetupData",localStorage.getItem("eventSetupData"));

  alert("Birthday Setup सफलतापूर्वक सेव हो गया।");
  location.replace("birthday-entry.html");
}
