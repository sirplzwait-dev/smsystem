// Multi-event context bridge: connects a saved Event to its existing legacy entry page.
(function(){
  const p=new URLSearchParams(location.search);
  const id=p.get("event_id");
  if(!id)return;
  let events=[];try{events=JSON.parse(localStorage.getItem("sagunEvents")||"[]")}catch(e){}
  const ev=events.find(x=>x.id===id);
  if(!ev)return;
  localStorage.setItem("currentEventId",ev.id);
  localStorage.setItem("currentEventType",ev.event_type||"");
  localStorage.setItem("currentEventData",JSON.stringify(ev));
  // Keep the existing event pages working without replacing them.
  const legacy={
    wedding_type: ev.event_type==="housewarming"?"griha_pravesh":ev.event_type,
    event_type: ev.event_type, event_date:ev.event_date||"", welcome_name:ev.welcome_name||"",
    event_name:ev.event_name||"",
    groom_name:ev.person1||"", bride_name:ev.person2||"",
    first_name:ev.person1||"", birthday_name:ev.person1||"",
    groom_photo_url:ev.photo1_url||"", bride_photo_url:ev.photo2_url||"",
    first_photo_url:ev.photo1_url||"", qr_url:ev.qr_url||""
  };
  localStorage.setItem("eventSetupData",JSON.stringify(legacy));
  localStorage.setItem("offlineSetupData",JSON.stringify(legacy));
  localStorage.setItem("currentMarriageEvent",ev.event_type||"barat");
  if(ev.event_type==="birthday") localStorage.setItem("birthdaySetup",JSON.stringify({name:ev.person1||"",photo_url:ev.photo1_url||"",event_date:ev.event_date||"",welcome_name:ev.welcome_name||"",gender:"boy",event_type:"birthday"}));
})();
