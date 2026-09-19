(function(){
  const MONTHS=['जनवरी','फरवरी','मार्च','अप्रैल','मई','जून','जुलाई','अगस्त','सितंबर','अक्टूबर','नवंबर','दिसंबर'];
  const WEEK=['रवि','सोम','मंगल','बुध','गुरु','शुक्र','शनि'];
  const pad=n=>String(n).padStart(2,'0');
  const iso=(y,m,d)=>`${y}-${pad(m+1)}-${pad(d)}`;
  let active=null;
  function close(){if(active){active.pop.hidden=true;active=null;}}
  function parse(v){if(/^\d{4}-\d{2}-\d{2}$/.test(v)){const [y,m,d]=v.split('-').map(Number);return new Date(y,m-1,d)}return new Date()}
  function initInput(input){
    if(input.dataset.sgPremiumCalendar==='1')return;
    input.dataset.sgPremiumCalendar='1';
    const wrap=document.createElement('div');wrap.className='sg-date-wrap';input.parentNode.insertBefore(wrap,input);wrap.appendChild(input);
    const icon=document.createElement('button');icon.type='button';icon.className='sg-date-icon';icon.innerHTML='📅';icon.setAttribute('aria-label','Calendar खोलें');wrap.appendChild(icon);
    const pop=document.createElement('div');pop.className='sg-premium-calendar';pop.hidden=true;
    pop.innerHTML=`<div class="sg-cal-head"><button type="button" class="sg-cal-nav" data-nav="-1">‹</button><div class="sg-cal-selects"><select class="sg-cal-month"></select><select class="sg-cal-year"></select></div><button type="button" class="sg-cal-nav" data-nav="1">›</button></div><div class="sg-cal-week">${WEEK.map(x=>`<span>${x}</span>`).join('')}</div><div class="sg-cal-days"></div><div class="sg-cal-foot"><button type="button" class="sg-cal-today">आज</button><button type="button" class="sg-cal-clear">साफ</button><button type="button" class="sg-cal-close">बंद</button></div>`;
    document.body.appendChild(pop);
    const ms=pop.querySelector('.sg-cal-month'), ys=pop.querySelector('.sg-cal-year'), days=pop.querySelector('.sg-cal-days');
    ms.innerHTML=MONTHS.map((m,i)=>`<option value="${i}">${m}</option>`).join('');
    for(let y=1950;y<=2100;y++)ys.insertAdjacentHTML('beforeend',`<option value="${y}">${y}</option>`);
    let view=parse(input.value);
    function draw(){
      const y=+ys.value,m=+ms.value;view=new Date(y,m,1);let first=view.getDay(),total=new Date(y,m+1,0).getDate(),html='';
      for(let i=0;i<42;i++){let n=i-first+1;if(n<1||n>total){html+=`<button type="button" class="sg-cal-day muted" disabled>${n<1?new Date(y,m,0).getDate()+n:n-total}</button>`;continue}let v=iso(y,m,n),today=iso(new Date().getFullYear(),new Date().getMonth(),new Date().getDate());html+=`<button type="button" class="sg-cal-day${v===input.value?' selected':''}${v===today?' today':''}" data-date="${v}">${n}</button>`}
      days.innerHTML=html;
    }
    function open(){close();view=parse(input.value);ms.value=view.getMonth();ys.value=view.getFullYear();draw();pop.hidden=false;active={pop,wrap};position();}
    function position(){const r=input.getBoundingClientRect(),pw=Math.min(360,window.innerWidth-24),ph=Math.min(pop.scrollHeight||430,window.innerHeight-24);let left=Math.max(12,Math.min(r.left,window.innerWidth-pw-12)),top=r.bottom+8;if(top+ph>window.innerHeight-10)top=Math.max(10,r.top-ph-8);pop.style.left=left+'px';pop.style.top=top+'px';}
    function set(v){input.value=v;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));}
    icon.onclick=open;input.addEventListener('click',e=>{e.preventDefault();open()});input.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open()}});
    pop.addEventListener('click',e=>{const nav=e.target.closest('[data-nav]');if(nav){view=new Date(+ys.value,+ms.value,+nav.dataset.nav,1);ms.value=view.getMonth();ys.value=view.getFullYear();draw();return}const day=e.target.closest('[data-date]');if(day){set(day.dataset.date);close();return}if(e.target.closest('.sg-cal-today')){const d=new Date();set(iso(d.getFullYear(),d.getMonth(),d.getDate()));close();return}if(e.target.closest('.sg-cal-clear')){set('');close();return}if(e.target.closest('.sg-cal-close'))close()});
    ms.onchange=draw;ys.onchange=draw;window.addEventListener('resize',()=>{if(active?.pop===pop)position()});window.addEventListener('scroll',()=>{if(active?.pop===pop)position()},{passive:true});
  }
  function init(){document.querySelectorAll('input[type="date"]').forEach(initInput)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
