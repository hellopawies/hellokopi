-- ============================================================
-- Run this once in your Supabase project's SQL editor
-- ============================================================

-- Orders table
create table if not exists orders (
  id          uuid        primary key default gen_random_uuid(),
  order_ref   text        not null,
  person_name text        not null,
  items       jsonb       not null default '[]'::jsonb,
  notes       text,
  created_at  timestamptz not null default now()
);

alter table orders enable row level security;
create policy "orders_insert" on orders for insert with check (true);
create policy "orders_select" on orders for select using (true);

-- ============================================================
-- User favourites table (NEW)
-- ============================================================
create table if not exists user_favourites (
  id          uuid        primary key default gen_random_uuid(),
  person_name text        not null,
  drink_name  text        not null,
  created_at  timestamptz not null default now(),
  unique (person_name, drink_name)
);

alter table user_favourites enable row level security;
create policy "favs_select" on user_favourites for select using (true);
create policy "favs_insert" on user_favourites for insert with check (true);
create policy "favs_delete" on user_favourites for delete using (true);

-- ============================================================
-- RPC: crowd favourites ranked by order count (NEW)
-- ============================================================
create or replace function get_crowd_favourites()
returns table(drink_name text, order_count bigint)
language sql
as $$
  select
    items->0->>'name'  as drink_name,
    count(*)           as order_count
  from orders
  where
    items is not null
    and jsonb_array_length(items) > 0
    and items->0->>'name' is not null
  group by drink_name
  order by order_count desc
  limit 20;
$$;
