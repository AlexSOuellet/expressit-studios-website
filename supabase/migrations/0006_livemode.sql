-- Track whether each order originated from a Stripe live-mode or test-mode
-- session. The Stripe webhook event payload carries `livemode: boolean`;
-- we mirror it on the order row so the admin dashboard can filter test
-- chatter out of the production view and so the wipe-test-data script
-- has a clean predicate.
--
-- Default false because every row that exists today was created in test
-- mode (Stripe LIVE hasn't been enabled yet). We tighten this constraint
-- once live data starts arriving.

alter table orders
  add column if not exists livemode boolean not null default false;

create index if not exists orders_livemode_created_at_idx
  on orders (livemode, created_at desc);
