-- Migration 0002 — materials, saved addresses, and a per-stop delivery date.
--
-- Safe to run on an existing project that was created from the original
-- schema.sql. Everything here is idempotent. New projects can just run the full
-- schema.sql instead (it already includes all of this).

-- 1. Per-stop delivery date ------------------------------------------------
alter table public.stops add column if not exists delivery_date date;

-- 2. Editable materials master list ----------------------------------------
create table if not exists public.materials (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  icon       text not null default '📦',
  position   integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists materials_position_idx on public.materials (position);

alter table public.materials enable row level security;
drop policy if exists "anon full access to materials" on public.materials;
create policy "anon full access to materials"
  on public.materials for all
  to anon
  using (true)
  with check (true);

insert into public.materials (name, icon, position)
select * from (values
  ('Linens',      '🛏️', 0),
  ('Carpets',     '🪟', 1),
  ('Uniforms',    '👔', 2),
  ('Napkins',     '🧻', 3),
  ('Tablecloths', '🍽️', 4)
) as seed(name, icon, position)
where not exists (select 1 from public.materials);

-- 3. Saved addresses (address book) ----------------------------------------
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

alter table public.saved_addresses enable row level security;
drop policy if exists "anon full access to saved_addresses" on public.saved_addresses;
create policy "anon full access to saved_addresses"
  on public.saved_addresses for all
  to anon
  using (true)
  with check (true);
