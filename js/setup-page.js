/* Event chooser: the Home page is the entry point for adding events. */
const SAGUN_SB_URL = "https://rdlliurzgwwfjscgwssa.supabase.co";
const SAGUN_SB_KEY = "sb_publishable_HX1QmjO0SPyW3rUoihZkkQ_tRTE1bLc";

async function checkAppAccess(){
  const sb = window.supabase.createClient(SAGUN_SB_URL, SAGUN_SB_KEY);
  return window.SagunSession ? await window.SagunSession.requireAppSession(sb) : null;
}

document.addEventListener("DOMContentLoaded", async () => {
  const app = await checkAppAccess();
  if(!app) return;

  document.querySelectorAll('[data-event]').forEach(card => {
    card.addEventListener('click', () => {
      const type=card.dataset.event;
      localStorage.setItem('pendingEventType',type);
      localStorage.setItem('selectedEventType',type);
      location.href='event-details.html';
    });
  });
});
