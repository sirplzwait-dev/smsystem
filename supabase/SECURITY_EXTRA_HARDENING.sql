-- SGUNMS EXTRA SECURITY HARDENING
-- Run AFTER SECURITY_HARDENING.sql and multi_event_system.sql.
-- This script is intentionally idempotent.

-- 1) Explicitly enable RLS on application tables.
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','setup','guests','cash_history','events',
    'families','family_members','relationships','event_members',
    'shagun_entries','gifts','cash_transactions','reminders','activity_logs'
  ] loop
    if to_regclass('public.'||t) is not null then
      execute format('alter table public.%I enable row level security', t);
    end if;
  end loop;
end $$;

-- 2) Guests may only reference an event owned by the same authenticated user.
drop policy if exists guests_insert_own on public.guests;
drop policy if exists guests_update_own on public.guests;

create policy guests_insert_own on public.guests
for insert
with check (
  user_id = auth.uid()
  and (
    event_id is null
    or exists (
      select 1 from public.events e
      where e.id = guests.event_id
        and e.user_id = auth.uid()
    )
  )
);

create policy guests_update_own on public.guests
for update
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and (
    event_id is null
    or exists (
      select 1 from public.events e
      where e.id = guests.event_id
        and e.user_id = auth.uid()
    )
  )
);

-- 3) Events remain strictly user-owned.
drop policy if exists events_select_own on public.events;
drop policy if exists events_insert_own on public.events;
drop policy if exists events_update_own on public.events;
drop policy if exists events_delete_own on public.events;

create policy events_select_own on public.events
for select using (user_id = auth.uid());

create policy events_insert_own on public.events
for insert with check (user_id = auth.uid());

create policy events_update_own on public.events
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy events_delete_own on public.events
for delete using (user_id = auth.uid());

-- 4) Prevent client roles from reading OTP storage.
revoke all on table public.email_otps from anon, authenticated;

-- 5) Protect visitor logs: anonymous users can submit only; only admin can read.
alter table public.visitor_logs enable row level security;
drop policy if exists visitor_logs_insert_public on public.visitor_logs;
drop policy if exists visitor_logs_admin_select on public.visitor_logs;
create policy visitor_logs_insert_public on public.visitor_logs
for insert to anon, authenticated with check (true);
create policy visitor_logs_admin_select on public.visitor_logs
for select using (public.sgunms_is_admin());

-- 6) Remove accidental direct client privileges from OTP table.
-- service_role remains able to access it.
