-- Waypoint tables in Supabase Postgres. Owner: LEAD.  Run once: Supabase dashboard > SQL Editor > paste > Run.
-- Safe to run again. The server fills the tables with the demo data (seed.json) on its first start.
-- Each list is a table of { id, pos (list order), data (the record as JSON) }. Other data lives in app_state.

do $$
declare t text;
begin
  foreach t in array array['depots','outlets','vehicles','orders','deferrals','runs','deliveries',
                           'conflicts','notices','issues','events'] loop
    execute format('create table if not exists public.%I (
      id text primary key,
      pos double precision not null,
      data jsonb not null,
      updated_at timestamptz not null default now()
    )', t);
    execute format('create index if not exists %I on public.%I (pos)', t || '_pos_idx', t);
    -- Row Level Security on and no policies: the public anon key can read or write nothing.
    -- Only the server, with the service role key, reaches these tables.
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

create table if not exists public.app_state (
  name text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.app_state enable row level security;

-- Handy views for browsing in the Table Editor are not needed; filter with e.g.
--   select data from orders where data->>'outletId' = 'OUT014' order by pos;
