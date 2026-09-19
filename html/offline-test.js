/* SAGUN OFFLINE TEST MODE */
window.OFFLINE_TEST_MODE = true;
window.TEST_USER_ID = localStorage.getItem("test_user_id") || "offline-test-user";
localStorage.setItem("test_user_id", window.TEST_USER_ID);
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister())).catch(()=>{});
}
if ("caches" in window) {
  caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).catch(()=>{});
}
