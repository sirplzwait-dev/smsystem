
const SAGUN_DB_URL = "https://rdlliurzgwwfjscgwssa.supabase.co";
const SAGUN_DB_KEY = "sb_publishable_HX1QmjO0SPyW3rUoihZkkQ_tRTE1bLc";
const sagunDB = window.supabase.createClient(SAGUN_DB_URL, SAGUN_DB_KEY);

function newEventId(){
  return (crypto.randomUUID ? crypto.randomUUID() : "evt-"+Date.now()+"-"+Math.random().toString(36).slice(2));
}

async function persistSagunEvent({data,eventName,person1="",person2="",photo1="",photo2="",qr="",route}){
  const id=newEventId();
  const record={
    id,
    event_name:eventName || data.event_type || "समारोह",
    event_type:data.event_type || data.wedding_type || "other",
    event_date:data.event_date || "",
    welcome_name:data.welcome_name || "",
    person1, person2,
    photo1_url:photo1 || "",
    photo2_url:photo2 || "",
    qr_url:qr || "",
    created_at:new Date().toISOString()
  };

  // Keep a local copy so the legacy entry pages can immediately open the selected event.
  if(window.SagunStore){ await window.SagunStore.addEvent(record); }
  localStorage.setItem("currentEventId",id);

  // Registered users get permanent storage in the multi-event Supabase table.
  try{
    const {data:{user}}=await sagunDB.auth.getUser();
    if(user){
      const {error}=await sagunDB.from("events").insert([{
        id,
        user_id:user.id,
        event_name:record.event_name,
        event_type:record.event_type,
        event_date:record.event_date,
        welcome_name:record.welcome_name,
        person1:record.person1,
        person2:record.person2,
        photo1_url:record.photo1_url,
        photo2_url:record.photo2_url,
        qr_url:record.qr_url
      }]);
      if(error) console.warn("Permanent event save unavailable; local copy kept.",error.message);
    }
  }catch(e){
    console.warn("Event database save skipped.",e);
  }

  localStorage.setItem("currentEventType",record.event_type);
  localStorage.setItem("pendingEventType",record.event_type);
  localStorage.setItem("selectedEventType",record.event_type);
  if(route) location.href=route+"?event_id="+encodeURIComponent(id);
  return id;
}

// Event cards select the existing event selector without changing existing forms.
document.querySelectorAll('#eventCardGrid .event-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('#eventCardGrid .event-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    const select = document.getElementById('mainEvent');
    select.value = card.dataset.event;
    chooseMainEvent();
    document.querySelectorAll('#eventCardGrid .event-card').forEach(c => {
      c.setAttribute('aria-pressed', c === card ? 'true' : 'false');
    });
  });
});

let currentPreview="", cropped={};
const editor={img:null,scale:1,rotation:0,x:0,y:0,drag:false,lastX:0,lastY:0,url:null};
const canvas=document.getElementById('editorCanvas'), ctx=canvas.getContext('2d');
const stage=document.getElementById('editorStage'), modal=document.getElementById('cropModal');

