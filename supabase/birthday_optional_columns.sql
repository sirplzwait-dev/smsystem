-- Optional: run this in Supabase SQL Editor if you want birthday details
-- (event type/person and gift description) stored directly in the guests table.
alter table public.guests add column if not exists event_type text;
alter table public.guests add column if not exists event_person text;
alter table public.guests add column if not exists event_date text;
alter table public.guests add column if not exists gift_type text;
alter table public.guests add column if not exists gift_description text;
