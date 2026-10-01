-- Optional cover image for posts. Null falls back to the generative pillar art.
-- cover_alt is required by the admin UI whenever cover_image is set.
alter table public.posts
  add column if not exists cover_image text,
  add column if not exists cover_alt text;
