-- Adds customer access tokens to orders and a per-video table to support
-- bundle orders (multiple videos per order, each with its own photos + brief).
-- Idempotent within the objects it owns.

-- pgcrypto provides gen_random_bytes for the access-token default.
-- Supabase installs the extension under the `extensions` schema.
create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------
-- orders.access_token
-- 256-bit URL-safe random token. Default generated server-side by the DB
-- so the app never has to remember to set it. Unique across all orders.
-- ---------------------------------------------------------------
alter table orders
  add column if not exists access_token text;

-- Backfill any existing rows that predate this column.
update orders
set access_token = encode(extensions.gen_random_bytes(32), 'base64')
where access_token is null;

alter table orders
  alter column access_token set not null,
  alter column access_token set default encode(extensions.gen_random_bytes(32), 'base64');

do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and indexname = 'orders_access_token_key'
  ) then
    create unique index orders_access_token_key on orders (access_token);
  end if;
end $$;

-- ---------------------------------------------------------------
-- order_videos
-- One row per video the customer needs to deliver assets for.
-- Single-video orders get 1 row; 3-bundle orders get 3 rows. Created by
-- the Stripe webhook when the order row is first inserted.
-- ---------------------------------------------------------------
drop table if exists order_videos cascade;

create type video_status as enum (
  'awaiting_photos',
  'photos_received',
  'in_editing',
  'delivered'
);

create table order_videos (
  order_id uuid not null references orders (id) on delete cascade,
  video_index integer not null check (video_index >= 1),
  brief text not null default '',
  status video_status not null default 'awaiting_photos',
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (order_id, video_index)
);

create index order_videos_status_idx on order_videos (status);

create trigger order_videos_set_updated_at
before update on order_videos
for each row execute function set_updated_at();

alter table order_videos enable row level security;

-- ---------------------------------------------------------------
-- uploads: add video_index so each file is tied to a specific video.
-- Defaults to 1 for existing rows (none in prod yet, but safe).
-- ---------------------------------------------------------------
alter table uploads
  add column if not exists video_index integer not null default 1
    check (video_index >= 1);

-- Make the FK composite so uploads can't reference a video that doesn't exist.
alter table uploads
  drop constraint if exists uploads_order_id_fkey;

alter table uploads
  add constraint uploads_order_video_fkey
    foreign key (order_id, video_index)
    references order_videos (order_id, video_index)
    on delete cascade;

create index if not exists uploads_order_video_idx
  on uploads (order_id, video_index);

-- ---------------------------------------------------------------
-- Backfill: every existing order gets at least video_index = 1 so the
-- FK above is satisfied and the customer page has something to render.
-- Bundle orders (existing prod test order is single-video) will need
-- manual fix-up if any predate this migration; none expected.
-- ---------------------------------------------------------------
insert into order_videos (order_id, video_index)
select id, 1 from orders
on conflict do nothing;
