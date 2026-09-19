-- SGUNMS PRODUCTION SECURITY HARDENING
-- Run this ONCE in Supabase SQL Editor before going live.
-- This migration does not grant public read access to user data.

create or replace function public.sgunms_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select lower(coalesce(auth.jwt()->>'email','')) = 'shashi841505@gmail.com';
$$;

-- Profiles: one row per auth user; no plaintext admin password.
alter table if exists public.profiles enable row level security;
drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_delete_own on public.profiles;
drop policy if exists profiles_admin_select on public.profiles;
drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_select_own on public.profiles for select using (id=auth.uid() or public.sgunms_is_admin());
create policy profiles_insert_own on public.profiles for insert with check (id=auth.uid());
create policy profiles_update_own on public.profiles for update using (id=auth.uid() or public.sgunms_is_admin()) with check (id=auth.uid() or public.sgunms_is_admin());
create policy profiles_delete_own on public.profiles for delete using (id=auth.uid() or public.sgunms_is_admin());

-- Create profile automatically when Auth creates a user.
create or replace function public.sgunms_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles(id,email,name,state,mobile,otp_verified)
  values(
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name',''),
    coalesce(new.raw_user_meta_data->>'state',''),
    coalesce(new.raw_user_meta_data->>'mobile',''),
    false
  )
  on conflict (id) do update set
    email=excluded.email,
    name=coalesce(nullif(excluded.name,''),public.profiles.name),
    state=coalesce(nullif(excluded.state,''),public.profiles.state),
    mobile=coalesce(nullif(excluded.mobile,''),public.profiles.mobile);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_sgunms on auth.users;
create trigger on_auth_user_created_sgunms
after insert on auth.users
for each row execute function public.sgunms_handle_new_user();

-- User-owned legacy tables.
alter table if exists public.setup enable row level security;
drop policy if exists setup_select_own on public.setup;
drop policy if exists setup_insert_own on public.setup;
drop policy if exists setup_update_own on public.setup;
drop policy if exists setup_delete_own on public.setup;
create policy setup_select_own on public.setup for select using (user_id=auth.uid());
create policy setup_insert_own on public.setup for insert with check (user_id=auth.uid());
create policy setup_update_own on public.setup for update using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy setup_delete_own on public.setup for delete using (user_id=auth.uid());

alter table if exists public.guests enable row level security;
drop policy if exists guests_select_own on public.guests;
drop policy if exists guests_insert_own on public.guests;
drop policy if exists guests_update_own on public.guests;
drop policy if exists guests_delete_own on public.guests;
drop policy if exists guests_admin_select on public.guests;
drop policy if exists guests_admin_delete on public.guests;
create policy guests_select_own on public.guests for select using (user_id=auth.uid() or public.sgunms_is_admin());
create policy guests_insert_own on public.guests for insert with check (user_id=auth.uid());
create policy guests_update_own on public.guests for update using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy guests_delete_own on public.guests for delete using (user_id=auth.uid() or public.sgunms_is_admin());

alter table if exists public.cash_history enable row level security;
drop policy if exists cash_history_select_own on public.cash_history;
drop policy if exists cash_history_insert_own on public.cash_history;
drop policy if exists cash_history_update_own on public.cash_history;
drop policy if exists cash_history_delete_own on public.cash_history;
create policy cash_history_select_own on public.cash_history for select using (user_id=auth.uid());
create policy cash_history_insert_own on public.cash_history for insert with check (user_id=auth.uid());
create policy cash_history_update_own on public.cash_history for update using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy cash_history_delete_own on public.cash_history for delete using (user_id=auth.uid());

-- OTP table: client users must not read/write OTP records directly.
alter table if exists public.email_otps enable row level security;
drop policy if exists email_otps_no_client_select on public.email_otps;
drop policy if exists email_otps_no_client_insert on public.email_otps;
drop policy if exists email_otps_no_client_update on public.email_otps;
drop policy if exists email_otps_no_client_delete on public.email_otps;

-- Visitor logs: anyone may submit a visit, but only the admin may read them.
alter table if exists public.visitor_logs enable row level security;
drop policy if exists visitor_logs_insert_public on public.visitor_logs;
drop policy if exists visitor_logs_admin_select on public.visitor_logs;
create policy visitor_logs_insert_public on public.visitor_logs for insert to anon,authenticated with check (true);
create policy visitor_logs_admin_select on public.visitor_logs for select using (public.sgunms_is_admin());

-- Never keep a second copy of the user's password.
alter table if exists public.profiles drop column if exists admin_pass;

-- Recommended hardening indexes.
create index if not exists idx_guests_user_created on public.guests(user_id,created_at desc);
create index if not exists idx_cash_history_user_created on public.cash_history(user_id,created_at desc);
