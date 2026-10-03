-- SGUNMS Super Admin: complete data dashboard support
-- Run this once after SECURITY_HARDENING.sql / SECURITY_EXTRA_HARDENING.sql.
-- Only the configured SGUNMS admin can read these operational tables.

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['events','families','family_members','relationships','event_members','shagun_entries','gifts','cash_transactions','reminders','activity_logs'] LOOP
    IF to_regclass('public.'||t) IS NOT NULL THEN
      EXECUTE format('alter table public.%I enable row level security', t);
      EXECUTE format('drop policy if exists %I on public.%I', t||'_admin_select', t);
      EXECUTE format('create policy %I on public.%I for select to authenticated using (public.sgunms_is_admin())', t||'_admin_select', t);
    END IF;
  END LOOP;
END $$;

-- Exact aggregate counts/sums for the Super Admin dashboard.
create or replace function public.sgunms_admin_data_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r jsonb := '{}'::jsonb;
  n bigint;
  total numeric := 0;
  cash numeric := 0;
  upi numeric := 0;
  gift numeric := 0;
  gift_count bigint := 0;
begin
  if not public.sgunms_is_admin() then raise exception 'Access denied'; end if;

  if to_regclass('public.profiles') is not null then execute 'select count(*) from public.profiles' into n; r := r || jsonb_build_object('users',n); end if;
  if to_regclass('public.events') is not null then execute 'select count(*) from public.events' into n; r := r || jsonb_build_object('events',n); end if;
  if to_regclass('public.guests') is not null then
    execute 'select count(*) from public.guests' into n; r := r || jsonb_build_object('guests',n);
    execute 'select coalesce(sum(amount),0), coalesce(sum(case when lower(coalesce(payment_mode, ))=cash then amount else 0 end),0), coalesce(sum(case when lower(coalesce(payment_mode, ))=''upi'' then amount else 0 end),0), coalesce(sum(case when lower(coalesce(payment_mode, ))=gift then amount else 0 end),0), coalesce(sum(case when lower(coalesce(payment_mode, ))=''gift'' then 1 else 0 end),0) from public.guests' into total,cash,upi,gift,gift_count;
    r := r || jsonb_build_object('collection',total,'cash',cash,'upi',upi,'gift_amount',gift,'gift_count',gift_count);
  end if;
  if to_regclass('public.gifts') is not null then execute 'select count(*) from public.gifts' into n; r := r || jsonb_build_object('gifts',n); end if;
  if to_regclass('public.families') is not null then execute 'select count(*) from public.families' into n; r := r || jsonb_build_object('families',n); end if;
  if to_regclass('public.family_members') is not null then execute 'select count(*) from public.family_members' into n; r := r || jsonb_build_object('members',n); end if;
  if to_regclass('public.cash_transactions') is not null then execute 'select count(*) from public.cash_transactions' into n; r := r || jsonb_build_object('transactions',n); end if;
  if to_regclass('public.reminders') is not null then execute 'select count(*) from public.reminders' into n; r := r || jsonb_build_object('reminders',n); end if;
  if to_regclass('public.activity_logs') is not null then execute 'select count(*) from public.activity_logs' into n; r := r || jsonb_build_object('activity',n); end if;
  if to_regclass('public.login_logs') is not null then execute 'select count(*) from public.login_logs' into n; r := r || jsonb_build_object('logins',n); end if;
  if to_regclass('public.visitor_logs') is not null then execute 'select count(*) from public.visitor_logs' into n; r := r || jsonb_build_object('visitors',n); end if;
  return r;
end $$;

grant execute on function public.sgunms_admin_data_stats() to authenticated;


-- Per-user activity/collection summary for the Super Admin.
create or replace function public.sgunms_admin_user_stats()
returns table(
  user_id uuid,
  name text,
  email text,
  events bigint,
  guests bigint,
  collection numeric,
  last_login timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.sgunms_is_admin() then raise exception 'Access denied'; end if;
  return query
  select p.id,
         coalesce(p.name,'-')::text,
         coalesce(p.email,'-')::text,
         coalesce((select count(*) from public.events e where e.user_id=p.id),0)::bigint,
         coalesce((select count(*) from public.guests g where g.user_id=p.id),0)::bigint,
         coalesce((select sum(g.amount) from public.guests g where g.user_id=p.id),0)::numeric,
         (select max(l.login_at) from public.login_logs l where l.user_id=p.id)
  from public.profiles p
  order by p.created_at desc;
end $$;

grant execute on function public.sgunms_admin_user_stats() to authenticated;
