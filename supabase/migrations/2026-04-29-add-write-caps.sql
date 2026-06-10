-- ============================================================
-- 2026-04-29 — add per-column size caps to every user-writeable
-- table. RLS stays wide open by design; these guard against a
-- runaway anon caller dumping megabyte rows in a loop and
-- exhausting storage.
--
-- Idempotent: each constraint is dropped first if it already
-- exists, so the script is safe to re-run. Paste the whole thing
-- into the Supabase SQL editor.
--
-- ⚠️  Will fail if any existing row already violates a cap. Run
-- the diagnostic block at the bottom first to spot offenders.
-- ============================================================

-- Orders ------------------------------------------------------
alter table orders drop constraint if exists orders_order_ref_len;
alter table orders add constraint orders_order_ref_len
  check (char_length(order_ref) <= 32);

alter table orders drop constraint if exists orders_person_name_len;
alter table orders add constraint orders_person_name_len
  check (char_length(person_name) between 1 and 60);

alter table orders drop constraint if exists orders_items_count;
alter table orders add constraint orders_items_count
  check (jsonb_array_length(items) <= 50);

alter table orders drop constraint if exists orders_notes_len;
alter table orders add constraint orders_notes_len
  check (char_length(coalesce(notes, '')) <= 500);

-- User favourites ---------------------------------------------
alter table user_favourites drop constraint if exists fav_person_name_len;
alter table user_favourites add constraint fav_person_name_len
  check (char_length(person_name) between 1 and 60);

alter table user_favourites drop constraint if exists fav_drink_name_len;
alter table user_favourites add constraint fav_drink_name_len
  check (char_length(drink_name) between 1 and 80);

-- Members -----------------------------------------------------
alter table members drop constraint if exists members_name_len;
alter table members add constraint members_name_len
  check (char_length(name) between 1 and 60);

-- Custom drinks -----------------------------------------------
alter table custom_drinks drop constraint if exists custom_drinks_name_len;
alter table custom_drinks add constraint custom_drinks_name_len
  check (char_length(name) between 1 and 80);

alter table custom_drinks drop constraint if exists custom_drinks_desc_len;
alter table custom_drinks add constraint custom_drinks_desc_len
  check (char_length(description) <= 200);

alter table custom_drinks drop constraint if exists custom_drinks_cat_len;
alter table custom_drinks add constraint custom_drinks_cat_len
  check (char_length(category_id) <= 40);

-- Hidden drinks -----------------------------------------------
alter table hidden_drinks drop constraint if exists hidden_drinks_name_len;
alter table hidden_drinks add constraint hidden_drinks_name_len
  check (char_length(drink_name) between 1 and 80);

-- ============================================================
-- Diagnostics — run these SELECTs first if any ALTER above
-- fails with "violates check constraint". They surface rows
-- that would block the migration.
-- ============================================================

-- select id, char_length(order_ref) as len from orders where char_length(order_ref) > 32;
-- select id, char_length(person_name) as len from orders where char_length(person_name) not between 1 and 60;
-- select id, jsonb_array_length(items) as n from orders where jsonb_array_length(items) > 50;
-- select id, char_length(notes) as len from orders where char_length(coalesce(notes,'')) > 500;
-- select id, char_length(person_name) as len from user_favourites where char_length(person_name) not between 1 and 60;
-- select id, char_length(drink_name) as len from user_favourites where char_length(drink_name) not between 1 and 80;
-- select id, char_length(name) as len from members where char_length(name) not between 1 and 60;
-- select id, char_length(name) as len from custom_drinks where char_length(name) not between 1 and 80;
-- select id, char_length(description) as len from custom_drinks where char_length(description) > 200;
-- select id, char_length(category_id) as len from custom_drinks where char_length(category_id) > 40;
-- select id, char_length(drink_name) as len from hidden_drinks where char_length(drink_name) not between 1 and 80;
