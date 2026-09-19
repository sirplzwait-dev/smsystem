-- Sagun Management System: Multi-Event Support
-- Run this once in Supabase SQL Editor.

alter table if exists public.setup
  add column if not exists event_type text,
  add column if not exists event_person text,
  add column if not exists event_person_2 text;

alter table if exists public.guests
  add column if not exists event_type text,
  add column if not exists event_person text,
  add column if not exists event_date text,
  add column if not exists gift_type text,
  add column if not exists gift_description text;

-- Keep old wedding records understandable.
update public.setup
set event_type = case
  when wedding_type = 'boy' then 'wedding_barat'
  when wedding_type = 'groom_tilak' then 'wedding_tilak'
  when wedding_type in ('birthday','anniversary','engagement','housewarming','mundan','naming','puja','retirement','other') then wedding_type
  else event_type
end
where event_type is null;

create index if not exists idx_guests_event_type on public.guests(user_id, event_type);
