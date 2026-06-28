-- ============================================================================
-- Linen Delivery Route Creator — database schema
-- Paste this whole file into the Supabase SQL Editor and click "Run".
-- Safe to run more than once.
-- ============================================================================

-- ---------- routes ----------------------------------------------------------
create table if not exists public.routes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name         text not null default 'Untitled route',
  delivery_day text,                       -- e.g. 'Monday' .. 'Sunday' (nullable)
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------- stops -----------------------------------------------------------
create table if not exists public.stops (
  id         uuid primary key default gen_random_uuid(),
  route_id   uuid not null references public.routes (id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  position   integer not null default 0,   -- stop order within the route
  label      text not null default '',     -- customer / location name
  address    text not null default '',     -- full street address (for maps export)
  lat        double precision,             -- captured from address autocomplete
  lng        double precision,
  notes      text not null default '',
  items      jsonb not null default '[]'::jsonb,  -- [{ "type": "napkins", "qty": 20, "note": "" }]
  created_at timestamptz not null default now()
);

create index if not exists stops_route_id_idx on public.stops (route_id);
create index if not exists routes_user_id_idx on public.routes (user_id);

-- ---------- keep routes.updated_at fresh ------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists routes_touch_updated_at on public.routes;
create trigger routes_touch_updated_at
  before update on public.routes
  for each row execute function public.touch_updated_at();

-- ============================================================================
-- Row-Level Security: each user can only see and modify their own rows.
-- ============================================================================
alter table public.routes enable row level security;
alter table public.stops  enable row level security;

drop policy if exists "routes are private" on public.routes;
create policy "routes are private" on public.routes
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "stops are private" on public.stops;
create policy "stops are private" on public.stops
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