function fitEditor(){
  if(!editor.img)return;
  const w=editor.img.naturalWidth||editor.img.width, h=editor.img.naturalHeight||editor.img.height;
  const base=Math.max(canvas.width/w,canvas.height/h);
  editor.scale=base; editor.x=canvas.width/2; editor.y=canvas.height/2; editor.rotation=0;
  drawEditor();
}
function drawEditor(){
  if(!editor.img)return;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.save(); ctx.fillStyle='#202020'; ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.translate(editor.x,editor.y); ctx.rotate(editor.rotation*Math.PI/180);
  const w=editor.img.naturalWidth*editor.scale, h=editor.img.naturalHeight*editor.scale;
  ctx.drawImage(editor.img,-w/2,-h/2,w,h); ctx.restore();
}
function changeZoom(delta){editor.scale=Math.max(.05,Math.min(8,editor.scale*(1+delta)));drawEditor()}
function rotate(deg){editor.rotation=(editor.rotation+deg)%360;drawEditor()}
function closeCrop(){
  modal.classList.remove('open'); modal.setAttribute('aria-hidden','true');
  if(editor.url){URL.revokeObjectURL(editor.url);editor.url=null;} editor.img=null; editor.drag=false;
}
function openCrop(file, previewId){
  if(!file)return; currentPreview=previewId;
  if(!file.type.startsWith('image/')){Swal.fire('गलत फाइल','कृपया image file चुनें।','warning');return;}
  if(editor.url)URL.revokeObjectURL(editor.url);
  editor.url=URL.createObjectURL(file); editor.img=new Image();
  editor.img.onload=()=>{fitEditor();};
  editor.img.onerror=()=>{Swal.fire('फोटो नहीं खुली','इस फोटो format को browser नहीं पढ़ पा रहा है।','error');closeCrop();};
  editor.img.src=editor.url;
  modal.classList.add('open'); modal.setAttribute('aria-hidden','false');
}

