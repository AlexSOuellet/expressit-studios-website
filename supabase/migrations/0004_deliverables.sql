-- Phase 2 step 6 — finished-video deliverables + customer approval flow.
-- The admin uploads the edited video; the customer approves it or requests
-- revisions (capped at 2) from their order page.

-- ---------------------------------------------------------------
-- New video_status values.
--   awaiting_approval   — admin uploaded the video, waiting on the customer
--   revisions_requested — customer asked for changes; back to the admin
-- Postgres can't add enum values inside a transaction that also uses them,
-- and `add value if not exists` is idempotent, so this is re-runnable.
-- ---------------------------------------------------------------
alter type video_status add value if not exists 'awaiting_approval';
alter type video_status add value if not exists 'revisions_requested';

-- order_status already has 'revisions_requested'; add the approval state too.
alter type order_status add value if not exists 'awaiting_approval';

-- ---------------------------------------------------------------
-- order_videos: the deliverable + revision tracking.
--   deliverable_path — storage path in the order-deliverables bucket
--   revision_count   — how many times the customer has requested changes
--   revision_note    — the customer's most recent revision request text
-- ---------------------------------------------------------------
alter table order_videos
  add column if not exists deliverable_path text,
  add column if not exists revision_count integer not null default 0
    check (revision_count >= 0),
  add column if not exists revision_note text;

-- ---------------------------------------------------------------
-- Private bucket for finished videos. Same model as order-uploads:
-- RLS-free private bucket, all access via the service-role server client
-- and short-lived signed URLs.
-- ---------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('order-deliverables', 'order-deliverables', false)
on conflict (id) do nothing;
