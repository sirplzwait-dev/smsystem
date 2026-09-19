
/* Sagun global wait/process UI
   Adds a consistent animation for save/delete/export/login/upload/navigation actions.
*/
(function(){
  if(window.SagunProcess) return;

  var overlay, textEl, subEl, progress, timer;

  function ensure(){
    if(overlay) return;
    overlay=document.createElement("div");
    overlay.id="sagunProcessOverlay";
    overlay.innerHTML=
      '<div class="sagun-process-box" role="status" aria-live="polite">'+
        '<div class="sagun-process-spinner"></div>'+
        '<div class="sagun-process-text">Please wait...</div>'+
        '<div class="sagun-process-sub">काम हो रहा है</div>'+
      '</div>';
    document.body.appendChild(overlay);

    progress=document.createElement("div");
    progress.id="sagunProgressBar";
    document.body.appendChild(progress);
    textEl=overlay.querySelector(".sagun-process-text");
    subEl=overlay.querySelector(".sagun-process-sub");
  }

  function startBar(){
    if(!progress) return;
    progress.style.opacity="1";
    progress.style.width="18%";
    setTimeout(function(){if(progress) progress.style.width="58%"},120);
    setTimeout(function(){if(progress) progress.style.width="82%"},550);
  }

  function hide(){
    if(!overlay) return;
    overlay.classList.remove("active");
    if(progress){
      progress.style.width="100%";
      setTimeout(function(){
        if(progress){progress.style.opacity="0";progress.style.width="0"}
      },250);
    }
    clearTimeout(timer);
  }

  function show(message, sub){
    ensure();
    textEl.textContent=message||"Please wait...";
    subEl.textContent=sub||"काम हो रहा है";
    overlay.classList.add("active");
    startBar();
    clearTimeout(timer);
    timer=setTimeout(hide,20000);
  }

  function labelFor(el){
    var t=((el.innerText||el.value||el.getAttribute("aria-label")||"")+"").trim().toLowerCase();
    if(/delete|remove|erase|account/.test(t)) return ["Deleting...","डेटा हटाया जा रहा है"];
    if(/export|download|pdf|excel|report/.test(t)) return ["Preparing...","रिपोर्ट तैयार हो रही है"];
    if(/upload|photo|image|file/.test(t)) return ["Uploading...","फाइल तैयार हो रही है"];
    if(/sync|backup|restore/.test(t)) return ["Syncing...","डेटा sync हो रहा है"];
    if(/login|sign in/.test(t)) return ["Signing in...","कृपया प्रतीक्षा करें"];
    if(/register|create account|creating/.test(t)) return ["Creating account...","खाता बनाया जा रहा है"];
    if(/save|submit|add|update|confirm|verify|send|resend/.test(t)) return ["Processing...","आपका काम process हो रहा है"];
    return ["Please wait...","काम हो रहा है"];
  }

  function shouldAnimate(el){
    if(!el || el.disabled) return false;
    if(el.closest("[data-no-process-animation]")) return false;
    var t=((el.innerText||el.value||el.getAttribute("aria-label")||"")+"").trim().toLowerCase();
    return /save|submit|add|update|delete|remove|erase|export|download|pdf|excel|report|upload|sync|backup|restore|login|sign in|register|create account|verify|send|resend|confirm|process|continue|next|logout/.test(t);
  }

  function buttonBusy(el){
    if(el.classList.contains("sagun-btn-processing")) return;
    el.classList.add("sagun-btn-processing");
    el.setAttribute("aria-busy","true");
    el.dataset.sagunOldDisabled=el.disabled?"1":"0";
    if("disabled" in el) el.disabled=true;
    setTimeout(function(){
      if(document.body.contains(el) && !document.body.contains(overlay) || !overlay || !overlay.classList.contains("active")){
        el.classList.remove("sagun-btn-processing");
        el.removeAttribute("aria-busy");
        if("disabled" in el) el.disabled=(el.dataset.sagunOldDisabled==="1");
      }
    },20000);
  }

  window.SagunProcess={
    show:show, hide:hide,
    saving:function(){show("Saving...","डेटा save हो रहा है")},
    loading:function(){show("Loading...","डेटा लोड हो रहा है")},
    processing:function(){show("Processing...","काम process हो रहा है")},
    syncing:function(){show("Syncing...","डेटा sync हो रहा है")}
  };

  document.addEventListener("click",function(e){
    var el=e.target.closest("button,input[type=submit],input[type=button],a");
    if(!el || !shouldAnimate(el)) return;

    var href=el.getAttribute("href")||"";
    if(el.tagName==="A" && href && (href.startsWith("#") || href.startsWith("javascript:"))) return;

    var p=labelFor(el);
    buttonBusy(el);
    show(p[0],p[1]);
  },true);

  document.addEventListener("submit",function(e){
    var form=e.target;
    if(form.closest("[data-no-process-animation]")) return;
    var submit=form.querySelector('button[type="submit"],input[type="submit"]');
    if(submit){
      var p=labelFor(submit);
      buttonBusy(submit);
      show(p[0],p[1]);
    }else{
      show("Processing...","आपका काम process हो रहा है");
    }
  },true);

  // Non-GET fetches show a wait animation automatically.
  var nativeFetch=window.fetch;
  if(nativeFetch){
    window.fetch=function(){
      var args=arguments, req=args[0], init=args[1]||{};
      var method=(init.method || (req && req.method) || "GET").toUpperCase();
      if(method!=="GET") show("Please wait...","Server से data process हो रहा है");
      return nativeFetch.apply(this,args).then(function(r){
        if(method!=="GET") setTimeout(hide,120);
        return r;
      }).catch(function(err){
        if(method!=="GET") hide();
        throw err;
      });
    };
  }

  // Hide when SweetAlert/success/error dialogs appear.
  var obs=new MutationObserver(function(){
    if(document.querySelector(".swal2-container")) hide();
  });
  if(document.documentElement) obs.observe(document.documentElement,{childList:true,subtree:true});

  window.addEventListener("pageshow",hide);
  window.addEventListener("load",function(){setTimeout(hide,120)});
})();
