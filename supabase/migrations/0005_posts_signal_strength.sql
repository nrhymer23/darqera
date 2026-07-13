-- Data-driven Signal Strength (1 = early, 2 = emerging, 3 = shifting).
-- Null falls back to the site default; pipeline sets it from cluster consensus.
-- Applied to the live project 2026-07-13 (migration: posts_signal_strength).
alter table public.posts
  add column if not exists signal_strength integer
  check (signal_strength between 1 and 3);