function pointerPos(e){const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*(canvas.width/r.width),y:(e.clientY-r.top)*(canvas.height/r.height)}}
canvas.addEventListener('pointerdown',e=>{if(!editor.img)return;const p=pointerPos(e);editor.drag=true;editor.lastX=p.x;editor.lastY=p.y;stage.classList.add('dragging');canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener('pointermove',e=>{if(!editor.drag)return;const p=pointerPos(e);editor.x+=p.x-editor.lastX;editor.y+=p.y-editor.lastY;editor.lastX=p.x;editor.lastY=p.y;drawEditor()});
canvas.addEventListener('pointerup',e=>{editor.drag=false;stage.classList.remove('dragging');try{canvas.releasePointerCapture(e.pointerId)}catch(_){}});
canvas.addEventListener('pointercancel',()=>{editor.drag=false;stage.classList.remove('dragging')});
canvas.addEventListener('wheel',e=>{e.preventDefault();changeZoom(e.deltaY<0?.08:-.08)},{passive:false});

document.getElementById('zoomIn').onclick=()=>changeZoom(.12);
document.getElementById('zoomOut').onclick=()=>changeZoom(-.12);
document.getElementById('rotateLeft').onclick=()=>rotate(-90);
document.getElementById('rotateRight').onclick=()=>rotate(90);
document.getElementById('resetEditor').onclick=fitEditor;
document.getElementById('closeCrop').onclick=closeCrop;
document.getElementById('cropSave').onclick=()=>{
  if(!editor.img)return;
  canvas.toBlob(blob=>{
    if(!blob)return;
    const file=new File([blob],'photo.jpg',{type:'image/jpeg'});
    cropped[currentPreview]=file;
    const target=document.getElementById(currentPreview);
    if(target){if(target.dataset.objectUrl)URL.revokeObjectURL(target.dataset.objectUrl);target.dataset.objectUrl=URL.createObjectURL(file);target.src=target.dataset.objectUrl;}
    closeCrop();
  },'image/jpeg',.92);
};
modal.addEventListener('click',e=>{if(e.target===modal)closeCrop()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('open'))closeCrop()});

document.getElementById('firstPhoto').onchange=e=>openCrop(e.target.files[0],'firstPreview');
document.getElementById('secondPhoto').onchange=e=>openCrop(e.target.files[0],'secondPreview');
document.getElementById('qrPhoto').onchange=e=>openCrop(e.target.files[0],'qrPreview');
const birthdayPhotoInput=document.getElementById('birthdayPhoto'); if(birthdayPhotoInput) birthdayPhotoInput.onchange=e=>openCrop(e.target.files[0],'birthdayPreview');
document.getElementById('grihaPhoto').onchange=e=>openCrop(e.target.files[0],'grihaPreview');

async function fileData(file){
  if(!file)return "";
  return await new Promise((resolve,reject)=>{
    const r=new FileReader();
    r.onload=()=>resolve(r.result);
    r.onerror=reject;
    r.readAsDataURL(file);
  });
}


function chooseMainEvent(){
  const v=document.getElementById("mainEvent").value;
  const picker=document.querySelector('.event-picker-wrap');
  if(picker) picker.classList.toggle('marriage-visible', v==='marriage');
  const mo=document.getElementById("marriageOptions");
  if(mo) mo.style.display = v==="marriage" ? "block" : "none";
  const mf=document.getElementById("marriageForm"); if(mf) mf.style.display="none";
  const bf=document.getElementById("birthdayForm"); if(bf) bf.style.display=v==="birthday" ? "block" : "none";
  const ef=document.getElementById("engagementForm"); if(ef) ef.style.display=v==="engagement" ? "block" : "none";
  const gf=document.getElementById("grihaPraveshForm"); if(gf) gf.style.display=v==="griha_pravesh" ? "block" : "none";
  const af=document.getElementById("anniversaryForm"); if(af) af.style.display=v==="anniversary" ? "block" : "none";
  const titles={
    marriage:"💍 Marriage / शादी",birthday:"🎂 Birthday",engagement:"💖 Engagement / सगाई",griha_pravesh:"🏠 गृह प्रवेश",
    baby_shower:"🍼 गोद भराई / Baby Shower",naamkaran:"👶 नामकरण / Naamkaran",mundan:"✂️ मुंडन / Mundan",
    upanayan:"📿 उपनयन / जनेऊ",anniversary:"💐 वर्षगांठ / Anniversary",retirement:"🎖️ विदाई / Retirement",
    religious:"🙏 धार्मिक आयोजन",family_function:"👨‍👩‍👧‍👦 पारिवारिक समारोह",puja:"🪔 पूजा / उत्सव",other:"🎊 अन्य समारोह"
  };
  const t=document.getElementById("mainTitle"); if(t) t.textContent=titles[v]||"🎉 समारोह चुनें";
}

function chooseMarriageEvent(){
  const v=document.getElementById("marriageEvent").value;
  const form=document.getElementById("marriageForm"); if(form) form.style.display=v ? "block" : "none";
  const a=document.getElementById("firstTitle"), b=document.getElementById("secondTitle");
  const al=document.getElementById("firstLabel"), bl=document.getElementById("secondLabel");
  const f=document.getElementById("firstName"), s=document.getElementById("secondName");
  const config={
    tilak:{title:"🪔 लड़के का तिलक / Tilak",a:"🤵 वर पक्ष / Groom Side",al:"लड़के का नाम / Groom Name",fp:"लड़के का नाम लिखें / Enter groom name",b:"👰 वधू पक्ष / Bride Side",bl:"लड़की का नाम / Bride Name",sp:"लड़की का नाम लिखें / Enter bride name"},
    barat:{title:"🥁 बरात / Barat",a:"👰 वधू पक्ष / Bride Side",al:"लड़की का नाम / Bride Name",fp:"लड़की का नाम लिखें / Enter bride name",b:"🤵 बरात पक्ष / Groom Side",bl:"लड़के का नाम / Groom Name",sp:"लड़के का नाम लिखें / Enter groom name"},
    reception:{title:"🎉 रिसेप्शन / Reception",a:"🤵 दूल्हा / Groom",al:"दूल्हे का नाम / Groom Name",fp:"दूल्हे का नाम लिखें / Enter groom name",b:"👰 दुल्हन / Bride",bl:"दुल्हन का नाम / Bride Name",sp:"दुल्हन का नाम लिखें / Enter bride name"}
  };
  const c=config[v]; if(!c)return;
  const t=document.getElementById("mainTitle");
  if(t){
    t.textContent=c.title;
    t.classList.remove("marriage-tilak","marriage-barat","marriage-reception");
    t.classList.add("marriage-"+v);
  }
  if(a)a.textContent=c.a; if(al)al.textContent=c.al; if(f)f.placeholder=c.fp;
  if(b)b.textContent=c.b; if(bl)bl.textContent=c.bl; if(s)s.placeholder=c.sp;
}

async function saveMarriage(){
  const type=document.getElementById("marriageEvent").value;
  const n1=document.getElementById("firstName").value.trim();
  const n2=document.getElementById("secondName").value.trim();
  const welcomeEl=document.getElementById("welcomeBy");
  const welcome=welcomeEl ? welcomeEl.value.trim() : "";
  const date=document.getElementById("eventDate").value.trim();

  if(!type)return Swal.fire("कार्यक्रम चुनें","तिलक, बरात या Reception चुनें।","warning");
  if(!n1||!n2)return Swal.fire("नाम भरें","दोनों नाम जरूरी हैं।","warning");
  if(!welcome)return Swal.fire("स्वागतकर्ता का नाम भरें","कृपया स्वागत करता का नाम लिखें।","warning");

  const p1=await fileData(cropped.firstPreview);
  const p2=await fileData(cropped.secondPreview);
  const qr=await fileData(cropped.qrPreview);

  const brideFirst = type==="barat";
  const groom = brideFirst ? n2 : n1;
  const bride = brideFirst ? n1 : n2;
  const groomPhoto = brideFirst ? p2 : p1;
  const bridePhoto = brideFirst ? p1 : p2;

  const data={
    event_group:"marriage", event_type:type,
    groom_name:groom, bride_name:bride, welcome_name:welcome,
    event_date:date, groom_photo_url:groomPhoto, bride_photo_url:bridePhoto,
    qr_url:qr, first_photo_url:p1, second_photo_url:p2,
    saved_at:new Date().toISOString()
  };
  localStorage.setItem("eventSetupData",JSON.stringify(data));
  localStorage.setItem("sagunSetup",JSON.stringify(data));
  localStorage.setItem("offlineSetupData",JSON.stringify(data));

  const page = type==="tilak" ? "tilak-entry.html" : type==="reception" ? "reception-entry.html" : "barat-entry.html";
  const id = await persistSagunEvent({
    data,eventName:"शादी — "+(type==="tilak"?"तिलक":type==="reception"?"रिसेप्शन":"बरात"),
    person1:n1,person2:n2,photo1:p1,photo2:p2,qr,route:page
  });
  await Swal.fire({icon:"success",title:"Setup Saved",timer:700,showConfirmButton:false});
  return id;
}

async function saveEngagement(){
  const groom=document.getElementById("engagementGroom").value.trim();
  const bride=document.getElementById("engagementBride").value.trim();
  const date=document.getElementById("engagementDate").value.trim();
  const welcome=document.getElementById("engagementWelcome").value.trim();
  if(!groom||!bride)return Swal.fire("नाम भरें","लड़के और लड़की दोनों के नाम जरूरी हैं।","warning");
  if(!date)return Swal.fire("तारीख चुनें","सगाई की तारीख चुनें।","warning");
  const data={event_group:"engagement",event_type:"engagement",groom_name:groom,bride_name:bride,event_date:date,welcome_name:welcome,saved_at:new Date().toISOString()};
  localStorage.setItem("eventSetupData",JSON.stringify(data));
  localStorage.setItem("sagunSetup",JSON.stringify(data));
  localStorage.setItem("offlineSetupData",JSON.stringify(data));
  const id = await persistSagunEvent({
    data,eventName:"सगाई / Engagement",person1:groom,person2:bride,route:"engagement-entry.html"
  });
  localStorage.setItem("currentMarriageEvent","engagement");
  await Swal.fire({icon:"success",title:"💖 Engagement Setup Saved",timer:700,showConfirmButton:false});
  return id;
}

async function saveGrihaPravesh(){
  const data={event_group:"griha_pravesh",event_type:"griha_pravesh",event_date:"",welcome_name:"",saved_at:new Date().toISOString()};
  localStorage.setItem("eventSetupData",JSON.stringify(data));
  localStorage.setItem("offlineSetupData",JSON.stringify(data));
  const id=await persistSagunEvent({data,eventName:"🏠 गृह प्रवेश",route:"griha-pravesh-entry.html"});
  return id;
}

async function saveBirthday(){
  const name=document.getElementById("birthdayName").value.trim();
  const date=document.getElementById("birthdayDate").value;
  if(!name)return Swal.fire("नाम भरें","Birthday Boy / Girl का नाम लिखें।","warning");
  if(!date)return Swal.fire("Event Date भरें","कार्यक्रम की तारीख चुनें।","warning");
  const photo=await fileData(cropped.birthdayPreview);
  const data={event_group:"birthday",event_type:"birthday",name:name,birthday_name:name,birthday_date:date,event_date:date,photo_url:photo,birthday_photo_url:photo,first_photo_url:photo,saved_at:new Date().toISOString()};
  localStorage.setItem("birthdaySetup",JSON.stringify(data));
  localStorage.setItem("eventSetupData",JSON.stringify(data));
  localStorage.setItem("offlineSetupData",JSON.stringify(data));
  localStorage.setItem("birthdayPhoto",photo);
  localStorage.setItem("birthdayPhotoPending",photo);
  const id = await persistSagunEvent({
    data,eventName:"🎂 Birthday",person1:name,photo1:photo,route:"birthday-entry.html"
  });
  await Swal.fire({icon:"success",title:"🎂 Birthday Setup Saved",timer:700,showConfirmButton:false});
  return id;
}



(function(){
  const main=document.getElementById('mainEvent');
  const marriage=document.getElementById('marriageEvent');
  document.querySelectorAll('[data-event]').forEach(card=>card.addEventListener('click',()=>{
    main.value=card.dataset.event;
    document.querySelectorAll('[data-event]').forEach(c=>c.classList.remove('active')); card.classList.add('active');
    chooseMainEvent();
  }));
  document.querySelectorAll('[data-marriage-event]').forEach(card=>card.addEventListener('click',()=>{
    marriage.value=card.dataset.marriageEvent;
    document.querySelectorAll('[data-marriage-event]').forEach(c=>c.classList.remove('active')); card.classList.add('active');
    chooseMarriageEvent();
  }));
})();



(function(){
  const key='pendingEventType';
  const type=localStorage.getItem(key)||localStorage.getItem('selectedEventType')||'';
  const labels={
    baby_shower:'🍼 गोद भराई / Baby Shower', naamkaran:'👶 नामकरण / Naamkaran',
    mundan:'✂️ मुंडन / Mundan', upanayan:'📿 उपनयन / जनेऊ', anniversary:'💐 वर्षगांठ / Anniversary',
    retirement:'🎖️ विदाई / Retirement', religious:'🙏 धार्मिक आयोजन', family_function:'👨‍👩‍👧‍👦 पारिवारिक समारोह',
    puja:'🪔 पूजा / उत्सव', other:'🎊 अन्य समारोह'
  };
  if(type){
    const main=document.getElementById('mainEvent'); if(main) main.value=type;
    const picker=document.querySelector('.event-picker-wrap');
    if(picker) picker.classList.toggle('marriage-visible', type==='marriage');
    if(typeof chooseMainEvent==='function') chooseMainEvent();
    const generic=document.getElementById('genericForm');
    if(generic && false){
      generic.style.display='block';
      document.getElementById('mainTitle').textContent=labels[type]||'🎊 समारोह Details';
      document.getElementById('genericTitle').textContent=(labels[type]||'🎊 समारोह')+' Details';
    }
  }
})();

function anniversaryOrdinal(n){
  const x=n%100;
  return n + ((x>=11&&x<=13)?"th":(n%10===1?"st":n%10===2?"nd":n%10===3?"rd":"th"));
}
function getAnniversaryNumber(dateStr){
  if(!dateStr) return 0;
  const start=new Date(dateStr+"T00:00:00");
  if(Number.isNaN(start.getTime())) return 0;
  const now=new Date();
  let n=now.getFullYear()-start.getFullYear();
  const before=(now.getMonth()<start.getMonth()) || (now.getMonth()===start.getMonth() && now.getDate()<start.getDate());
  if(before) n--;
  return n>0?n:0;
}
function updateAnniversaryCount(){
  const el=document.getElementById('anniversaryDate');
  const info=document.getElementById('anniversaryYearInfo');
  if(!el||!info) return;
  const n=getAnniversaryNumber(el.value);
  info.textContent=n?('❤️ कितवीं Anniversary: '+anniversaryOrdinal(n)): '❤️ कितवीं Anniversary: —';
}
(function(){
  const el=document.getElementById('anniversaryDate');
  if(el){el.addEventListener('change',updateAnniversaryCount);el.addEventListener('input',updateAnniversaryCount);}
})();
async function saveAnniversary(){
  const husband=document.getElementById('anniversaryHusband').value.trim();
  const wife=document.getElementById('anniversaryWife').value.trim();
  const date=document.getElementById('anniversaryDate').value;
  const welcome=document.getElementById('anniversaryWelcome').value.trim();
  if(!husband||!wife) return Swal.fire('नाम भरें','पति और पत्नी दोनों के नाम जरूरी हैं।','warning');
  if(!date) return Swal.fire('तारीख चुनें','विवाह की तारीख चुनें।','warning');
  const n=getAnniversaryNumber(date);
  if(!n) return Swal.fire('तारीख जाँचें','विवाह की तारीख भविष्य की नहीं होनी चाहिए।','warning');
  const data={event_group:'anniversary',event_type:'anniversary',wedding_type:'anniversary',husband_name:husband,wife_name:wife,groom_name:husband,bride_name:wife,name:husband,event_person:husband,event_person_2:wife,event_date:date,anniversary_date:date,anniversary_number:n,anniversary_ordinal:anniversaryOrdinal(n),welcome_name:welcome,saved_at:new Date().toISOString()};
  localStorage.setItem('eventSetupData',JSON.stringify(data));
  localStorage.setItem('sagunSetup',JSON.stringify(data));
  localStorage.setItem('offlineSetupData',JSON.stringify(data));
  localStorage.setItem('currentEventType','anniversary');
  localStorage.setItem('selectedEventType','anniversary');
  localStorage.setItem('pendingEventType','anniversary');
  const id = await persistSagunEvent({
    data,eventName:"💐 Anniversary",person1:husband,person2:wife,route:"anniversary-entry.html"
  });
  await Swal.fire({icon:'success',title:'💐 Anniversary Setup Saved',timer:700,showConfirmButton:false});
  return id;
}

async function saveGenericEvent(){
  const type=localStorage.getItem('pendingEventType')||'other';
  const name=document.getElementById('genericName').value.trim();
  const date=document.getElementById('genericDate').value.trim();
  const welcome=document.getElementById('genericWelcome').value.trim();
  if(!name) return Swal.fire('नाम भरें','मुख्य व्यक्ति / परिवार का नाम लिखें।','warning');
  if(!date) return Swal.fire('तारीख चुनें','कार्यक्रम की तारीख चुनें।','warning');
  const data={event_group:type,event_type:type,name,event_name:name,event_date:date,welcome_name:welcome,saved_at:new Date().toISOString()};
  localStorage.setItem('eventSetupData',JSON.stringify(data));
  localStorage.setItem('sagunSetup',JSON.stringify(data));
  localStorage.setItem('offlineSetupData',JSON.stringify(data));
  localStorage.setItem('currentEventType',type);
  const id=await persistSagunEvent({data,eventName:name,person1:name,route:"generic-event-entry.html"});
  await Swal.fire({icon:'success',title:'Setup Saved',timer:700,showConfirmButton:false});
  return id;
}
