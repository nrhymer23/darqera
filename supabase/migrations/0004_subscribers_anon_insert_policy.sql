-- Newsletter capture inserts from the browser with the anon key; RLS was
-- enabled with no policies so every signup silently failed. Allow inserts
-- only — reads/updates/deletes stay denied.
-- Applied to the live project 2026-07-13 (migration: subscribers_anon_insert_policy).
create policy "Anyone can subscribe"
  on public.subscribers
  for insert
  to anon, authenticated
  with check (true);
