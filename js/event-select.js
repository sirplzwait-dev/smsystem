localStorage.removeItem("currentEventId");localStorage.removeItem("currentEventSetup");localStorage.removeItem("eventSetupData");localStorage.removeItem("offlineSetupData");
const EVENTS=[
 {type:'marriage',icon:'💍',title:'शादी / विवाह',desc:'तिलक, बरात और Reception'},
 {type:'birthday',icon:'🎂',title:'Birthday',desc:'जन्मदिन समारोह'},
 {type:'engagement',icon:'💖',title:'सगाई',desc:'Engagement समारोह'},
 {type:'griha_pravesh',icon:'🏠',title:'गृह प्रवेश',desc:'नए घर का शुभ प्रवेश'},
 {type:'anniversary',icon:'❤️',title:'सालगिरह',desc:'Wedding Anniversary'},
 {type:'mundan',icon:'👶',title:'मुंडन / छठी',desc:'बच्चे का शुभ समारोह'},
 {type:'namkaran',icon:'🍼',title:'नामकरण',desc:'नामकरण समारोह'},
 {type:'puja',icon:'🪔',title:'पूजा / हवन',desc:'धार्मिक समारोह'},
 {type:'retirement',icon:'🎓',title:'विदाई / Retirement',desc:'सम्मान एवं विदाई समारोह'},
 {type:'other',icon:'🎉',title:'अन्य समारोह',desc:'कोई भी विशेष कार्यक्रम'}
];
const grid=document.getElementById('eventGrid');
EVENTS.forEach(e=>{const b=document.createElement('button');b.className='event';b.innerHTML=`<div class="ico">${e.icon}</div><h3>${e.title}</h3><p>${e.desc}</p><span class="badge">चुनें →</span>`;b.onclick=()=>location.href=`setup.html?event=${encodeURIComponent(e.type)}`;grid.appendChild(b)});
