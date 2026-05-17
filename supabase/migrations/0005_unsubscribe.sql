-- Email deliverability — record one-click unsubscribes so the
-- List-Unsubscribe header on customer emails is honored honestly.
-- Transactional sends are not gated on this column (an order's status
-- emails are part of the service we charge for); we record it so we
-- can suppress any future marketing/broadcast sends and so Gmail's
-- one-click POST has a real side-effect.

alter table orders
  add column if not exists unsubscribed_at timestamptz;
