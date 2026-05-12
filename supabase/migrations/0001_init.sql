-- ExpressIt Studios — Phase 2 order system schema.
-- Idempotent: drops public schema entirely so re-running gives a clean slate.
-- Run via Supabase Dashboard → SQL Editor → paste → Run.

drop schema if exists public cascade;
create schema public;
grant usage on schema public to anon, authenticated, service_role;
grant all on schema public to postgres, service_role;

-- ---------------------------------------------------------------
-- orders
-- One row per Stripe Checkout completion.
-- ---------------------------------------------------------------
create type order_status as enum (
  'awaiting_photos',
  'photos_received',
  'in_editing',
  'revisions_requested',
  'delivered'
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text unique not null,
  customer_email text not null,
  product_slug text not null,
  variant_id text not null,
  options jsonb not null default '{}'::jsonb,
  price_cents integer not null check (price_cents >= 0),
  status order_status not null default 'awaiting_photos',
  customer_brief text,
  delivered_video_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_customer_email_idx on orders (customer_email);
create index orders_status_idx on orders (status);
create index orders_created_at_idx on orders (created_at desc);

-- ---------------------------------------------------------------
-- uploads
-- Customer-provided source photos for a given order.
-- ---------------------------------------------------------------
create table uploads (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  storage_path text not null,
  original_filename text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  mime_type text not null,
  uploaded_at timestamptz not null default now()
);

create index uploads_order_id_idx on uploads (order_id);

-- ---------------------------------------------------------------
-- updated_at trigger for orders
-- ---------------------------------------------------------------
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger orders_set_updated_at
before update on orders
for each row execute function set_updated_at();

-- ---------------------------------------------------------------
-- Row-level security
-- All access goes through the server using the secret key (which bypasses RLS).
-- We still enable RLS with no policies so the anon key cannot read anything.
-- ---------------------------------------------------------------
alter table orders enable row level security;
alter table uploads enable row level security;

-- ---------------------------------------------------------------
-- Storage bucket for customer photo uploads
-- Created here so it lives in source control. Re-runnable.
-- ---------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('order-uploads', 'order-uploads', false)
on conflict (id) do nothing;
