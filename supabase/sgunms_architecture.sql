-- SGUNMS additive architecture. Run after the existing project SQL.
-- Every user-owned table is protected by auth.uid() = user_id.
create extension if not exists pgcrypto;

create table if not exists public.families (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 name text not null, notes text, created_at timestamptz not null default now()
);
create table if not exists public.family_members (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 family_id uuid references public.families(id) on delete set null, name text not null, mobile text, city text, address text,
 spouse_id uuid, birthday date, anniversary date, notes text, created_at timestamptz not null default now()
);
create table if not exists public.relationships (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 person_a uuid not null references public.family_members(id) on delete cascade,
 relation_code text not null, person_b uuid not null references public.family_members(id) on delete cascade,
 created_at timestamptz not null default now(), unique(user_id,person_a,relation_code,person_b)
);
create table if not exists public.events (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 family_id uuid references public.families(id) on delete set null, event_type text not null, event_name text not null,
 event_date date, venue text, host text, bride_name text, groom_name text, welcome_name text, qr text, notes text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.event_members (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 event_id uuid not null references public.events(id) on delete cascade, member_id uuid not null references public.family_members(id) on delete cascade,
 role text, created_at timestamptz not null default now(), unique(event_id,member_id,role)
);
create table if not exists public.shagun_entries (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 event_id uuid references public.events(id) on delete set null, member_id uuid references public.family_members(id) on delete set null,
 guest_name text not null, village text, mobile text, relationship text, amount numeric(12,2) not null default 0,
 payment_mode text not null check(payment_mode in ('CASH','UPI','GIFT')), gift_description text, remark text,
 entry_date timestamptz not null default now(), created_at timestamptz not null default now()
);
create table if not exists public.gifts (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 event_id uuid references public.events(id) on delete set null, member_id uuid references public.family_members(id) on delete set null,
 description text not null, estimated_value numeric(12,2) default 0, entry_date timestamptz not null default now()
);
create table if not exists public.cash_transactions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 event_id uuid references public.events(id) on delete set null, direction text not null check(direction in ('IN','OUT')),
 category text not null, amount numeric(12,2) not null check(amount >= 0), note text, transaction_date timestamptz not null default now()
);
create table if not exists public.reminders (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 member_id uuid references public.family_members(id) on delete cascade, reminder_type text not null,
 reminder_date date not null, title text not null, enabled boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists public.activity_logs (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 action text not null, entity_type text, entity_id uuid, metadata jsonb default '{}'::jsonb, created_at timestamptz not null default now()
);

create index if not exists idx_families_user on public.families(user_id);
create index if not exists idx_family_members_user on public.family_members(user_id);
create index if not exists idx_relationships_user on public.relationships(user_id);
create index if not exists idx_events_user_date on public.events(user_id,event_date);
create index if not exists idx_shagun_user_event on public.shagun_entries(user_id,event_id);
create index if not exists idx_cash_user_event on public.cash_transactions(user_id,event_id);
create index if not exists idx_reminders_user_date on public.reminders(user_id,reminder_date);

alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.relationships enable row level security;
alter table public.events enable row level security;
alter table public.event_members enable row level security;
alter table public.shagun_entries enable row level security;
alter table public.gifts enable row level security;
alter table public.cash_transactions enable row level security;
alter table public.reminders enable row level security;
alter table public.activity_logs enable row level security;

do $$ declare t text; begin
  foreach t in array array['families','family_members','relationships','events','event_members','shagun_entries','gifts','cash_transactions','reminders','activity_logs'] loop
    execute format('drop policy if exists %I_user_select on public.%I', t||'_user_select', t);
    execute format('drop policy if exists %I_user_insert on public.%I', t||'_user_insert', t);
    execute format('drop policy if exists %I_user_update on public.%I', t||'_user_update', t);
    execute format('drop policy if exists %I_user_delete on public.%I', t||'_user_delete', t);
    execute format('create policy %I_user_select on public.%I for select using (auth.uid() = user_id)', t||'_user_select',t);
    execute format('create policy %I_user_insert on public.%I for insert with check (auth.uid() = user_id)', t||'_user_insert',t);
    execute format('create policy %I_user_update on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', t||'_user_update',t);
    execute format('create policy %I_user_delete on public.%I for delete using (auth.uid() = user_id)', t||'_user_delete',t);
  end loop;
end $$;

-- Guest data is intentionally local for 7 days. Conversion should copy the local
-- guest entries into shagun_entries after a successful registered login.
