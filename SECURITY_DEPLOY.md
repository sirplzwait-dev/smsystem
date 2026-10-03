# SGUNMS Security Update

## What was hardened
1. Added `js/security-guard.js` to every protected HTML page.
2. Protected pages now require a real Supabase Auth session before showing the page.
3. Guest/localStorage-only mode cannot open protected pages.
4. Added stronger security headers in `_headers`.
5. Added `supabase/SECURITY_EXTRA_HARDENING.sql` for stricter RLS and ownership checks.
6. Fixed an existing syntax error in `js/settings.js`.
7. The final ZIP does NOT include the `.git` directory/history.

## Important: run the SQL
In Supabase Dashboard -> SQL Editor:
1. Run the existing `supabase/SECURITY_HARDENING.sql` if it has not already been run.
2. Run `supabase/SECURITY_EXTRA_HARDENING.sql`.
3. Confirm RLS is enabled for application tables.

## Important security notes
- The `sb_publishable_...` key used by the browser is a publishable client key; it is not a service-role secret.
- Never put `SERVICE_ROLE_KEY`, `BREVO_API_KEY`, database passwords, or other server secrets in HTML/JS.
- Edge Function secrets must remain in Supabase Edge Function environment secrets.
- If a service-role key or database password has ever been exposed publicly, rotate it in Supabase immediately.

## Deployment
Deploy the contents of this ZIP to the same site (`sgunms.in` / `www.sgunms.in`).
After deployment, test:
- Directly opening `home.html` while logged out -> should redirect to login.
- Logged-in user -> protected pages open.
- User A cannot read User B's events/guests.
- Admin page rejects non-admin users.

## Login History (Super Admin)

Run `supabase/LOGIN_HISTORY.sql` once in the Supabase SQL Editor. It creates the append-only `login_logs` table and policies so users can record only their own successful login while only `shashi841505@gmail.com` can read login history.

The Super Admin Dashboard then shows:
- Every successful login
- Name and email
- Login date/time
- Device (Mobile/Desktop)
- Browser
- Operating system
- Screen size
- Latest login for each user
