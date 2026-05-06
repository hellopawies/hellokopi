-- ============================================================
-- Hello Kopi — Supabase schema. Run once in your project's SQL editor.
--
-- Threat model: every table allows anonymous read/write. This is an
-- internal trusted-office tool — anyone with the public anon key
-- (which ships in the static bundle) can insert, update, or delete
-- any row. The admin page is a soft client-side gate, not a security
-- boundary. See README.md "Threat model" before tightening these
-- policies — the admin page assumes anon can mutate every table.
-- ============================================================

-- Orders ------------------------------------------------------
create table if not exists orders (
  id          uuid        primary key default gen_random_uuid(),
  order_ref   text        not null,
  person_name text        not null,
  items       jsonb       not null default '[]'::jsonb,
  notes       text,
  created_at  timestamptz not null default now()
);

alter table orders enable row level security;
create policy "orders_select" on orders for select using (true);
create policy "orders_insert" on orders for insert with check (true);
create policy "orders_update" on orders for update using (true);
create policy "orders_delete" on orders for delete using (true);

-- User favourites (per-person saved picks) -------------------
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

-- Members (the office name list shown on the greeting page) --
create table if not exists members (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null,
  sort_order integer     not null default 0,
  created_at timestamptz not null default now()
);

alter table members enable row level security;
create policy "members_select" on members for select using (true);
create policy "members_insert" on members for insert with check (true);
create policy "members_update" on members for update using (true);
create policy "members_delete" on members for delete using (true);

-- Custom drinks (admin-added entries that augment the static menu) --
create table if not exists custom_drinks (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  description text        not null default '',
  category_id text        not null,
  created_at  timestamptz not null default now()
);

alter table custom_drinks enable row level security;
create policy "custom_drinks_select" on custom_drinks for select using (true);
create policy "custom_drinks_insert" on custom_drinks for insert with check (true);
create policy "custom_drinks_delete" on custom_drinks for delete using (true);

-- Hidden drinks (admin-flagged drinks suppressed from the menu) -----
create table if not exists hidden_drinks (
  id         uuid        primary key default gen_random_uuid(),
  drink_name text        not null unique,
  created_at timestamptz not null default now()
);

alter table hidden_drinks enable row level security;
create policy "hidden_drinks_select" on hidden_drinks for select using (true);
create policy "hidden_drinks_insert" on hidden_drinks for insert with check (true);
create policy "hidden_drinks_delete" on hidden_drinks for delete using (true);
