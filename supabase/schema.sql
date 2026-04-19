-- Run this once in your Supabase project's SQL editor

create table if not exists orders (
  id          uuid        primary key default gen_random_uuid(),
  order_ref   text        not null,
  person_name text        not null,
  items       jsonb       not null default '[]'::jsonb,
  notes       text,
  created_at  timestamptz not null default now()
);

-- Row Level Security
alter table orders enable row level security;

create policy "allow_insert" on orders
  for insert with check (true);

create policy "allow_select" on orders
  for select using (true);
