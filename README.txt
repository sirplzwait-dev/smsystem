Sagun Management System - Login Final Fix

Files:
- html/login.html
- js/login.js
- js/visitor.js

Fixes:
1. One Supabase client is shared between login.js and visitor.js.
2. Prevents Multiple GoTrueClient instances on the Login page.
3. Visitor logging never creates its own Supabase client and stays silent if no client exists.
4. Localhost Google Analytics is already disabled in login.html; Analytics loads only on sgunms.in/www.sgunms.in.
5. Login and Google Login buttons show loading/disable repeated clicks.
6. Existing Guest Login is not included in this uploaded login.html.
