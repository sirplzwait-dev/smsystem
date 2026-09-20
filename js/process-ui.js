/* SGUNMS process UI disabled.
   User preference: no processing/loading animations or overlays.
   Functions remain available so existing pages continue to work. */
(function(){
  if(window.SagunProcess) return;
  function noop(){ return; }
  window.SagunProcess={
    show: noop,
    hide: noop,
    loading: noop,
    saving: noop,
    processing: noop,
    syncing: noop
  };
})();
