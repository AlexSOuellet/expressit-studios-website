-- Per-video vibe picker. Optional (null = customer didn't specify; default
-- applies for personal memory videos which don't surface a vibe picker).

alter table order_videos
  add column if not exists vibe text;
