-- Linen Delivery Route Creator — database schema
-- Run this in your Supabase project: Dashboard -> SQL Editor -> New query -> paste -> Run.
--
-- This app has NO login. Access uses the public "anon" role, so the policies
-- below grant anon full read/write. That means anyone with your app URL can
-- read and edit the data. If you later want private, per-user data, replace the
-- anon policies with auth-based ones.

-- Needed for gen_random_uuid().
create extension if not exists pgcrypto;

-- Routes -------------------------------------------------------------------
create table if not exists public.routes (
  id           uuid primary key default gen_random_uuid(),
  name         text not null default 'New route',
  delivery_day text,                          -- 'Monday' .. 'Sunday', or null
  notes        text not null default '',
  created_at   timestamptz not null default now()
);

-- Stops --------------------------------------------------------------------
create table if not exists public.stops (
  id        uuid primary key default gen_random_uuid(),
  route_id  uuid not null references public.routes (id) on delete cascade,
  name      text not null default '',
  address   text not null default '',
  date      text not null default '',           -- 'YYYY-MM-DD' delivery date, or ''
  notes     text not null default '',
  position  integer not null default 0,
  items     jsonb not null default '[]'::jsonb, -- [{ "name": "Napkins", "quantity": 50 }]
  created_at timestamptz not null default now()
);

-- Safe to re-run on an existing database: adds the date column if missing.
alter table public.stops add column if not exists date text not null default '';

create index if not exists stops_route_id_position_idx
  on public.stops (route_id, position);

-- Materials ----------------------------------------------------------------
-- Editable catalog of linens & delivery materials shown in the "add item"
-- dropdown. Seeded from the app the first time it loads if empty.
create table if not exists public.materials (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  icon       text not null default '📦',
  created_at timestamptz not null default now()
);

-- Row Level Security -------------------------------------------------------
alter table public.routes    enable row level security;
alter table public.stops     enable row level security;
alter table public.materials enable row level security;

-- Grant the anon role full access (no login in this app).
-- Drop first so re-running this script is safe.
drop policy if exists "anon full access to routes" on public.routes;
create policy "anon full access to routes"
  on public.routes for all
  to anon
  using (true)
  with check (true);

drop policy if exists "anon full access to stops" on public.stops;
create policy "anon full access to stops"
  on public.stops for all
  to anon
  using (true)
  with check (true);

drop policy if exists "anon full access to materials" on public.materials;
create policy "anon full access to materials"
  on public.materials for all
  to anon
  using (true)
  with check (true);
