(() => {
  const $ = id => document.getElementById(id);
  let cropState = null;

  const EVENT = {
    barat:{title:'💑 शादी — बरात स्वागत', first:'👰 दुल्हन का नाम', second:'🤵 दूल्हा का नाम', firstPhoto:'📸 दुल्हन की फोटो', secondPhoto:'📸 दूल्हे की फोटो'},
    tilak:{title:'💍 शादी — तिलक समारोह', first:'🤵 लड़के का नाम', second:'👰 लड़की का नाम', firstPhoto:'📸 लड़के की फोटो', secondPhoto:'📸 लड़की की फोटो'},
    birthday:{title:'🎂 Birthday', first:'🎂 Birthday Boy / Girl का नाम'}
  };

  function toast(msg){
    const t=$('toast'); t.textContent=msg; t.style.display='block';
    clearTimeout(window.__toastTimer); window.__toastTimer=setTimeout(()=>t.style.display='none',2200);
  }

  function render(){
    const type=$('eventType').value, c=EVENT[type];
    $('weddingSection').classList.toggle('hidden', type==='birthday');
    $('birthdaySection').classList.toggle('hidden', type!=='birthday');
    $('weddingTitle').textContent=c.title;
    if(type!=='birthday'){
      $('firstLabel').textContent=c.first; $('secondLabel').textContent=c.second;
      $('firstPhotoLabel').textContent=c.firstPhoto; $('secondPhotoLabel').textContent=c.secondPhoto;
      $('welcomeLabel').textContent=type==='barat'?'🙏 बरात स्वागतकर्ता / निवेदक':'🙏 तिलककर्ता / निवेदक';
    }else{
      $('welcomeLabel').textContent='👨‍👩‍👦 परिवार / निवेदक का नाम';
    }
    $('welcomeName').placeholder=type==='birthday'?'जैसे: कुमार परिवार':'निवेदक का नाम';
  }

  function fileToImage(file){
    return new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onload=()=>{const img=new Image(); img.onload=()=>resolve(img); img.onerror=reject; img.src=reader.result;};
      reader.onerror=reject; reader.readAsDataURL(file);
    });
  }

  function openCrop(file,target,isQR=false){
    if(!file) return;
    fileToImage(file).then(img=>{
      cropState={img,target,isQR,zoom:1,rotation:0,x:0,y:0,drag:false,lastX:0,lastY:0};
      $('cropInfo').textContent=isQR?'Square QR Crop':'Square Photo Crop';
      $('zoomRange').value='1'; $('cropModal').style.display='flex';
      drawCrop();
    }).catch(()=>toast('फोटो पढ़ी नहीं जा सकी।'));
  }

  function drawCrop(){
    if(!cropState)return;
    const area=$('cropArea'), canvas=$('cropCanvas'), rect=area.getBoundingClientRect();
    const size=Math.floor(Math.min(rect.width,rect.height));
    canvas.width=size*2; canvas.height=size*2; canvas.style.width=size+'px'; canvas.style.height=size+'px';
    const ctx=canvas.getContext('2d'); ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.save(); ctx.translate(canvas.width/2+cropState.x*2,canvas.height/2+cropState.y*2); ctx.rotate(cropState.rotation*Math.PI/180);
    const img=cropState.img; const base=Math.max(canvas.width/img.width,canvas.height/img.height); const scale=base*cropState.zoom;
    ctx.drawImage(img,-img.width*scale/2,-img.height*scale/2,img.width*scale,img.height*scale); ctx.restore();
  }

  function pointerDown(e){if(!cropState)return; cropState.drag=true; const p=e.touches?e.touches[0]:e; cropState.lastX=p.clientX; cropState.lastY=p.clientY; $('cropCanvas').style.cursor='grabbing';}
  function pointerMove(e){if(!cropState?.drag)return; const p=e.touches?e.touches[0]:e; cropState.x+=p.clientX-cropState.lastX; cropState.y+=p.clientY-cropState.lastY; cropState.lastX=p.clientX; cropState.lastY=p.clientY; drawCrop(); if(e.cancelable)e.preventDefault();}
  function pointerUp(){if(!cropState)return; cropState.drag=false; $('cropCanvas').style.cursor='grab';}

  function saveCrop(){
    if(!cropState)return;
    const canvas=$('cropCanvas'), out=document.createElement('canvas'), size=cropState.isQR?500:600; out.width=size;out.height=size;
    const ctx=out.getContext('2d');
    ctx.fillStyle='#fff';ctx.fillRect(0,0,size,size);
    const scale=size/canvas.width; ctx.save();ctx.translate(size/2+cropState.x*2*scale,size/2+cropState.y*2*scale);ctx.rotate(cropState.rotation*Math.PI/180);
    const img=cropState.img, base=Math.max(canvas.width/img.width,canvas.height/img.height), finalScale=base*cropState.zoom*scale;
    ctx.drawImage(img,-img.width*finalScale/2,-img.height*finalScale/2,img.width*finalScale,img.height*finalScale);ctx.restore();
    const data=out.toDataURL('image/jpeg',cropState.isQR?.92:.82);
    const preview=$(cropState.target+'Preview'); preview.src=data; preview.style.display='block';
    const box=$(cropState.target==='qr'?'qrBox':cropState.target+'PhotoBox'); if(box) box.querySelector('.empty').style.display='none';
    if(cropState.target==='first') window.__photoFirst=data;
    if(cropState.target==='second') window.__photoSecond=data;
    if(cropState.target==='birthday') window.__photoBirthday=data;
    if(cropState.target==='qr') window.__photoQR=data;
    closeCrop(); toast('फोटो तैयार है ✓');
  }
  function closeCrop(){ $('cropModal').style.display='none'; cropState=null; }

  function bindPhoto(inputId,target,isQR=false){
    $(inputId).addEventListener('change',e=>openCrop(e.target.files?.[0],target,isQR));
    const boxId=target==='qr'?'qrBox':target+'PhotoBox';
    $(boxId).addEventListener('click',()=>$(inputId).click());
  }

  function getDate(){
    const v=$('eventDate').value; if(!v)return '';
    const [y,m,d]=v.split('-'); return `${d}-${m}-${y}`;
  }

  function save(){
    const type=$('eventType').value, date=getDate(), welcome=$('welcomeName').value.trim();
    let first='',second='',data={};
    if(type==='birthday'){
      first=$('birthdayName').value.trim();
      if(!first)return toast('Birthday Boy / Girl का नाम लिखें।');
      if(!date)return toast('Birthday की तारीख चुनें।');
      const b={name:first,gender:$('birthdayGender').value,photo_url:window.__photoBirthday||'',event_date:date,welcome_name:welcome};
      localStorage.setItem('birthdaySetup',JSON.stringify(b));
      localStorage.setItem('birthdayPhoto',b.photo_url);
      data={event_type:'birthday',wedding_type:'birthday',first_name:first,second_name:'',groom_name:first,bride_name:'',groom_photo_url:b.photo_url,bride_photo_url:'',qr_url:window.__photoQR||'',event_date:date,welcome_name:welcome,gender:b.gender,saved_at:new Date().toISOString()};
    }else{
      first=$('firstName').value.trim(); second=$('secondName').value.trim();
      if(!first||!second)return toast('दोनों नाम भरना जरूरी है।');
      if(!date)return toast('कार्यक्रम की तारीख चुनें।');
      if(!welcome)return toast('निवेदक / स्वागतकर्ता का नाम लिखें।');
      const groom=type==='barat'?second:first, bride=type==='barat'?first:second;
      const groomPhoto=type==='barat'?(window.__photoSecond||''):(window.__photoFirst||'');
      const bridePhoto=type==='barat'?(window.__photoFirst||''):(window.__photoSecond||'');
      data={event_type:type,wedding_type:type,first_name:first,second_name:second,groom_name:groom,bride_name:bride,groom_photo_url:groomPhoto,bride_photo_url:bridePhoto,qr_url:window.__photoQR||'',event_date:date,welcome_name:welcome,saved_at:new Date().toISOString()};
    }
    try{
      localStorage.setItem('eventSetupData',JSON.stringify(data));
      localStorage.setItem('offlineSetupData',JSON.stringify(data));
      localStorage.setItem('currentEventSetup',JSON.stringify(data));
      localStorage.setItem('sagunSetup',JSON.stringify(data));
      $('saveBtn').disabled=true; $('saveBtn').textContent='✓ Setup Saved';
      toast('Setup सफलतापूर्वक सेव हो गया ✓');
      setTimeout(()=>location.href=type==='birthday'?'birthday-entry.html':'barat-entry.html',500);
    }catch(e){console.error(e);toast('Storage में जगह कम है। फोटो थोड़ी छोटी करके फिर सेव करें।');}
  }

  $('eventType').addEventListener('change',render);
  $('saveBtn').addEventListener('click',save);
  bindPhoto('firstPhoto','first'); bindPhoto('secondPhoto','second'); bindPhoto('birthdayPhoto','birthday'); bindPhoto('qrPhoto','qr',true);
  $('zoomIn').onclick=()=>{if(cropState){cropState.zoom=Math.min(3,cropState.zoom+.1);$('zoomRange').value=cropState.zoom;drawCrop();}};
  $('zoomOut').onclick=()=>{if(cropState){cropState.zoom=Math.max(.5,cropState.zoom-.1);$('zoomRange').value=cropState.zoom;drawCrop();}};
  $('zoomRange').oninput=e=>{if(cropState){cropState.zoom=+e.target.value;drawCrop();}};
  $('rotateLeft').onclick=()=>{if(cropState){cropState.rotation-=90;drawCrop();}};
  $('rotateRight').onclick=()=>{if(cropState){cropState.rotation+=90;drawCrop();}};
  $('cropSave').onclick=saveCrop; $('cropClose').onclick=closeCrop;
  const cv=$('cropCanvas'); cv.addEventListener('mousedown',pointerDown);window.addEventListener('mousemove',pointerMove);window.addEventListener('mouseup',pointerUp);cv.addEventListener('touchstart',pointerDown,{passive:false});window.addEventListener('touchmove',pointerMove,{passive:false});window.addEventListener('touchend',pointerUp);
  window.addEventListener('resize',()=>{if(cropState)drawCrop();});
  const requested=new URLSearchParams(location.search).get('event');
  if(requested && EVENT[requested]) $('eventType').value=requested;
  render();
})();
