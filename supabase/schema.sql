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
  notes     text not null default '',
  position  integer not null default 0,
  items     jsonb not null default '[]'::jsonb, -- [{ "name": "Napkins", "quantity": 50 }]
  delivery_date date,                          -- specific delivery date, or null
  created_at timestamptz not null default now()
);

-- Add delivery_date to pre-existing installs that created stops before this column.
alter table public.stops add column if not exists delivery_date date;

create index if not exists stops_route_id_position_idx
  on public.stops (route_id, position);

-- Materials ----------------------------------------------------------------
-- The editable master list of linens & delivery materials the user can add to
-- a stop. Managed from the "Materials" screen in the app.
create table if not exists public.materials (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  icon       text not null default '📦',
  position   integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists materials_position_idx on public.materials (position);

-- Saved addresses ----------------------------------------------------------
-- A reusable address book. Picking one in the stop editor auto-fills the stop's
-- name and address.
create table if not exists public.saved_addresses (
  id         uuid primary key default gen_random_uuid(),
  label      text not null default '',
  address    text not null default '',
  notes      text not null default '',
  position   integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists saved_addresses_position_idx
  on public.saved_addresses (position);

-- Row Level Security -------------------------------------------------------
alter table public.routes          enable row level security;
alter table public.stops           enable row level security;
alter table public.materials       enable row level security;
alter table public.saved_addresses enable row level security;

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

drop policy if exists "anon full access to saved_addresses" on public.saved_addresses;
create policy "anon full access to saved_addresses"
  on public.saved_addresses for all
  to anon
  using (true)
  with check (true);

-- Seed the default materials only when the table is empty, so re-running this
-- script is safe and never clobbers a user's edited list.
insert into public.materials (name, icon, position)
select * from (values
  ('Linens',      '🛏️', 0),
  ('Carpets',     '🪟', 1),
  ('Uniforms',    '👔', 2),
  ('Napkins',     '🧻', 3),
  ('Tablecloths', '🍽️', 4)
) as seed(name, icon, position)
where not exists (select 1 from public.materials);
