/* Sagun session manager
   Registered users: Supabase session (persistent according to Supabase/browser settings).
   Guests: local guest session + local app data expire after 7 days.
*/
(function () {
  const SESSION_KEY = "sagunGuestSession";
  const GUEST_DAYS = 7;
  const GUEST_MS = GUEST_DAYS * 24 * 60 * 60 * 1000;

  function now() { return Date.now(); }

  function read() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); }
    catch (_) { return null; }
  }

  function clearGuestData() {
    const keys = [
      "sagunGuestSession",
      "sagunGuestCreatedAt",
      "sagunEvents",
      "offlineGuests",
      "eventSetupData",
      "offlineSetupData",
      "currentEventSetup",
      "sagunSetup",
      "birthdaySetup",
      "birthdayPhoto",
      "birthdayPhotoPending",
      "currentEventId",
      "currentEventType",
      "pendingEventType",
      "selectedEventType",
      "currentMarriageEvent"
    ];
    keys.forEach(k => localStorage.removeItem(k));
    sessionStorage.clear();
  }

  function ensureValid() {
    const s = read();
    if (!s) return null;
    if (!s.expiresAt || now() >= s.expiresAt) {
      clearGuestData();
      return null;
    }
    return s;
  }

  window.SagunSession = {
    guestDays: GUEST_DAYS,

    startGuest() {
      const createdAt = now();
      const session = {
        type: "guest",
        id: "guest-" + (crypto.randomUUID ? crypto.randomUUID() : createdAt + "-" + Math.random().toString(36).slice(2)),
        name: "Guest",
        createdAt,
        expiresAt: createdAt + GUEST_MS
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      localStorage.setItem("sagunGuestCreatedAt", String(createdAt));
      return session;
    },

    getGuest() {
      return ensureValid();
    },

    isGuest() {
      return !!ensureValid();
    },

    logoutGuest() {
      // Keep guest data for the remaining 7-day period.
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.clear();
    },

    cleanupExpired() {
      ensureValid();
    },

    async getSupabaseUser(sb) {
      try {
        const result = await sb.auth.getUser();
        return result?.data?.user || null;
      } catch (_) {
        return null;
      }
    },

    async requireAppSession(sb) {
      this.cleanupExpired();
      const user = await this.getSupabaseUser(sb);
      if (user) return { type: "registered", user };
      const guest = this.getGuest();
      if (guest) return { type: "guest", guest };
      location.replace("../html/login.html");
      return null;
    }
  };

  // Expired guest data is cleaned when any app page loads this script.
  SagunSession.cleanupExpired();
})();
