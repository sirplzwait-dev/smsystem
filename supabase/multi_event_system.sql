-- SAGUN SYSTEM: Multi-Event architecture
-- Run this once in Supabase SQL Editor.
-- This adds a separate Events layer so one account can have many events.

create table if not exists public.events (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_name text not null,
  event_type text not null,
  event_date text,
  welcome_name text,
  person1 text,
  person2 text,
  photo1_url text,
  photo2_url text,
  qr_url text,
  created_at timestamptz not null default now()
);

alter table public.guests add column if not exists event_id uuid;

create index if not exists idx_events_user_created on public.events(user_id, created_at desc);
create index if not exists idx_guests_user_event on public.guests(user_id, event_id);

alter table public.events enable row level security;

drop policy if exists "events_select_own" on public.events;
create policy "events_select_own" on public.events
for select using (auth.uid() = user_id);

drop policy if exists "events_insert_own" on public.events;
create policy "events_insert_own" on public.events
for insert with check (auth.uid() = user_id);

drop policy if exists "events_update_own" on public.events;
create policy "events_update_own" on public.events
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "events_delete_own" on public.events;
create policy "events_delete_own" on public.events
for delete using (auth.uid() = user_id);

-- Existing guests RLS policies are preserved. The new event_id column is backward-compatible.
