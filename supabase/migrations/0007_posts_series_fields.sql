-- A2 "Daybook" (2026-11-27): series day, post kind, cross-pillar flag, updated_at.
-- Darq is prod-only: apply by hand, with Noel's go-ahead, before relying on these fields.
alter table public.posts
  add column if not exists series_day int check (series_day between 1 and 30),
  add column if not exists kind text not null default 'feature'
    check (kind in ('series', 'news', 'feature')),
  add column if not exists cross_pillar boolean not null default false,
  add column if not exists updated_at timestamptz;

create unique index if not exists posts_series_day_uniq
  on public.posts (series_day) where series_day is not null;
