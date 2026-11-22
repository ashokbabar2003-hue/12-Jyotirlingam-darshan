-- Apply manually in Supabase SQL Editor after review; do not run automatically.
create table if not exists public.darshan_puja_schedules (
  id uuid primary key default gen_random_uuid(),
  slug text not null check (slug in (
    'somnath','mallikarjuna','mahakaleshwar','omkareshwar','kedarnath',
    'bhimashankar','kashi-vishwanath','trimbakeshwar','baidyanath',
    'nageshwar','rameshwaram','grishneshwar'
  )),
  name text not null check (char_length(name) between 1 and 120),
  time_ist time without time zone not null,
  source_url text,
  enabled boolean not null default false,
  verified boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (slug,name)
);
alter table public.darshan_puja_schedules enable row level security;
-- No public or authenticated policies: service-role access only.
-- Application server functions must check admin role before using service role.
create index if not exists darshan_puja_schedules_slug_idx
on public.darshan_puja_schedules (slug);
